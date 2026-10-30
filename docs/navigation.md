# Sports-app navigation

The signed-in app uses Home, Teams, Integrations, and Account bottom tabs.

Home is a clubhouse: horizontal team/crest selector, a navy/orange team banner with a subtle baseball-field graphic, compact real role/team/access readouts, coaching shortcuts, and trial dates. It uses no fabricated scores, fixtures, player counts, or live badges. Unimplemented game/practice placeholder cards are removed.

Teams is a club directory with crest/logo tiles, a clear selection marker, direct owner management, and create/join actions. Integrations has a distinct GameChanger feature panel and honest development status. Account contains login details, sign-out, and optional Super Admin tools.

The design uses a compact persistent logo toolbar, light neutral content surfaces, sharper panels, condensed Barlow headlines, orange rules, and pressed feedback. Fonts are bundled and load before navigation mounts, with a system-font fallback on load failure. Team data, role boundaries, automatic trials, and database policies remain enforced by the backend.

Team creation/joining, details, coaches, invitation creation, and administration are focused stack/modal screens. Selected-team state is shared across tabs, persists under a user-specific device key, and reloads on foreground. The new team-logo feature requires migration 003; see team-logos.md.

## Simulator verification

- Verify font loading, four tabs, logo toolbar, and bottom safe areas.
- Change teams in Home or Teams; confirm all screens show the same team and crest.
- Check long names, larger accessibility text, small iPhone widths, and tablets.
- Use create/join, rename, invite, revoke, remove-coach, and back navigation.
- Verify coaches cannot enter owner controls or mutate team data.
- Upload/change/remove a logo and confirm persistence across restart and accounts.
- Sign out/in with another account to check that cached teams are not carried over.

TypeScript, ESLint, bundle export, and database policy tests are run during development. The cloud browser cannot reach the local preview server; visual/native picker verification must be completed in the configured simulator.

Owners can delete a team from Manage using a branded, typed-name confirmation dialog; see team-deletion.md and migration 004. Generated team abbreviations are removed. Main team-name rows show an uploaded logo only; selectors use a neutral baseball symbol when no image is available.
