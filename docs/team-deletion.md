# Team deletion

Apply `supabase/migrations/202610280004_delete_teams.sql` once in the Dugout Pilot SQL Editor after migrations 001-003. No new app dependencies are added.

Owners find **Delete team** under Teams -> Manage. The custom confirmation modal uses the app's navy/orange header, condensed typography, team identity, and a distinct red destructive button. It names the team, explains that invitations/coach access are removed, and requires typing the exact team name. Cancel/back dismisses without a server request; while a deletion is in flight, repeated taps and dismissal are disabled. Errors stay in the modal for retry. Success returns to Teams with a confirmation and a valid remaining selection, or the empty-team screen.

The server checks the current owner and the confirmation name, then atomically removes the team, memberships, and invitations. Activation audit is preserved in a private administrative deletion receipt. Advisory locks serialize creation/deletion of the same UUID, and deleted request IDs cannot recreate a deleted team. If a successful deletion response is lost, the same owner may retry safely with the same confirmation. Other accounts and teams are preserved.

Private logo access is revoked by removing memberships. Physical files are queued in `app_private.team_logo_cleanup`; an authenticated URL already issued may remain valid for its 10-minute lifetime. A privileged Storage API housekeeping process must consume this queue (and scan deleted-team prefixes for interrupted late uploads). No automatic file-cleanup worker is configured in this phase; do not delete `storage.objects` metadata directly in SQL. The live team itself is hard-deleted and cannot be restored through the app.

## Validation

`node scripts/test-team-deletion.mjs` uses fresh embedded PostgreSQL with mocked auth/Storage metadata. It verifies confirmation matching, owner/coach/outsider/anonymous permissions, membership/invitation cascades, activation receipt preservation, logo access revocation/cleanup queue, retry behavior, UUID resurrection denial, and preservation of accounts/other teams.

In the simulator, verify Cancel, incomplete/wrong names, successful deletion, failed requests, double taps, deletion of the last team, selection fallback, and returning to Home after deletion. Do not use an important live team for this destructive check.
