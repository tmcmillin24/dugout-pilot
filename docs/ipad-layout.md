# iPhone and iPad layouts

Dugout Pilot is a universal iOS app (`ios.supportsTablet: true`). Orientation is unlocked and iPad multitasking is allowed. Apply configuration changes with `npx expo prebuild --platform ios --clean`, then rebuild the app.

Shared screens use the available window width, with up to 1180 points for tablet content. Paired content sections measure their own available width and use two columns at 740 points or wider; narrower windows stack them. Components stay mounted when that layout changes, preserving input state. Home pairs coaching actions with team tools. Practice pairs session details with equipment, and timeline with stations. Defense pairs the field with the bench. The field scales its height, diamond and assignment cards to its available width.

Overlays and chat support all orientations. Shared sheets include safe-area padding and constrain their content width; chat has a 900-point reading width. Authentication retains a readable centered form.

## Native verification

TypeScript, scoped lint, iOS JavaScript export and Expo introspection can run in the Linux workspace. Xcode/iPad simulator rendering cannot. The generated Info.plist was checked for all four iPad orientations and `UIRequiresFullScreen: false`.

Verify on 11-inch and 13-inch iPads in portrait and landscape, then resize in Split View. Check Home, roster, defense assignments, batting drag, pitching, practice setup, saved practices, guide scrolling, Imports, Teams, Rules desk and chat with the keyboard open. Also check iPhone portrait and landscape. Native visual behavior still requires these device checks.

## iPadOS window mode

A narrow floating window with wallpaper around it is controlled by iPadOS Windowed Apps, not the app's content maxWidth. In the iPad Settings app, choose Multitasking & Gestures → Full Screen Apps to test full-display layouts. The Mac Simulator window's green control is separate. If the installation still uses an older iPhone-only binary, regenerate and rebuild the iOS project; do not try to compensate by scaling React Native fonts. The shared header reserves room for window controls when an iPad window reports no top safe-area inset. Medium windows use intermediate margins, and bottom-tab labels remain below icons across widths.

## iPhone compatibility mode on iPad

A small phone-shaped app surrounded by black, with an OS zoom control, indicates a native device-family compatibility problem rather than React Native content spacing. Open one iPad simulator and run `npm run ios:ipad` on the Mac. This regenerates iOS from configuration, builds a fresh generic simulator binary, checks the compiled Info.plist for UIDeviceFamily [1,2], and installs that exact binary on the selected booted iPad before starting Metro on 8083. It refuses an iPhone-only binary. This Mac/Xcode flow cannot be executed in the Linux workspace.

## Tablet layout overflow correction

Paired sections use explicit measured widths, not intrinsic flex sizing. Each pair needs at least 350 points per column plus a 22-point gap; otherwise sections stack. Child wrappers cannot exceed their parent width. This fixes the observed Practice equipment column and bench extending off-screen. The Home team selector has a fixed 96-point height and does not absorb unused vertical space. Defense groups field, save controls and outing confirmation on one side, and bench/field-innings lists on the other; lists scroll within a 300-point maximum instead of forcing a large empty area under the field. Choice grids use zero flex basis for equal widths.

## Dugout display and compact practice setup

Coach’s Corner uses three full-width menu rows to match Team Tools. Practice session controls use two rows of three equal columns when at least 674 points are available, and stack in narrow windows. Attendance and equipment remain separate aligned sections; equipment cells use a 76-point minimum rather than oversized 92-point cells. The compact session date opens a full-size calendar sheet.

Bench and Field innings both include player counts. Overflowing lists show a persistent position rail and scrolling hint. Batting pickup uses a 160ms hold. Dugout Display fills the current window, highlights At Bat in orange and On Deck in blue, and keeps the screen awake only while open. Batter Finished saves the current player as the game’s last batter; the selector corrects or resets that position. Save failure leaves the saved position unchanged. The display adapts to one, two or three order columns and supports normal window rotation.

Validation: `node scripts/test-batting-display.mjs`, `node scripts/test-tablet-layout.mjs`, TypeScript, scoped ESLint and iOS bundle export. Native device rendering, touch latency and auto-lock still require device verification.

## Responsive launch logo

The native iOS launch storyboard and React loader share `config/launch-layout.json`: phone width 300pt; regular iPad windows use 65% of the shorter dimension, capped at 640pt. This gives approximately 542pt on the 11-inch and 640pt on the 13-inch, with no orientation-dependent zoom. Compact windows keep the phone sizing. Native assets are generated at 640pt before display scaling.

`with-responsive-launch` must precede `expo-splash-screen` in the plugin list so Expo builds the image first and our mod then adds constraints. Native changes require prebuild/rebuild; a Metro reload cannot update the installed launch storyboard. No generated native files are maintained manually. SDK introspection and the launch-handoff test verify the mod order, generated constraints, phone/mini/11/13 sizing, rotation, idempotence and auth readiness. Xcode compilation and cold-launch visuals need device verification.

## Shared-control uniformity

Defense opts into stretched columns. Field Innings grows its native scroll viewport to use the available column height, and the left column anchors Confirm This Outing at its bottom. The phone layout remains stacked. The save-slot button matches the adjacent 76pt selector.

Date, duration, time, priorities, attendance and equipment selectors use the shared 76pt minimum card height, 14pt padding, white surface and value typography. Compact dates use the same caret and calendar sheet. Practice session grids use a 12pt control gap; multiple priorities display a compact summary while retaining their complete accessibility label. Practice action buttons and mode tabs use 52pt minimum heights, with shared action typography and corner treatment.

Validation: control-uniformity and tablet-layout tests, lineup-mode regression test, scoped lint, TypeScript and iOS export. Native visual alignment remains a device QA check.
