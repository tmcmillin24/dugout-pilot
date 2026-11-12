# Team plans

Starter $7.99 / Pro $14.99 / Elite $24.99 per team per month are proposed preview pricing. All coaches share the team's entitlement. There is no checkout, recurring charge, cancellation workflow, App Store subscription product or six-month pass implemented by this change. Printable lineup is not advertised because a dedicated printable-lineup feature is not yet implemented. Ask Dugout and FAQs keep their existing active-team access; the supplied tier proposal did not assign them to a different plan.

Starter: roster, manual batting and defensive field, three saved defenses, last batter and dugout display. Pro: ten saved defenses, field innings, pitching logs, practice planner and season history. Elite: CSV imports, player reports and stats recommendations, suggested batting order and pitching plan.

New trials grant Pro for the existing 14 days. Existing Standard teams map to Pro; Elite teams remain Elite. Test-access overrides still grant Elite. Expired and suspended plans do not unlock paid tools. Existing data remains stored on downgrade. Current imported stats remain viewable; imports and recommendations lock. Manual batting edits remain available, so the server cannot distinguish a manually chosen order from an order computed elsewhere. The suggestion tool checks Elite before generating and applying; stored generated pitching-plan changes, CSV and workload writes are additionally protected in the database.

Only the authenticated, email-confirmed auth.users record whose email is Tristan.mcmillin@yahoo.com may call set_testing_tier, and only for a team it belongs to. Other owners, coaches and anonymous clients cannot switch plans or directly update teams.subscription_tier. The testing action does not purchase a subscription.

Apply 202611120004_three_team_plans.sql in the Dugout Pilot project rlxscbutvxvsijgtcrbq after previous migrations. This migration updates the constraint/default, replaces the testing RPC, and adds a board-write trigger without replacing revision or membership checks. No rules-assistant deployment is involved. The migration has been exercised in local PGlite; hosted execution remains a user step.

Validation: node scripts/test-plan-access.mjs; node scripts/test-team-plans.mjs (requires @electric-sql/pglite in the local test environment); node scripts/test-stats-workflow.mjs; TypeScript and scoped ESLint. Native visual review still requires iPhone/iPad; no local Xcode runtime is available here.
