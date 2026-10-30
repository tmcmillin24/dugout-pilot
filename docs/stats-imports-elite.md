# CSV imports and Elite coaching tools

## Data and import workflow

Reference: the user-supplied GameChanger season export (181 columns: 3 identity fields and 178 statistics; 12 player rows plus totals/glossary). The private source file is not checked into the repository. It includes position innings in the Fielding section; these are reviewed playing-history suggestions, not a declaration of positional proficiency.

Import accepts variable rosters (guardrail: 200 rows / 1 MB). No logic assumes 12 players. Tests cover 1, 10, 12, 16, 18 and 24 players. The practice generator retains its existing separate attendance limits; this change does not alter that engine.

The parser finds First/Last or Player name headers, preserves each numeric statistic under its Batting/Pitching/Fielding section, excludes Totals and Glossary, handles BOM/quoted CSV, rejects invalid rates/innings and distinguishes identically named stats across sections. Rates are stored as exported; percentage columns stay on the 0–100 scale. Unknown numeric columns remain viewable. Non-numeric placeholders are missing, not zero. CSV only; PDF/XLSX are not supported.

Review classifies each row as an exact match, a unique initial/last-name plus jersey match, a new player or an unresolved match. Number alone never identifies a player. Coaches can match, add or explicitly skip; ambiguous matches must be resolved. Existing names/nonempty jersey numbers are retained; blank jersey numbers can be filled. New players receive reviewed positions; merging additional reviewed positions into existing players is opt-in and preserves existing positions. Duplicate player rows or destination matches are rejected.

`applyStatsImport` creates players and replaces destination stats in one immutable board update, saved by the existing revision-checked `save_team_board` RPC. Conflicts/failures retain the preview and do not apply a partial roster. No new migration, native module, provider secret or API call is introduced. Supabase's existing 2 MB board limit still applies.

Season imports replace a snapshot keyed by the coach-selected year; game imports replace one selected game's stats and store its year. Neither overwrites lineups, pitching logs or game history. A game CSV with any GP > 1 is rejected as a season/multi-game export. A snapshot is authoritative for season views and is never summed with individual game records. Re-importing an identical destination fingerprint or assigning one game file to a second game is rejected. Updated files replace existing data only after explicit confirmation. Import source label and timestamp remain available.

## Viewing statistics

Home links to Team Stats. Season / Games / Players views have Batting / Pitching / Fielding groups. Columns uses all imported numeric columns. Preferences are per signed-in user, selected team and group, stored locally; they only hide columns and never change saved data or algorithm inputs. Default views are compact and horizontal tables retain names/jerseys. Missing values show a dash. Game history is displayed separately from a season snapshot.

Aggregating games sums known counting stats and baseball innings as outs (e.g. 1.2 + 2.2 = 4.1). It derives AVG/OBP/SLG/OPS/WHIP/FPCT only from complete supporting counts. Unsupported ratios aren't averaged or summed. ERA is retained from a season or single-game import and not recomputed across games without an event innings basis. A season-only CSV cannot produce recent-game trends.

## Elite behavior

Existing test access, active access and unexpired Elite trials enable these tools. This uses the application's current access model; it is not a new Standard-vs-Elite billing system or purchase flow. Billing entitlement integration remains separate. Existing server authorization and revision checks still guard all saved board changes. Algorithms execute locally and consume no paid AI requests.

- Batting: choose attending players, lock slots, generate and compare current vs suggested slots, review per-player rates/sample warnings, then Apply. Coach drag/reorder remains unchanged. On-base/power/strikeout-avoidance weights are a deterministic heuristic, not an optimal-run or win prediction. Rates shrink toward the selected team's baseline with 12 PA prior weight; under 20 PA is labeled small. No OBP/supporting on-base data means no generated order; players missing that data remain after ranked players unless locked.
- Pitching: only roster pitchers selected as available are ranked, using strikeout-minus-walk rate and WHIP, with imported outs shown. No usable IP/SO/BB/WHIP means no ranking. Recorded innings restrictions are checked only for the reviewed USSSA 2026 baseball 7U–14U chart (Rule 7.05.B, official 2026 by-laws). Unsupported profiles require coach verification rather than reusing baseball limits. Season totals are never treated as dated recent workload. Missing dates, outside-team workload, suspended-game portions and event pitch-count exceptions require coach review. Applying the starter requires explicit confirmation of complete history/event eligibility/availability, and known rest-limit/re-entry flags block application. This does not certify medical readiness or eligibility.
- Comparisons: proposal shows each current slot and proposed slot; no invented expected score.
- Trends: up to three dated imported games vs selected season data; sample size shown. Requires game imports.
- Practice: descriptive thresholds (K/PA >= 25%, BB/BF >= 15%, E/TC >= 15%, minimum denominators) suggest a focus. Practice page applies only the selected focus; coach still builds/edits the plan using existing resource-aware drills.
- Reports: descriptive per-player text from the chosen season; native Share opens only on the coach's tap. No messages are sent automatically.

## Validation

`DUGOUT_TEST_CSV='../upload/SEASON CSV.csv' node scripts/test-stats-workflow.mjs` tests the actual supplied file locally in addition to synthetic, non-private fixtures. Coverage includes variable rosters, attendance subsets, locks, fresh/existing rosters, initial/last matching, changed jerseys/ambiguity, repeated/updated imports, no double counting, sections/positions, outs arithmetic, invalid rates and pitcher filtering/rest flags. `test-team-stats.mjs`, `test-lineup-mode-panels.mjs`, rule-context regression tests, TypeScript, scoped lint and iOS export also pass.

The database security test requires its optional PGlite dependency, which is not installed in this workspace; it was not run for this change. SQL and provider authorization are unchanged. Native picker, share sheet, saved-board upload and visual behavior on an actual iPhone/iPad require the planned device test. No live user data was uploaded during development.
