# Ask Dugout: direct official document pipeline

## Failure addressed

The old route asked Gemini URL Context to fetch PDF links and treated missing URL-retrieval metadata as a lookup failure. The mobile client then substituted an offline answer, potentially based on an unrelated saved-topic match. Mocked URL metadata did not validate the real retrieval path.

The replacement downloads the actual official PDFs in the Edge Function, checks their PDF signature/size/redirect hosts, uploads the files through Gemini Files, verifies ACTIVE state, and attaches the file handles to one Gemini 3.5 Flash-Lite generateContent request. URL Context and Google Search are not used. No question-specific answer was added.

Online service failures remain errors. Offline answers are used only by the offline route or the explicit no-team case, with their limited coverage identified. Connected status is not represented as proof an answer succeeded.

## Sources

- Baseball: USSSA 2026 or 2027 national rules, plus explicitly labeled MLB 2026 fallback. USSSA takes precedence.
- Fastpitch: USSSA 18th edition (December 2025), mapped to 2026.
- Slowpitch: USSSA 2026.
- Every age division uses its sport's full book. Age/format-specific exceptions must be read from that book.
- Unknown seasons require a supported profile, rather than silently substituting an edition. New official URLs/editions must be reviewed in the catalog; changed bytes at known URLs are detected automatically. No automated new-edition adoption is claimed.
- Rule/page citations are required and displayed with server-owned URLs. They improve traceability but cannot mathematically guarantee a model's rule interpretation.

## Document and answer caching

Apply `202611120003_rules_document_files.sql` in project `rlxscbutvxvsijgtcrbq`. It is idempotent and includes prior cache-table setup.

Only the service role can access the two cache tables. Official PDFs are not stored in the app or as database text. Google Files temporarily stores uploaded documents (48-hour expiry); metadata and hashes are stored server-side. Files are checked for ACTIVE state and expiry before use, renewed when unavailable, and tied to the Gemini key fingerprint to handle key changes safely.

Official source bytes are rechecked after six hours, or on an authorized forced refresh. Changed hashes cause document renewal and answer-cache invalidation. Unchanged books reuse their uploaded files. Failed checks stop the online answer; they do not bless stale documents.

Cited answers are cached for six hours, keyed by user, team, sport/age/season, question, dialogue, event notes, source hashes and implementation revision. Failures, clarifications, and unverified outputs are not cached. Different wording is not semantically merged. Source/version checks run before cache hits. Source cache failure allows fresh direct document processing; missing tables lose caching rather than disable the whole service.

Files reuse saves downloads/uploads, not the input tokens needed to process the books. Full-book requests still consume Gemini token allowance. Quota errors are shown explicitly; no paid-provider fallback is configured.

## Refresh

Active use rechecks sources every six hours. `{"action":"refresh_sources"}` is a service-role-only POST to the deployed function for prewarming or a Supabase Cron HTTP job. Configure the bearer credential through Supabase Vault, never in mobile config or git. No scheduled hosted job has been installed by this repository change. New URLs/editions require review.

## Deploy

1. Pull the branch and run the document-cache SQL in the Dugout Pilot project.
2. `npx supabase functions deploy rules-assistant --project-ref rlxscbutvxvsijgtcrbq`
3. Reload the development client. Installed standalone previews need a new build for the client error/route behavior; the server changes apply immediately on deployment.

## Validation

- `NODE_USE_ENV_PROXY=1 node scripts/check-rulebook-downloads.mjs` downloads all five official PDFs through the exact server downloader, reports sizes and SHA-256, and makes no Gemini request. On hosts not using a proxy the env setting is unnecessary.
- `node scripts/test-rules-ai.mjs` verifies direct PDF attachment, upload reuse/renewal, changed sources, missing-cache operation, role checks, sport/edition isolation, one model-generation call, rule/page citation requirements, and rejected forged sources. The Gemini/Supabase APIs are mocked in this suite.
- `node scripts/test-local-ai-and-batting.mjs` includes online failure/cancellation, official-link validation, and offline routing regressions.
- All five official PDFs were downloaded live in this workspace and checked with pdftotext. Gemini uploads/generation cannot be exercised here without the project's server API key; deployment is not live-verified by these tests.

After deployment, validate varied questions and follow-ups against actual cited rules in each sport. Include balls/strikes, foul bunts with two strikes, uncaught third strikes, obstruction/interference, overthrow awards, appeal/timing plays, pitcher rest, fastpitch DP/FLEX, and slowpitch counts. Repeat a question in a new conversation to check answer reuse. Do not label the system universally correct based on mocks or one successful answer.
