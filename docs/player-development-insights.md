# Player development and stats presentation

Elite Insights now has a distinct navy/orange navigation item and scouting header. The selector at the top scopes the entire report, including practice targets, supporting metrics, strengths, missing data and recent comparisons. Whole-team view is explicitly separate and offers a compact player scouting board. The season and existing Players data tables are retained.

The former generic playerReport fallback is replaced with player-development.ts. It uses only the selected player's imported counts and keeps batting/pitching namespaces separate. It does not ask Gemini or consume AI API requests. Each recommended focus has evidence, a drill and a measurable follow-up. Identical statistical patterns can legitimately produce the same recommendation; random variation is not used to manufacture personalization.

Current coaching heuristics (not official rules or age-group benchmarks):
- Two-strike contact: at least 8 PA and SO/PA at least 25%.
- At-bat decisions: at least 12 PA, walk rate below 8% and strikeout rate at least 15%, when the contact flag is absent.
- Line-drive impact: at least 12 AB, complete H/TB, SO/PA below 20%, and (TB-H)/AB below .080.
- Pitching command: at least 12 BF and BB/BF at least 15%; when BF is unavailable, at least 9 recorded outs and at least 1 BB per inning. Baseball innings are converted to outs before arithmetic.
- Fielding: at least 8 chances and E/TC at least 12%.
- Steal decisions: at least 4 recorded attempts and CS/(SB+CS) at least 25%.

The highest three signals are shown. PA under 20, AB under 30, pitching BF under 30 (or fewer than 18 outs for the fallback), fielding chances under 20 and steal attempts under 10 are flagged as early signals. Missing counts never become zero and AB is not substituted for PA in strikeout frequency. Zero denominators and impossible bounded ratios do not generate a recommendation. Reports do not diagnose mechanics or injuries; coaches are prompted to observe the likely issue before making changes.

Recent comparisons use at most three dated game imports with stats for the selected player. They are labeled as overlapping the season sample, not an independent before/after experiment. Season-only CSV data cannot reconstruct individual games.

Horizontal chip strips no longer flex-grow into unused vertical space. Games use compact rows within one panel. Stats upgrade prompts use compact banners rather than large cards. Shared menu rows use sports display typography without decorative leading icon tiles, retaining modestly rounded panels and subtle depth.

Home snapshot filters save valid changed selections through the existing account/team preference store on every sheet-dismissal path. One selection minimum and six maximum are enforced in the UI. No footer Save button is required; resets are saved on dismissal as well. Existing preference sync and offline retry behavior are retained.

Validation: TypeScript, scoped ESLint, stats-workflow regressions, player development fixtures and a real component render with native mocks to verify player scoping, plus snapshot-dismiss interaction tests. Native iPhone/iPad visual review remains necessary; this workspace has no iOS runtime. No database migration, native dependency or model deployment is required for these changes.
