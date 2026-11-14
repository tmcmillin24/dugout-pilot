# Organizations and director dashboard

Dugout Pilot only. Supabase project: `rlxscbutvxvsijgtcrbq`.

## Activation

Apply `supabase/migrations/202611140001_organizations.sql` in that project's SQL Editor, then update/reload the client. The migration does not modify subscriptions, trials, memberships or existing stats. Existing independent teams keep working. Native builds need no new modules.

Open **Account → Organizations**, or **Teams → Organizations · Director dashboard**. Any signed-in user can create an organization for free and receive its unique code. Organization creation retries reuse a request UUID. Each organization has one director, its creating account; an account can own multiple organizations. A team can belong to one organization at a time.

New team: the optional code is submitted atomically with team creation. An invalid code rolls the team creation back. Existing team: **Teams → Manage → Team details → Organization**. Only a team owner can connect or disconnect a team. Connecting automatically enables director stats access with no separate permission toggle or warning. Independent teams skip the code.

A director can rotate the code or remove a connected team. Rotation invalidates the old code for future connections; it does not unlink existing teams. Disconnecting removes director access on subsequent server requests and preserves the team's roster/stats. Director data is not written into device storage. The selected team's data refreshes every 30 seconds while active, on returning to foreground, and on pull-to-refresh. Directory refresh is available through pull-to-refresh. Team directory fetches 50 records per page and offers Load more.

## Access model

Organization codes never grant director status or coaching permissions. Server functions verify the director's authenticated user ID and the current team link on every request. The organizations table has owner-only RLS; the association table has no direct client access. Directors cannot read the raw team board, edit lineups/rosters, manage staff or change billing through this feature.

The director stats endpoint projects player names/numbers/positions, season and sport context, and imported season/game statistics. It excludes player notes, game notes, practice plans, staff emails, invitation details and custom event rules. It uses the same underlying team board as coaching imports; no re-upload or duplicate stats copy exists.

## Development logic

`src/lib/organizations/development.ts` reuses the player-specific development engine and the same `statsSource` aggregation used by team stats. Season CSV replaces its baseline and additional game imports add according to existing contribution flags, avoiding double counting. Teams and seasons are assessed separately; scores are coaching heuristics, not validated age benchmarks or an overall player rating.

Established shortlist requirements:

| Signal | Required imported counts | Minimum sample |
|---|---|---|
| Strikeout frequency / at-bat decisions | Batting PA, SO; BB for decisions | 20 PA |
| Extra-base impact | Batting AB, H, TB, PA, SO | 30 AB |
| Pitching walk frequency | Pitching BB, BF | 30 BF |
| Recorded fielding errors | Fielding E, TC | 20 chances |
| Steal decisions | Batting SB, CS | 10 attempts |

Existing evidence thresholds in `player-development.ts` apply after these minimums. The dashboard shows at most three eligible players, not a forced bottom three. Early/small-sample observations remain labeled in individual detail. Missing data is never treated as zero. The drill suggestions are coaching starting points, not diagnoses inferred from stats. No Gemini request is made for dashboard recommendations.

The attached GameChanger season sample was checked with the real import parser: 12 players, 178 sectioned statistic columns. It covers three games and yields no established shortlist opportunities at these minimums. Player detail still displays its imported statistics and available early signals. The supplied CSV and player identities are not committed to the repository.

## dugoutpilot.us

The authenticated universal dashboard route is `/director?id=<organization UUID>`, with organization entry at `/organizations`. These routes work in the iOS app and the Expo web build. This change does not publish a web deployment or change GoDaddy DNS, Supabase email settings, SMTP, or redirects.

To launch the website, first deploy the existing Expo SDK 58 server-output web application to a compatible host (e.g. EAS Hosting). Obtain the host's exact custom-domain DNS targets, then add those targets in GoDaddy, preferably for `app.dugoutpilot.us`. Add the final HTTPS origin/callback URLs to the Dugout Pilot Supabase Auth configuration when configuring branded email authentication. Do not guess DNS IPs or point records at the Supabase API URL. Confirm the existing domain records before modifying them. The app's existing sign-in works on the web; email confirmation/recovery links and branded SMTP require their own end-to-end setup before launch.

## Validation

- `node scripts/test-organizations.mjs` (requires PGlite in the test environment)
- `node scripts/test-organization-development.mjs [optional path to a GameChanger CSV]`
- `npx tsc --noEmit`
- Scoped ESLint against the Expo flat config

Database tests cover role isolation, optional codes, invalid-code rollback, idempotency, current data, redacted notes, code rotation, read-only directors, disconnect revocation, anonymous denial and preservation of team data. Production Supabase execution and native/browser visual verification are separate release checks.
