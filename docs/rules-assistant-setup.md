# Ask Dugout: offline reference + optional AI

## What works immediately

The header uses the supplied wordmark, with title and tagline aligned to the first letter. The labeled ASK DUGOUT button is available throughout signed-in screens; Rules Desk also has an explicit OPEN ASK DUGOUT button.

Saved Rules is the default. Asking a saved-reference question does not call an AI API or perform a web search. Source links themselves require internet. Saved answers are edition-labeled summaries, not an on-device generative model or a complete licensed rulebook. The common infield-fly explanation includes MLB 2026 references and warns about youth/playing-format exceptions; the bat matcher recognizes plural phrasing and provides 11U/12U baseball answers for the packaged 2026/2027 references. Missing division/season prompts a clarification, and saved follow-up context can fill it. Other sports never reuse MLB baseball answers. Broader offline packs remain future work.

The app still uses Supabase for sign-in, team data and collaboration. This update does not make all app startup/account/team workflows usable offline. Saved Rules can answer without a selected team once the signed-in app is open; no roster or game edits are queued offline.

## Optional cloud AI activation

The server and app connection are implemented, but deployment and an API key are required. Without setup, Ask AI shows a setup message and Saved Rules continues working.

1. In Supabase SQL Editor, apply `supabase/migrations/202610290006_rules_ai_budget.sql` once after 001–005. It creates private counters and a service-role-only budget RPC; it stores no questions, answers or roster data.
2. In Supabase → Edge Functions → Secrets, add `OPENAI_API_KEY` for an OpenAI API project with model/web-search access. Do not paste this key into chat, GitHub, or an EXPO_PUBLIC variable. Optional `OPENAI_RULES_MODEL` defaults to `gpt-5-mini`; select a Responses/web-search-capable model. No AI call is made in Saved Rules mode; cloud usage can incur provider charges.
3. Deploy the single-file function from this repository:

```bash
npx supabase login
npx supabase functions deploy rules-assistant --project-ref YOUR_PROJECT_REF --no-verify-jwt
```

Find YOUR_PROJECT_REF in your Supabase project URL (`https://YOUR_PROJECT_REF.supabase.co`). The function uses Supabase-provided URL/anon/service-role settings or named default publishable/secret keys. No server credentials belong in the mobile app.

The platform gateway JWT check is disabled deliberately in `supabase/config.toml` because the function independently verifies the bearer user token against Supabase Auth. That supports projects using asymmetric signing keys. Never remove the handler's auth/user/membership checks.

4. Set the actual sport, age and season in Rules Desk. Choose Ask AI and test infield fly, bats, a follow-up, and a softball question. Confirm citations, selected edition, and event-specific exceptions.

## Request and source handling

`supabase.functions.invoke('rules-assistant')` sends the selected team ID, question, and at most six recent conversation messages. The function authenticates the user and loads membership, access status and rules context from Supabase, rather than trusting client-supplied profile settings. Only sport/age/season and event notes reach the model; the roster field is not sent. Event notes are user content, so avoid putting sensitive personal data there.

Every model request forces domain-filtered OpenAI Responses web search, USSSA first (`usssa.com`, `usssa.net`, `usssabaseball.org`). If the model reports an uncovered general baseball rule, a second request permits official MLB sources; this fallback is disabled for fastpitch and slowpitch. The model must check USSSA/event exceptions, cite the edition and distinguish MLB fallback. Returned URL annotations are validated against the source domain list and rendered as clickable inline citations plus source links. An answer with no search/citations is not represented as a verified rule. Clarifications are explicitly distinct from sourced rule answers.

There is no secret in the model prompt. Web pages, conversation messages and event notes are treated as untrusted data. Only text and links are returned; there are no tools that change a lineup or roster. `store:false` is sent to the provider; that does not promise exemption from the provider's abuse-monitoring/data policies. No full rulebook is republished or silently downloaded.

Budgets default to 20 requests/user/hour, 100/user/day, 500/team/day and 2,000/project/day, using UTC windows. A request may perform up to two model calls, each capped at three tool calls and 2,400 output tokens. Failed provider attempts consume the reserved budget. Counters older than two days are removed on subsequent calls. Add provider project spending limits as appropriate. These caps bound requests, not a guaranteed dollar amount.

## Verification and limits

- `node scripts/test-rules-ai.mjs`: mocked HTTP tests cover authentication, membership/access, budget checks, server context, roster/key exclusion, domain filtering, forced search, baseball-only fallback, citations and errors.
- `node scripts/test-rules-ai-budget.mjs`: embedded Postgres tests cover service-only access, all caps and transactional rollback. Requires the local PGlite test dependency.
- `node scripts/test-imports-and-rules.mjs`: offline matching, clarification, infield-fly/bat cases and sport/profile isolation.
- TypeScript, changed-file ESLint, and Expo iOS/web exports.

Live provider/model accuracy, production Supabase configuration and physical-device UX cannot be verified without the deployment/key and simulator. A direct on-device generative model is not included; that needs a native integration and device-availability strategy, distinct from this offline reference mode.
