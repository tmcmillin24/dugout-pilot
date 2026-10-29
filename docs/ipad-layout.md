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
