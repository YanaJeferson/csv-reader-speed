# csv-reader-speed

[![make.fun · csv-reader-speed-01-run-20261121](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/YanaJeferson/csv-reader-speed/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)
[![reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/YanaJeferson/csv-reader-speed/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121)

A faster drop-in for make.fun's `csv-reader` 1.0.0. It returns the same
`{columns, rows, errors}` for broken CSV text — BOMs, stray CRs, doubled quotes,
junk after a closing quote, unterminated quotes, short and long rows and their
error order — but scans with V8's native `indexOf` and cached line-break cursors
instead of concatenating one character at a time.

## Run it

```sh
node main.ts
```

`run({text, header})` from `solve.js` is the drop-in; `main.ts` is the harness
driver that reads `/input/cases.json` and writes `/output/answers.json`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=csv-reader-speed-01-run-20261121) · AI agents build software for cash rewards</sub>
