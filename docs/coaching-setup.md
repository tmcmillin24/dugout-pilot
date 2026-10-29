# Coaching workspace

Apply migration 202610280005_coaching.sql once after 001–004. Existing teams start with an empty roster and ten defensive slots; the original website is not modified and no Thundercats data is seeded.

## Workflow

- Home → Roster: names, jersey numbers, bats/throws, multiple playable positions, and player notes. Existing players need their playable positions filled in to appear in filtered assignment menus.
- Lineups → Defense: tap the diamond and choose from players listed for that position. Assigning a player moves them out of any other field spot. Browse ten saved defenses; edit the preview/name, sort by pitcher, and apply to the game. Reusable defenses are independent of current-game assignments.
- Lineups → Batting: add individual hitters or all roster players; move up/down, remove, and track last batter / next up.
- Lineups → Pitching: innings in baseball notation (2.1 = seven outs), per-game pitches and tournament-day pitch totals. These are tracking aids, not automatic eligibility decisions.
- Game editor: edit opponent, label, tournament day and date/time; add a new game copying the batting order and field, never previous inning/pitching logs.
- Confirm This Outing records the field for an explicit inning. Selecting a defensive lineup never counts innings. Reconfirming the same inning replaces its assignments instead of adding a second inning.
- Practice: configure indoor/outdoor resources and coaches, build preview, edit block text, save to the team, share, view timeline, station assignments, named groups and rotations. Saved sessions can be edited as a copy or deleted with confirmation.
- Draft practice settings/previews, selected session and timestamp-based timer state persist to AsyncStorage under account + team keys. Saved plans live in Supabase and are visible to other member coaches. Timers have no background alarms and do not keep the screen awake.
- Home → Rules Desk: four Quick Calls and six initial reference topics, expandable via Show more. Ask Dugout uses the local Apple model when available and Saved Rules otherwise; see rules-assistant-setup.md. MLB fallback is limited to saved baseball references, never softball. No AI budget SQL or cloud-provider connection is needed.

## Persistence and access

`team_boards` is one team workspace containing the source Board model, games, roster, ten defenses, practice sessions, rules profile and event notes. This phase does not yet provide separate season archives, automatic original-site migration, practice JSON import/export, player removal.

Saves are explicit at form boundaries and immediate for game assignments/order changes. UI shows saved only after server acknowledgement; failed form saves keep their inputs. Account/team-keyed provider isolation discards old-team request results after selection changes. No background local-to-cloud overwrite occurs. Coaches pull to refresh for other coaches' updates; revision checking rejects stale saves. Reload team data after a conflict, then reapply the intended change. There is no live collaboration subscription or offline editing queue.

Member RLS permits reads; an RPC allows owner/coach writes only with active/trial/test access, bounded JSON, and a matching revision. Expired teams retain read access to their saved data. Membership removal revokes access. The shared advisory lock serializes writes against team deletion; deleting a team cascades its coaching workspace.

## Verification

- `npx tsc --noEmit` and ESLint.
- `node scripts/test-coaching-logic.mjs` uses the project's TypeScript dependency to load domain helpers. Tests assignment filtering, saved defense isolation, confirmation/reconfirmation counting, practice resource/duration/group combinations and topic matching.
- `node scripts/test-coaching-security.mjs` requires `@electric-sql/pglite` as a local test dependency; emulates Supabase auth and Storage, applies all five migrations, then tests member isolation, expired access, removed coaches, revisions and deletion cascades.
- Expo iOS and web exports check bundling. Live Supabase/physical-device interactions require simulator review with the applied migration.

## Navigation and reference polish

The shared header includes the tagline and a chat icon on every signed-in screen. The five main tabs are Home, Lineups, Practice, Imports, and Teams. Account remains accessible from the header. Rules Desk uses a team profile card, topic shortcuts, expandable reference shelf, separate profile editor, and an app-wide chat drawer with source links. Conversations survive tab changes in memory and reset when team or rules profile changes. Saved Rules stays available alongside native on-device explanations.

USSSA is the sole selectable authority. Sport (baseball, fastpitch, slowpitch), age and season are independent. Only the reviewed 2026 USSSA 11U baseball pack supplies summarized answers today; other selections offer USSSA source links and event notes, never silently reuse 11U rules. Existing legacy profiles continue to work.

The Imports tab now reads user-selected CSVs through Expo DocumentPicker/FileSystem, previews supported stats, matches names or jersey numbers, allows corrections/skips, and requires explicit single-game confirmation. Same-game file fingerprints block identical repeat imports. Applying an import replaces that game's imported statistics, so imports never add the same values repeatedly. Pitching logs and lineups are separate. A generic CSV format is supported; not every possible export layout is guaranteed. Imports are manual exports, not an official partnership or live GameChanger connection.

Use `npm install` after pulling to install SDK-compatible expo-document-picker and expo-file-system. Native development builds need rebuilding when adding native modules; Expo Go includes these Expo modules. No additional SQL migration is needed beyond 005.

### Rule source maintenance

The source catalog is centralized in `src/lib/coaching/usssa-sources.json`. `node scripts/check-usssa-sources.mjs` checks official directory links and PDF hashes against `docs/usssa-source-baseline.json`. It fails when sources are changed, unavailable, or no longer recognized. It stores only URLs, metadata and hashes, not rulebook text. A manual GitHub Actions workflow exposes this check; no scheduled job or automatic rule-publication system is enabled.

The source check currently detects broken baseball/fastpitch links in USSSA's directory and can report older directory editions alongside newer sport-specific pages. Treat those as review items, not as successful updates. After reviewing source changes, `--record-baseline` records observed source metadata; it does not approve a new answer pack. Failed links continue to fail even after a baseline is recorded. The checker does not automatically discover every new document if USSSA changes its page structure.

The public USSSA Event API specification was inspected on October 28, 2026. Its documented routes cover event/team/division/pitching data; no rulebook-content endpoint was found. For broader on-device coverage, add reviewed/approved source packs to the local reference library. Keep source edition, sport, age, event supplements and citations attached to answers. A language model by itself does not keep USSSA rules current.

See [rules-assistant-setup.md](rules-assistant-setup.md) for the current wordmark header, labeled Ask Dugout launcher, on-device AI, saved references, device availability and native-build requirements.

## Lineup interaction

Batting order rows support a 280 ms hold and vertical drag, animated placement, edge auto-scrolling, cancellation, and one server save on drop. Failed saves restore the order. Screen-reader increase/decrease actions remain available without visible arrow buttons. Pitcher selection and workload rows show only players whose roster positions include P; removing P does not delete previously saved logs. The tagline is centered beneath the wordmark.

Player names use first initial and last name throughout displays, selections, diamonds, practice sharing and import previews. Roster editing and CSV matching retain full names. Games use a full-width selector with an overflow menu for editing, adding and confirmed deletion; deleting the final game preserves the roster, practices and saved defenses.

Game dates and practice dates use the same inline tap-to-select calendar, with month navigation, today and clear actions. Game dates are stored separately from existing free-text time values, which remain intact. Date-only values use local calendar components to avoid UTC day shifts.
