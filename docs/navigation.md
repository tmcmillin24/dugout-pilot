# App navigation and layout

The signed-in app uses four bottom tabs:

- Home: selected-team overview, access badge, workspace shortcuts, and clearly labeled upcoming game/practice tools.
- Teams: select a workspace, create or join a team, and enter owner management.
- Integrations: GameChanger CSV integration information and its current development status. No live connection or import is advertised as working yet.
- Account: email, workspace access, sign-out, and optional Super Admin tools.

Team creation, invitation acceptance, team settings, coach lists, and invitation creation each have their own focused screen instead of being stacked on Home. The selected team is shared across tabs and persists under the existing user-specific device key. Teams reload when the app returns to the foreground, so membership changes are rechecked.

The database, automatic trials, invitation permissions, and membership policies are unchanged. No migration is needed for this layout update.

## Verify in the simulator

- Launch with an existing session and confirm four tabs appear.
- Switch teams in Teams; confirm Home and Integrations show that same team.
- Create a team and accept an invitation from their focused modal screens; confirm the correct team is selected afterward.
- As owner, open Manage team -> Team details / Coach access / Invite a coach. Check back navigation and keyboard scrolling.
- As coach, confirm owner management is unavailable. Database authorization still enforces every mutation.
- Sign out in Account, sign into another account, and verify previous teams are not retained.
- Pull to refresh and background/foreground the app to recheck access.
- Check small iPhone widths, long team names, larger accessibility text, and tablet widths.

Typecheck, ESLint, and iOS bundle export are run in development. The web bundle also exports successfully. The cloud browser cannot reach the local preview server, so live visual/navigation verification must be completed on the configured simulator.
