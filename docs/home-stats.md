# Clubhouse and team stats

Home uses the selected team from Teams. It has no team selector or access/trial readout. Account holds the selected team's access status and trial end date. Imports remains a single Home tool; the snapshot and Team Stats have no upload action.

A compact upcoming-event row appears only for dated planned games or saved practices on/after today. The selected team card retains the shared field artwork. Coaching and team tools use matching three-row panels.

Season Snapshot links to Team Stats (Season / Games / Players / Elite Insights). Season snapshots and individual game imports now use the existing private board; a season snapshot is never summed with games. CSV review can create a fresh roster. See `stats-imports-elite.md` for data mapping, matching, column preferences, algorithms, access and limitations.

Empty/loading/error states do not manufacture zero stats. Date-in-time compatibility for older games remains intact.

Validation: TypeScript, scoped ESLint, iOS export and test-team-stats.mjs. Native iPhone/iPad visuals require device review.
