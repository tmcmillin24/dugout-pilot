# Ask Dugout: one conversation, automatic online/offline routing

The chat has one composer and a small Online / Offline connection indicator. It has no mode buttons. Network changes update the indicator; sending rechecks the network. Online means the device reports a connection, not that the AI service is deployed or healthy. Service errors show a short notice on the affected offline answer. Auth/access denials remain explicit errors. Stopping/closing cancels the current request; switching networks does not clear history or replay a question.

## Activate online answers

The code is ready for deployment, but a GitHub pull alone does not activate the backend. This environment has no Supabase deployment credentials or Gemini API key. Do not paste secrets into chat, GitHub, or EXPO_PUBLIC variables.

1. In Supabase SQL Editor, run `supabase/migrations/202610290006_rules_ai_budget.sql` after migrations 001–005. The current 006 is safe to rerun if the former version was already applied. It creates private usage counters and a service-only budget RPC, not a chat-history table.
2. In Supabase Edge Functions → Secrets, set `GEMINI_API_KEY` from the separate Dugout Pilot Google AI Studio project. The model is fixed to `gemini-3.5-flash-lite`; no OpenAI key or model setting is read. Keep Google Cloud billing disabled for free-tier-only testing. There is no paid-provider fallback, but the API key itself does not enforce free billing: a billing-enabled Google project can incur charges.
3. Deploy from the project folder:

```bash
npx supabase login
npx supabase functions deploy rules-assistant --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

The handler independently verifies bearer tokens against Supabase Auth and checks membership and team access. `verify_jwt=false` supports asymmetric project signing keys; never remove the handler checks. It loads rules context/event notes from the server rather than trusting client profile values. It uses built-in Supabase credentials, including support for named default keys.

Default budgets: 20 requests/user/hour, 100/user/day, 500/team/day, 2,000/project/day (UTC). Each supported online question makes exactly one Gemini attempt, capped at 2,400 output tokens, with no search/tool calls or automatic retries. Failed provider requests consume the reserved budget. These are request caps, not a guaranteed dollar cap; configure API-project spending limits as appropriate.

## Answer behavior

Online answers use Gemini 3.5 Flash Lite to interpret questions and follow-ups against the supplied edition/profile reference texts. The entire eligible text pack is provided in one call, not selected by the old keyword lookup. There is no web search, URL-context tool, embedding API or paid fallback. USSSA has priority; supplied MLB summaries are baseball-only fallback. Structured output must cite known source IDs; URLs/titles and numbered citations are constructed by the server from owned metadata, not invented by the model. Missing/unsupported evidence must clarify or decline. Valid source IDs are not proof that the generated explanation is correct.

The server pack is generated from shared app references by `node scripts/build-rules-library.mjs`. Commit the resulting `supabase/functions/rules-assistant/references.json` when reviewing a reference update. It includes the existing 2026 USSSA 11U summaries, packaged 11U/12U 2026/2027 bat summaries, and MLB 2026 infield-fly/boundary-double summaries. It is deliberately NOT a complete rules corpus. Softball currently has no reviewed pack and declines without a provider call. Expanding reviewed coverage remains necessary before broad release.

The user's October 29 quota table showed 15 RPM, 250,000 input TPM and 500 RPD for Gemini 3.5 Flash Lite, shared by the project. That is an observed account quota, not guaranteed future capacity. Google 429 responses cause the existing offline fallback with no automatic retry. Application budget windows use UTC, while Google daily quotas use Pacific time. Gemini free-tier content may be used to improve Google's products; do not send roster data or sensitive personal details.

Up to three recent question/answer pairs are sent for follow-up context. Roster records are not sent. User-entered questions and event notes may contain personal information: avoid putting sensitive details there. No promise of provider zero-retention is made. Conversation UI state remains in memory and is isolated by team/profile.

Offline answers use bundled edition-specific references, with private Apple Foundation Models explanations where supported. Unsupported questions must decline or clarify. The library currently includes original 2026 USSSA 11U baseball summaries, packaged 11U/12U bat guidance, and MLB baseball infield-fly and boundary-double summaries. It is not a complete USSSA/MLB corpus. Explicit boundary and field-dimension matching prevents the reported fence-word collision. Short runner follow-ups to the automatic-double play work without a native model.

Apple explanations require compatible Apple Intelligence hardware, iOS/iPadOS 26+, enabled/supported Apple Intelligence, a downloaded model, and the native build. Expo Go, web and Android retain offline references. No remote model or API calls are made when offline. Opening source URLs, authentication and team synchronization still need internet; this is not full offline team editing or cold-start sign-in support.

## Update the app

```bash
git pull --ff-only
npm install
npx expo run:ios --port 8083
```

A native rebuild adds expo-network and the existing local model bridge. Reopening Metro cannot add missing native modules. Do not hand-edit generated ios/android directories. The bundle identifier is com.dugoutpilot.app; signing stays on the user's developer account.

## Verification

- TypeScript and changed-file ESLint.
- `node scripts/test-local-ai-and-batting.mjs`: mocked single-chat routing, offline no-network path, explicit online failure, auth/access denial, cancellation, bounded context, profile isolation, model-source validation, boundary regressions, follow-up runners, names, dates and game/drag behavior.
- `node scripts/test-rules-ai.mjs`: mocked auth/membership/access/budget enforcement, single Gemini attempt/no tools, baseball-only references, owned citations, server context, quota/failure handling and key/roster exclusion.
- `node scripts/test-rules-ai-budget.mjs`: service-only budget access, caps/rollback and repeatable migration in embedded Postgres (requires local PGlite test dependency).
- `node scripts/test-imports-and-rules.mjs` and `node scripts/test-coaching-logic.mjs` cover offline rule/import/coaching behavior.

These checks do not establish live model accuracy. Deployment, provider credentials, real question/follow-up evaluation, airplane-mode transitions and native Apple model quality still require testing on the configured app/device. Do not call the rules assistant ready based only on mocked tests or a JavaScript export.

## Migration from the former OpenAI backend

Deploy this function again after adding GEMINI_API_KEY. Existing OPENAI_API_KEY/OPENAI_RULES_MODEL secrets are ignored and may be removed if unused elsewhere. Migration 006 is unchanged; no additional SQL is needed if already applied. This is a backend-only update: after pulling, deploy the function; no app/native rebuild is required for this provider switch. A live Gemini call cannot be verified here without the project key/deployment.

## Chat presentation

Ask Dugout uses an opaque full-screen modal with a centered 720-point content limit on tablets and a full-width white keyboard background. The composer removes bottom safe-area padding and hides the informational footer while the keyboard is visible. Keyboard dismissal can be interactive on iOS, and viewport/content changes keep the latest message visible only when the reader is already near the bottom. Online status includes Gemini 3.5 Flash Lite as the configured provider label; service-fallback notices still disclose offline responses. Reference links are grouped with compact spacing. Actual iOS keyboard/rotation behavior requires simulator/device visual verification.
