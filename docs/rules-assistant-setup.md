# Ask Dugout: on-device AI

Ask Dugout uses Apple's **SystemLanguageModel.default**, the on-device Foundation Models model. There is no cloud AI client, Edge Function, API key, or AI budget migration in the current app. Do not run the former 006 budget SQL. If you already ran it manually, its unused objects can remain; this app never calls them. Keep the existing team migrations 001–005.

## Build and device requirements

- Use Xcode 26 or newer and a native iOS build. The custom module is not available inside Expo Go.
- AI availability requires iOS/iPadOS 26 or newer, compatible Apple Intelligence hardware, a supported region/language, Apple Intelligence enabled and the system model ready. Availability is checked at runtime; OS version alone does not imply support.
- Enable Apple Intelligence in device Settings and let its model finish downloading while connected. Once ready, classification and explanations run offline. Opening external source links, signing in, team synchronization, and downloading future app/reference updates still need connectivity.
- Android, web, older/unsupported Apple devices, and Expo Go retain Saved Rules. Android on-device model support is not included in this implementation.

From the app folder on your Mac:

```bash
git pull --ff-only
npx expo run:ios --port 8083
```

This generates the native iOS project through Expo CNG and installs the local module. Do not hand-edit generated ios/android folders. No JavaScript dependency was added for this local module. If an existing development build predates this module, rebuild it; restarting Metro cannot add native Swift code to a binary.

The simulator can verify navigation and Saved Rules. AI availability in a simulator depends on the host/runtime; validate actual generation on a compatible physical iPhone/iPad as well. Device signing must use the intended Dugout Pilot developer team; no Apple team or deployment credentials are set in this repository. The app bundle identifier is com.dugoutpilot.app.

## Local processing

`modules/dugout-on-device-ai` is an iOS-only local Expo module discovered by autolinking. It exposes availability, generation and request-ID-specific cancellation. It explicitly instantiates Apple's SystemLanguageModel, not a Private Cloud Compute or third-party adapter. Only one request runs at a time. Older OS/device/model-unavailable states return clear fallback messages.

The app uses a local retrieval/explanation pipeline:

1. Filter the saved reference index by sport, division and edition. Missing settings may prompt a clarification before model work.
2. Ask the on-device model to choose up to three relevant source IDs from the eligible local catalogue.
3. Pass only those source summaries, bounded recent dialogue and coach event notes into a fresh local session to explain the question.
4. Validate the generated JSON and source IDs. Source titles, editions and URLs come from the app's reference index, never invented model links. An invalid/unsupported response uses the reference lookup, which must decline unmatched topics. The UI is one Ask Dugout conversation; About Ask Dugout reveals capability and availability details without mode switches.

No roster is sent to the model. Questions/history are retained in UI memory during the current team/profile session, not sent to Supabase or an AI provider. The AI performs no network search and cannot discover a rule absent from the saved library. Links open externally only when tapped. Coach notes and dialogue are untrusted data, not official rules or instructions.

## Coverage and limits

The library contains the original 2026 USSSA 11U baseball summaries, 11U/12U baseball bat guidance for the packaged 2026/2027 editions, and general MLB 2026 boundary-double and infield-fly explanations with USSSA/youth-exception context. MLB references are excluded from softball profiles. Broader sport/division packs still require reviewed source data; installing a local model does not install every USSSA rulebook.

The model selects and explains saved material; it is not an official ruling and a valid source ID does not prove that every generated sentence is correct. Verify the linked source and local event exceptions. No full copyrighted rulebooks are bundled or automatically ingested. The current source-check tooling detects upstream changes for review; reference updates are delivered with app releases, not silently published.

Input/history/reference sizes are bounded and each native response is limited to 600 tokens. A new session is used for each selection/explanation step to limit context growth. Requests can be stopped; late results and old request IDs do not cancel a newer request. There is no usage-count SQL or paid AI-provider fallback.

## Verification

- Expo autolinking resolves DugoutOnDeviceAIModule / DugoutOnDeviceAI for Apple.
- TypeScript, changed-file ESLint, iOS/web JS bundle exports.
- `node scripts/test-local-ai-and-batting.mjs`: mocked native model/bridge checks for source selection, edition/sport isolation, unknown IDs/links, context bounds, missing native modules, unsupported platforms and cancellation. Also tests batting-order movement and drag/scroll bounds.
- `node scripts/test-imports-and-rules.mjs`: saved-rule and CSV behavior.

This Linux workspace has no Xcode/Swift toolchain or Apple Intelligence device. Native Swift compilation, real-model answer quality, drag gestures and simulator/physical-device layout still require testing on your Mac/device. JS export and mocked model tests are not a native compilation or model-accuracy test.

Boundary regression: a fair batted ball bouncing over the fence returns the verified automatic-double summary, including time-of-pitch runner awards, without model inference. In-flight, thrown, and ambiguous boundary plays ask for clarification. Dimensions references require an explicit measurements question in both reference matching and model source selection. This prevents the reported fence-word collision; it does not make the limited library a complete rules agent.
