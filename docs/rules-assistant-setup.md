# Ask Dugout: one conversation, automatic online/offline routing

The chat has one composer and a small Online / Offline connection indicator. It has no mode buttons. Network changes update the indicator; sending rechecks the network. Online means the device reports a connection, not that the AI service is deployed or healthy. Service errors show a short notice on the affected offline answer. Auth/access denials remain explicit errors. Stopping/closing cancels the current request; switching networks does not clear history or replay a question.

## Activate online answers

The code is ready for deployment, but a GitHub pull alone does not activate the backend. This environment has no Supabase deployment credentials or OpenAI API key. Do not paste secrets into chat, GitHub, or EXPO_PUBLIC variables.

1. In Supabase SQL Editor, run `supabase/migrations/202610290006_rules_ai_budget.sql` after migrations 001–005. The current 006 is safe to rerun if the former version was already applied. It creates private usage counters and a service-only budget RPC, not a chat-history table.
2. In Supabase Edge Functions → Secrets, set `OPENAI_API_KEY` for the app's API project with Responses/web-search access. Optional `OPENAI_RULES_MODEL` defaults to `gpt-5-mini`. Provider API usage is billed separately from a ChatGPT subscription.
3. Deploy from the project folder:

```bash
npx supabase login
npx supabase functions deploy rules-assistant --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

The handler independently verifies bearer tokens against Supabase Auth and checks membership and team access. `verify_jwt=false` supports asymmetric project signing keys; never remove the handler checks. It loads rules context/event notes from the server rather than trusting client profile values. It uses built-in Supabase credentials, including support for named default keys.

Default budgets: 20 requests/user/hour, 100/user/day, 500/team/day, 2,000/project/day (UTC). Each question can make two model calls, each with at most three web-tool calls and 2,400 output tokens. Failed provider requests consume the reserved budget. These are request caps, not a guaranteed dollar cap; configure API-project spending limits as appropriate.

## Answer behavior

Online answers use domain-filtered Responses web search against official USSSA sources first. General baseball questions may trigger a separate MLB-source fallback; softball never uses MLB. Sport/division/season and event exceptions remain attached. Missing or ambiguous facts prompt clarification; unverified answers cannot masquerade as sourced rulings. Inline citations and source links are rendered from validated API annotations. No provider key or service credential ships in the app.

Up to three recent question/answer pairs are sent for follow-up context. Roster records are not sent. User-entered questions and event notes may contain personal information: avoid putting sensitive details there. `store:false` is sent to the provider; it does not promise exemption from provider abuse-monitoring/data policies. Conversation UI state remains in memory and is isolated by team/profile.

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
- `node scripts/test-rules-ai.mjs`: mocked auth/membership/access/budget enforcement, source-domain search, baseball-only fallback, citations, server context, failures and key/roster exclusion.
- `node scripts/test-rules-ai-budget.mjs`: service-only budget access, caps/rollback and repeatable migration in embedded Postgres (requires local PGlite test dependency).
- `node scripts/test-imports-and-rules.mjs` and `node scripts/test-coaching-logic.mjs` cover offline rule/import/coaching behavior.

These checks do not establish live model accuracy. Deployment, provider credentials, real question/follow-up evaluation, airplane-mode transitions and native Apple model quality still require testing on the configured app/device. Do not call the rules assistant ready based only on mocked tests or a JavaScript export.
