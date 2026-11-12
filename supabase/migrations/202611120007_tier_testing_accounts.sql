begin;
-- Dugout Pilot only: rlxscbutvxvsijgtcrbq.
-- Testing controls are limited to these verified accounts and existing team membership.
create or replace function public.is_tier_admin()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(
  select 1 from auth.users
  where id=auth.uid()
    and lower(email) in ('tristan.mcmillin@yahoo.com','brilestodd@gmail.com')
    and email_confirmed_at is not null
 );
$$;
revoke all on function public.is_tier_admin() from public,anon,authenticated;
grant execute on function public.is_tier_admin() to authenticated;
notify pgrst, 'reload schema';
commit;

