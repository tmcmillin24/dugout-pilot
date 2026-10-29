# Offline practice planner

The planner now uses 120 distinct, original drill activities across hitting (20), throwing/pitching footwork (20), infield (20), outfield (15), baserunning (15), catching (15), and team situations (15). These are authored coaching templates, not AI output or an external licensed drill feed. There is no skill-level field and no provider/API usage charge.

Each drill defines setup/execution, a coaching cue, required equipment, space type, age range, supported sports, minimum group size and setup allowance. Team sport/age comes from the Rules Desk profile. Missing age uses the simpler minimum-age activities. Players attending can be selected from the roster (up to the existing 18-player session limit); manual player counts remain available. Coach count means adults actually supervising today, not membership count.

The primary focus plus additional priorities influence selection. The form asks only about cages, machine, turf/field space, nets, protective screens and tees. Basic balls, gloves, bats and marking cones are assumed in the internal planner, without quantity questions. Restored drafts and new builds discard old hidden basic-equipment/catcher-gear counts. Live catcher activities needing protective gear are excluded by default; dry catching activities remain available. Facility counts default to zero and are set by the coach.

Concurrent stations reserve equipment quantities and distinct coach-designated areas; station count cannot exceed available coaches, four stations, or supported player/group limits. Live swings and dry bat work require a cage, or an outdoor full-field protected area reserved exclusively for that activity. A machine station requires a cage. Front toss reserves a protective screen as well as a net. There is no claim that marking a lane automatically makes a facility safe: the supervising coach verifies space, screen suitability, waiting areas and age/rules-specific instructions.

With a single group, drills run sequentially in shorter blocks instead of repeating a station for the entire work period. With multiple groups, every group rotates through the staffed stations. Setup/transition time is included in the work blocks. Warm-ups no longer require bands; team work is a resource-light dry decision walk-through. Named attendance groups remain stable when generating an alternate with the same group count.

Selection is seeded and reproducible. Build/Generate Another use a fresh seed. The most recently saved three plans' drill IDs are down-ranked to encourage variety when resources allow. Limited equipment may still require repetition. This is not an adaptive player-development history model or a guarantee of an optimal coaching session.

## Coach controls

- Swap a station using only drills that fit resources left after other stations reserve theirs.
- Edit a single-group block to choose another compatible drill.
- Lock drills or blocks before generating another plan. Locked rotation blocks also preserve station assignments.
- Reorder unlocked blocks and adjust block duration. Timelines recalculate; duration changes borrow/give minutes from unlocked blocks, preserving the session total. Impossible changes explain what must be unlocked.
- Alternate generation preserves the existing phase order, durations, locked content and group count. If that cannot fit after bounded local retries, it keeps the original and asks to adjust setup or swap a drill.
- Existing saved sessions remain intact; Edit a Copy enables changes. Preview edits persist in the existing account/team device draft and Save to Team uses the existing revision-checked save.

Run `node scripts/test-practice-planner.mjs`. It tests library uniqueness, staffing/group/space/equipment constraints, empty resources, age/sport isolation, immutable swaps, locks, time accounting, reordering, and variation. In one fully equipped 12-player/four-coach setup, 3,000 seeds produced 2,472 distinct valid ordered station arrangements; this is a measured example, not the count available with every setup.

## Account navigation

Account is now a root stack screen (`src/app/account.tsx`) instead of a hidden tab. The shared person button explicitly pushes it, and Back returns to the originating screen. Authentication and team providers still wrap it. Native navigation and touch/layout behavior need simulator verification.

Additional priorities use one dropdown opening a multi-select sheet with Done and Clear. Categories covered by the main focus are excluded (hitting; throwing/catching; baserunning; or infield/outfield/team for defense). Changing focus removes newly redundant selections and restored drafts drop stale/duplicate selections.

Attendance setup presents Enter player count versus Use team roster before the count control. Manual counts remain editable and remembered separately; roster mode derives the visible count from selected, still-existing roster IDs and disables/grays the control. Changing the selection immediately changes the displayed count. Facility controls share a two-column, equal-height layout: indoor has cages/turf, machine/nets, screens/tees; outdoor has field/nets and screens/tees. Machine is disabled when no cages are available.

Practice start time uses a tap-to-open native time picker: iOS scroll wheels with Done, Android native time dialog, and selection controls on web. Display is 12-hour with AM/PM; saved values remain HH:mm, preserving planner/timeline compatibility. Closing without confirmation leaves the original time. Roster mode keeps the page compact with a selected/total control opening a player sheet (Select All, Clear, Done); selected counts continue updating live. The existing @expo/ui dependency supplies native controls; no new package or SQL is introduced. Native wheel/clock interaction still requires device verification.
