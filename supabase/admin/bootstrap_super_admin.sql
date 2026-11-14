-- OPTIONAL: run only in the Dugout Pilot SQL Editor as the database administrator.
-- Replace this placeholder with your confirmed Dugout Pilot account email.
-- This is not required for automatic team trials or normal owner/coach use.
do $$
declare
  admin_email text := 'REPLACE_WITH_YOUR_CONFIRMED_EMAIL';
  account_id uuid;
begin
  if admin_email = 'REPLACE_WITH_YOUR_CONFIRMED_EMAIL' then
    raise exception 'Replace the email placeholder before running this script.';
  end if;
  select id into strict account_id from auth.users
    where lower(email) = lower(btrim(admin_email)) and email_confirmed_at is not null;
  insert into app_private.super_admins(user_id) values(account_id) on conflict (user_id) do nothing;
end;
$$;
