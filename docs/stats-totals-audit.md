# Stat totals audit — 2026-10-30

Read-only calculation audit against the supplied SEASON CSV.csv. No total formulas or imported data were modified as part of this audit.

## Original file, with every player included

| Item | Independent result | CSV total |
|---|---:|---:|
| Games played | 3 | 3 |
| Plate appearances | 82 | 82 |
| At bats | 55 | 55 |
| Hits | 21 | 21 |
| Runs | 31 | 31 |
| RBI | 15 | 15 |
| Walks, batting | 21 | 21 |
| Strikeouts, batting | 14 | 14 |
| Hit by pitch | 6 | 6 |
| AVG | 21 / 55 = .382 | .382 |
| OBP | (21 + 21 + 6) / (55 + 21 + 6 + 0) = .585 | .585 |
| SLG | 23 / 55 = .418 | .418 |
| OPS | unrounded OBP + SLG = 1.004 | 1.004 |
| Pitching outs | 34 = 11.1 IP | 11.1 IP |
| Hits allowed | 25 | 25 |
| Runs allowed | 32 | 32 |
| Earned runs allowed | 31 | 31 |
| Walks, pitching | 23 | 23 |
| Strikeouts, pitching | 18 | 18 |
| Pitches | 341 | 341 |
| ERA | 31 × 6 × 3 / 34 = 16.41 | 16.41 |
| WHIP | (25 + 23) × 3 / 34 = 4.235294... | 4.235 |
| Fielding chances | 46 | 46 |
| Assists / putouts / errors | 10 / 34 / 2 | 10 / 34 / 2 |
| Fielding percentage | 44 / 46 = .957 | .957 |

Independent checks: 86 additive counting columns matched the CSV team totals (excluding GP, which is not a sum of individual appearances). 78 player/team rate checks using rational arithmetic matched to the export's rounding precision. The actual application's teamSummary output matched the six displayed snapshot statistics. Games Played uses the team total of 3 rather than the 36 summed player appearances. ERA uses the demonstrated six-inning basis, not nine; innings are outs, not decimal fractions.

## Confirmed issues / limitations

1. **Skipped import rows remove their contributions from the displayed team totals.** The parser retains team GP but discards the other official team-total cells, and teamSummary uses included player records. Reproduction with Williams skipped: 19 H, 28 R, 18 BB, .365 AVG, .566 OBP and 19.44 ERA, instead of the complete-file totals above. This is a subset total presented as a team summary; imported coverage is not sufficiently apparent after the review closes. It also affects players intentionally left out of a season import even though their historical performance is still part of the team's season.
2. **Correcting a game already included in a season baseline doesn't update that baseline.** The game detail changes, but included games remain excluded from additions. Correcting an added game does update its season contribution correctly. Safely adjusting a covered game requires its baseline version or a fresh season export; adding the whole corrected game would count it twice.
3. **Partial game exports can make cumulative fields unavailable.** Combining a baseline with a batting section containing H/R but no AB removes the cumulative AB/AVG rather than displaying a fabricated sum. The app correctly shows a dash, but the UI doesn't clearly identify which missing columns caused it.
4. **Many advanced rate columns aren't recomputed across multiple records.** Raw imports preserve them, but aggregation currently derives AVG/OBP/SLG/OPS/WHIP/FPCT/ERA only. Other ratios can disappear in cumulative views. They aren't incorrectly summed.
5. **WHIP display precision differs from the supplied export.** The app formats it to two decimals (4.24) whereas the file shows three (4.235). This is a display rounding difference, not an incorrect underlying total.

The audit doesn't establish which value is currently on the user's signed-in device. No live board/account data was accessed. Import handling issues above were reproduced locally without changing production data.
