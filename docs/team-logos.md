# Team logo setup

Apply `supabase/migrations/202610280003_team_logos.sql` once in the Dugout Pilot Supabase SQL Editor, after migrations 001 and 002. This creates a private `team-logos` bucket with a 5 MB limit, PNG-only uploads, owner-write/member-read policies, and an owner-checked logo-reference RPC.

Pull the app changes, run `npm install`, and restart Expo with `npx expo start --clear --port 8083`. The update adds SDK-compatible Expo ImagePicker/ImageManipulator packages and a bundled Barlow Condensed headline font. These image modules are included in the current Expo Go; custom development builds must be rebuilt when their native modules change.

Owners: Teams -> select your team -> Manage -> Team details -> Add team logo. Choose a photo, crop it with the platform picker, and save. You can change or remove it from the same screen. On web, images are center-cropped because the system editing UI is native-only. The app normalizes images to 1024x1024 PNG, caps the encoded upload at 5 MB, and uses a neutral baseball symbol in selectors if a logo cannot load. Main team-name rows omit the logo slot when no image is available.

Logos appear in the Home team rail, clubhouse header, Teams directory, and logo editor. Each upload has an immutable path under its team ID, preventing old-image cache collisions. Only current members can request signed URLs. URLs last 10 minutes; the app refreshes them on subsequent team reloads. As with all signed URLs, an already issued URL can remain usable until it expires after membership removal.

Replacement/removal updates the reference before best-effort Storage API cleanup. Current referenced files cannot be deleted through the cleanup policy. Interrupted uploads/network failures can leave unreferenced files; production storage housekeeping should delete unreferenced old files through the Storage API, never by deleting Storage metadata in SQL.

## Verify

- Owner chooses a photo, cancels, then chooses/crops/uploads a logo successfully.
- Home and Teams show the same logo; restart and verify it persists.
- Change the logo and confirm it updates without the old image flashing.
- Remove it and confirm no generated abbreviation appears.
- Coach can view but has no editor and cannot upload/set/remove through API calls.
- Another team's account cannot read/upload/change this team's logo.
- Test large or unsupported images and a failed upload; existing team/logo should stay available.

`node scripts/test-logo-security.mjs` exercises the actual migration against embedded PostgreSQL with mocked auth and Storage metadata tables. It checks bucket settings, read/write policies, current-file deletion protection, reference validation, replacement/removal, and role/team isolation. It does not exercise the hosted Storage HTTP API or native image picker. Use the test-only PGlite install instructions in teams-setup.md.
