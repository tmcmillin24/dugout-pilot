# Team foundation

## Apply once in the Dugout Pilot Supabase project

Open SQL Editor, create a new query, paste all of `supabase/migrations/202610280001_teams.sql`, and Run. This is a new migration, not intended to be pasted repeatedly after success. It creates only teams, memberships, policies, and the atomic create_team RPC. Do not run against Novori.

Then pull the branch, run `npm install`, and restart Expo with `npx expo start --clear --port 8083`.

## Behavior

An account can create multiple teams and belong to multiple teams. Creating a team adds that user as owner in the same transaction. A stable request UUID prevents duplicate creation when retrying a request in the current screen. Team selection is saved on the device under a user-specific key and revalidated against current memberships on reload.

Teams start activation pending. Creation does not enable a trial, subscription, paid features, or production team data. Coach invitations, activation administration, subscriptions, seasons, rosters, and games are later phases. There is no Thundercats-specific data in this migration.

Clients can read only their own memberships and teams to which those memberships grant access. They cannot directly create, update, delete, or escalate memberships, or activate a team. Future coach invitations must use a separately permission-checked server operation; do not add unrestricted membership inserts.

## Verify locally

- Create Thundercats, then a second team. Switch between them, restart, and confirm your selection is restored.
- Sign in with another account; neither team should appear until that account is explicitly granted membership by an authorized server operation.
- Check blank/long names, failed connections, retry after a lost create response, and refresh.
- Team creation should result in exactly one owner membership and activation_status=pending.

## Database security regression test

The test runs against a fresh embedded PostgreSQL database, not your hosted data. It mocks auth.uid() and Supabase roles, then runs the actual migration and attempts allowed and denied operations.

Install the test-only package locally without changing the manifest or lockfile:

`npm install --no-save --package-lock=false @electric-sql/pglite`

Run `node scripts/test-team-security.mjs`.

Covered: atomic team/owner creation, retry deduplication, input validation, multi-team ownership, two-user row isolation, membership/activation write denial, anonymous denial. Hosted Supabase/PostgREST and simulator verification remain necessary after applying the migration.
