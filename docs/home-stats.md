# Clubhouse and team stats

Home uses the selected team from Teams. It has no team selector or access/trial readout. Account holds the selected team's access status and trial end date. Imports remains a single Home tool; the snapshot and Team Stats have no upload action.

A compact upcoming-event row appears only for dated planned games or saved practices on/after today. The selected team card retains the shared field artwork. Coaching and team tools use matching three-row panels.

Season Snapshot links to the root Team Stats screen (Season / Games / Players). The current data source is imported game stats in the existing private team board. No database migration or new API is required. No season CSV ingestion or automatic roster creation is introduced in this change. Season totals are explicitly labeled as imported-game coverage; they are not asserted to be a complete season. Empty/loading/error states do not manufacture zero stats.

AVG uses total H / total AB only with complete supporting counts, never an average of player averages. Missing counts show a dash, pitching-only records are excluded from batting aggregation, and zero AB has no average. OBP, runs and ERA are deferred until the importer stores their complete supporting fields. Game details retain the original import label, and player names use the shared formatter.

Validation: TypeScript, scoped ESLint, iOS export and test-team-stats.mjs. Native iPhone/iPad visuals require device review.
