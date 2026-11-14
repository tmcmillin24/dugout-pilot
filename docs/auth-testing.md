# Authentication foundation

Uses the existing Supabase dependencies and local environment configuration. No database migrations or team permissions are added in this change. Creating an account does not activate a team or subscription.

## Local verification
1. Keep .env ignored. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the Dugout Pilot project.
2. Run npm ci, npx tsc --noEmit, and npx expo lint.
3. Start with npx expo start --clear --port 8083 and open iOS.
4. Create a test account. If email confirmation is enabled, confirm using the email and then return to the app to sign in manually. Automatic email-link routing and password recovery are not implemented yet.
5. Check invalid credentials and offline errors. Buttons should become usable again after errors.
6. Sign in; verify the welcome screen shows the account email.
7. Close and reopen the app; verify the session is restored. Background and foreground it to check token refresh.
8. Sign out; verify the login screen returns. Restart and verify the session stays signed out.
9. Remove either environment variable temporarily and restart; verify the configuration screen appears without auth requests.

Live Supabase and iOS tests require the developer's local configuration and simulator.
