begin;
alter table public.teams add column if not exists subscription_tier text not null default 'standard' check (subscription_tier in ('standard','elite'));
create or replace function public.is_tier_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users where id=auth.uid()
    and lower(email)='tristan.mcmillin@yahoo.com' and email_confirmed_at is not null);
$$;
create or replace function public.set_testing_tier(p_team_id uuid,p_tier text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.is_tier_admin() then raise exception 'Only the verified testing administrator can change tiers.' using errcode='42501'; end if;
  if p_tier is null or p_tier not in ('standard','elite') then raise exception 'Choose Standard or Elite.' using errcode='22023'; end if;
  if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then
    raise exception 'Select a team you belong to.' using errcode='42501';
  end if;
  update public.teams set subscription_tier=p_tier,activation_status='active',test_access=false where id=p_team_id;
  if not found then raise exception 'Team not found.' using errcode='22023'; end if;
end;
$$;
revoke all on function public.is_tier_admin(),public.set_testing_tier(uuid,text) from public,anon,authenticated;
grant execute on function public.is_tier_admin(),public.set_testing_tier(uuid,text) to authenticated;
commit;
