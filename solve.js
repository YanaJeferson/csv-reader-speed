// A faster drop-in for make.fun's csv-reader 1.0.0, with byte-for-byte identical answers.
//
// The reference builds every field one character at a time. Here commas are found with
// V8's native indexOf, ordinary runs are copied as whole slices, and the next LF / CR are
// kept as cursors so a line is never rescanned from each of its fields. The broken-row
// policy (BOM, stray CR, doubled quotes, junk after a closing quote, unterminated quotes,
// short/long rows and their error order) is the reference's exactly.

const COMMA = 0, LINE_BREAK = 1, END = 2;

export function run(input) {
  const raw = input.text;
  const text = typeof raw === 'string' ? raw : String(raw);
  const header = input.header === true;
  const len = text.length;
  const errors = [];
  const rows = [];
  let columns = null, width = -1;
  let pos = text.charCodeAt(0) === 0xFEFF ? 1 : 0;
  let line = 1, recordLine = 1, recordRow = null;
  let nextLF = text.indexOf('\n', pos);
  let nextCR = text.indexOf('\r', pos);

  function sync() {
    if (nextLF !== -1 && nextLF < pos) nextLF = text.indexOf('\n', pos);
    if (nextCR !== -1 && nextCR < pos) nextCR = text.indexOf('\r', pos);
  }

  while (true) {
    while (pos < len) {
      const c = text.charCodeAt(pos);
      if (c === 10) { pos += 1; line += 1; }
      else if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; }
      else break;
    }
    if (pos >= len) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let wasQuoted = false;
    let value, ended, added, needUnquoted, checkJunk;

    while (true) {
      added = 0;
      ended = END;
      if (text.charCodeAt(pos) === 34) {
        wasQuoted = true;
        const open = pos, openLine = line;
        pos += 1;
        value = '';
        let closed = false;
        while (true) {
          sync();
          const q = text.indexOf('"', pos);
          let next = q, kind = 0;
          if (nextCR !== -1 && (next === -1 || nextCR < next)) { next = nextCR; kind = 1; }
          if (nextLF !== -1 && (next === -1 || nextLF < next)) { next = nextLF; kind = 2; }
          if (next === -1) {
            if (pos < len) value += text.slice(pos);
            pos = len;
            break;
          }
          if (next > pos) value += text.slice(pos, next);
          if (kind === 0) {
            if (text.charCodeAt(next + 1) === 34) { value += '"'; pos = next + 2; continue; }
            pos = next + 1;
            closed = true;
            break;
          }
          if (kind === 1) {
            value += '\n';
            line += 1;
            pos = text.charCodeAt(next + 1) === 10 ? next + 2 : next + 1;
            continue;
          }
          value += '\n';
          line += 1;
          pos = next + 1;
        }
        if (!closed) {
          pos = open + 1;
          line = openLine;
          nextLF = text.indexOf('\n', pos);
          nextCR = text.indexOf('\r', pos);
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          value = '"';
          needUnquoted = true;
          checkJunk = false;
        } else if (pos >= len) {
          ended = END;
          needUnquoted = false;
          checkJunk = false;
        } else {
          const c = text.charCodeAt(pos);
          if (c === 44) { pos += 1; ended = COMMA; needUnquoted = false; checkJunk = false; }
          else if (c === 10) { pos += 1; line += 1; ended = LINE_BREAK; needUnquoted = false; checkJunk = false; }
          else if (c === 13 && text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; ended = LINE_BREAK; needUnquoted = false; checkJunk = false; }
          else { needUnquoted = true; checkJunk = true; }
        }
      } else {
        wasQuoted = false;
        value = '';
        needUnquoted = true;
        checkJunk = false;
      }

      if (needUnquoted) {
        while (pos < len) {
          sync();
          const comma = text.indexOf(',', pos);
          let next = comma, kind = COMMA;
          if (nextCR !== -1 && (next === -1 || nextCR < next)) { next = nextCR; kind = 2; }
          if (nextLF !== -1 && (next === -1 || nextLF < next)) { next = nextLF; kind = LINE_BREAK; }
          if (next === -1) {
            if (pos < len) {
              const s = text.slice(pos);
              value += s;
              added += s.length;
              pos = len;
            }
            ended = END;
            break;
          }
          if (next > pos) {
            const s = text.slice(pos, next);
            value += s;
            added += s.length;
            pos = next;
          }
          if (kind === COMMA) { pos += 1; ended = COMMA; break; }
          if (kind === LINE_BREAK) { pos += 1; line += 1; ended = LINE_BREAK; break; }
          if (text.charCodeAt(pos + 1) === 10) { pos += 2; line += 1; ended = LINE_BREAK; break; }
          errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
          pos += 1;
        }
        if (checkJunk && added > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
      }
      fields.push(value);
      if (ended !== COMMA) break;
    }

    if (fields.length === 1 && fields[0] === '' && !wasQuoted) continue;
    if (width < 0) width = fields.length;
    if (header && columns === null) { columns = fields; continue; }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
