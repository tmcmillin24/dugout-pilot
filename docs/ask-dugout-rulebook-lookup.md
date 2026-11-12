# Ask Dugout full-rulebook lookup

The online assistant now makes one Gemini 3.5 Flash-Lite request with URL Context. It reads the server-selected official PDFs, rather than treating the small summary library as complete. No Google Search tool or automatic paid-provider fallback is enabled.

## Sources and scope

- Baseball: USSSA 2026/2027 national rules, with MLB 2026 explicitly labeled as baseball fallback. USSSA overrides MLB.
- Fastpitch: USSSA 18th edition (December 2025), mapped to the 2026 profile.
- Slowpitch: USSSA 2026 rulebook.
- Unknown softball seasons fail explicitly; an old book is never silently labeled as a new edition.
- New official URLs/editions must be reviewed and added to the server-owned catalog. Source monitoring detects changes at existing URLs; it does not automatically adopt arbitrary new documents.

Only successfully retrieved catalog URLs may be cited. Failure to load a USSSA baseball book blocks a supposedly complete USSSA ruling based solely on MLB. No guarantees are made about every question or model interpretation; event-specific exceptions and incomplete scenarios can require clarification.

## Cache

Apply `202611120002_rules_answer_cache.sql` in the Dugout Pilot database. Both tables are service-only; authenticated app clients cannot write/read cached answers directly.

Source PDFs are checked using SHA-256, with fingerprints cached for six hours. Files are downloaded transiently for hashing, not persisted in the database or distributed in the app. Failed checks disable answer-cache reuse. Answer keys include user, team, sport/division/season, conversation, event notes, source fingerprints, and cache revision. Only cited full-book answers are stored, for six hours. Clarifications, errors and unverified answers are not cached. A repeated identical question in the same context can avoid a Gemini request; differently worded questions are not semantically merged.

When sources change, the fingerprint changes and previous answers are no longer reused. Old rows expire and are cleaned during subsequent successful cache writes. `RULES_CACHE_VERSION` can invalidate all answers administratively.

Full rulebook retrieval can use significantly more input tokens than summary-only requests. One request still counts once toward request quotas, but token quotas also apply. URL Context availability on the actual project's free tier and live answer quality must be verified after deployment.

## Optional scheduled refresh

On-demand refresh works without Cron. For checks while nobody is using the app, create a Supabase Cron HTTP POST job every six hours:

- URL: `https://rlxscbutvxvsijgtcrbq.supabase.co/functions/v1/rules-assistant`
- Body: `{"action":"refresh_sources"}`
- Headers: Content-Type application/json and Authorization Bearer with this project's service-role JWT, stored in Supabase Vault. Never put that key in app config, git, or the chat.

Only an exact server service-role credential can run refresh. Normal signed-in user tokens are rejected. Check Cron results; source refresh failures return HTTP 503 and active requests retry on demand. A scheduled job has not been installed by this code change.

## Deploy and validate

1. Apply the cache SQL in project `rlxscbutvxvsijgtcrbq`.
2. Deploy: `npx supabase functions deploy rules-assistant --project-ref rlxscbutvxvsijgtcrbq`.
3. Reload the development app. Already installed previews need rebuilding for new client messages, but use the new server as soon as it is deployed.
4. Test general, scenario, and follow-up questions separately for baseball, fastpitch and slowpitch; verify cited rule numbers against the PDFs. Check Edge Function logs for provider errors if URL Context is unavailable. Never log questions, service keys or provider keys.
5. Repeat an identical question in a new conversation; verify cacheHit and no new Gemini call. Source/context changes must miss the cache.

Automated tests mock Gemini, Supabase and retrieval metadata. They verify routing, isolation, validation and caching, not actual provider accuracy. No live Google credential is available in this workspace.
