# Multi-team setup and automatic trials

## Migration order

Run each migration once, in order, in the Dugout Pilot Supabase SQL Editor:

1. `supabase/migrations/202610280001_teams.sql` — skip if already applied.
2. `supabase/migrations/202610280002_coaches_and_trials.sql` — new automatic trials, owner controls, invitations, and optional Super Admin test access.

The second migration preserves teams and memberships. Existing pending teams automatically start a 14-day Elite trial. New teams start the same trial at creation. No manual approval is needed. No payment is taken, and billing is not implemented in this phase.

After pulling, run `npm install` and restart with `npx expo start --clear --port 8083`.

## Owner and coach flow

- Owners can rename their team, see its owner/coaches, invite coaches, revoke pending invitations, and remove coaches. Owner removal/transfer is deliberately not included.
- Under **Manage team**, enter the coach's account email, create an invitation, then copy the selectable code or use **Share invitation**. No email is sent automatically. The code is shown only in the current panel and is never saved as plaintext in the database; only its SHA-256 hash is stored.
- Coach creates/signs into an account with that email, confirms it, and enters the code under **Join a team**. An invitation always grants coach membership, never owner or administrator access.
- Invitations expire after 7 days, work only for the invited confirmed email, and can be revoked. Replacing an invitation invalidates the prior pending code. A removed coach cannot reuse their accepted code to rejoin.
- Invitation creation uses a stable request ID/code for retries within the panel. If the panel is closed before sharing, issue a replacement invitation; codes cannot be retrieved later.
- Each account may own or coach multiple independent teams. Membership removal is enforced on the server immediately; refresh the device's team list to update its local display.

## Automatic access

`list_my_teams()` reports effective access status using server time. `has_team_feature_access(team_id)` is the server permission check for future roster/game/practice policies: it requires current membership plus active access or an unexpired trial. A trial cannot be extended by replaying team creation, renaming the team, or changing the client clock.

Trial records are the Elite trial entitlement; the app's actual game tools and tier-specific feature gates are subsequent work. Expired teams retain account/team-management access so their owner can subscribe once billing is implemented. A billing webhook and subscription expiry validation must be added before paid plans are launched; no purchase UI exists yet.

## Optional Super Admin test access

This is an exception mechanism for development/testing, not an approval queue for new teams.

After migration 2, open `supabase/admin/bootstrap_super_admin.sql`, replace its email placeholder with your own confirmed Dugout Pilot account email, and run it in the SQL Editor. Do not share a database/service-role secret with the app. Refresh/reopen the signed-in screen to see **Super Admin → Manage test activation**.

Only SQL-enrolled Super Admins can grant or remove test access. The control lists teams in pages of 50. Changes are audited in the private `activation_events` table. Test access does not create a payment or subscription, and removing it restores the original trial dates without granting a new trial. Subscription-active or suspended teams cannot be overridden using this test control. Super Admin status never comes from editable user metadata.

## Security validation

Install the test-only PostgreSQL package locally without changing the manifest or lockfile:

`npm install --no-save --package-lock=false @electric-sql/pglite`

Run:

- `node scripts/test-team-security.mjs` — migration 1 baseline isolation tests.
- `node scripts/test-coach-security.mjs` — both migrations, auto-trial backfill/creation/expiry, owner vs coach access, invitations, removal, Super Admin controls and audit.

These use a fresh embedded PostgreSQL database with mocked Supabase auth users/roles. They never connect to hosted user data. After applying migration 2, verify two real accounts in the simulator/PostgREST: owner invites coach, the wrong account is rejected, intended coach joins, owner sees/removes coach, and unrelated teams remain invisible. Refresh after removing coach access. Check trial dates and restart/team switching.
