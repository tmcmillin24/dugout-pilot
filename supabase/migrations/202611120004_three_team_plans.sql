begin;
-- This migration is for Dugout Pilot only (rlxscbutvxvsijgtcrbq).
-- Keep legacy Standard teams at Pro; do not erase paid-feature data on downgrade.
alter table public.teams drop constraint if exists teams_subscription_tier_check;
update public.teams set subscription_tier='pro' where subscription_tier='standard';
alter table public.teams alter column subscription_tier set default 'starter';
alter table public.teams add constraint teams_subscription_tier_check check(subscription_tier in ('starter','pro','elite'));
create or replace function public.is_tier_admin()
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and lower(email)='tristan.mcmillin@yahoo.com' and email_confirmed_at is not null);
$$;
create or replace function public.set_testing_tier(p_team_id uuid,p_tier text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_tier_admin() then raise exception 'Only the verified testing administrator can change tiers.' using errcode='42501'; end if;
 if p_tier is null or p_tier not in ('starter','pro','elite') then raise exception 'Choose Starter, Pro or Elite.' using errcode='22023'; end if;
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then raise exception 'Select a team you belong to.' using errcode='42501'; end if;
 update public.teams set subscription_tier=p_tier,activation_status='active',test_access=false where id=p_team_id;
 if not found then raise exception 'Team not found.' using errcode='22023'; end if;
end;
$$;
revoke all on function public.is_tier_admin(),public.set_testing_tier(uuid,text) from public,anon,authenticated;
grant execute on function public.is_tier_admin(),public.set_testing_tier(uuid,text) to authenticated;

-- Runs even when board writes originate outside the app. The existing RPC keeps
-- its membership, activation, revision and advisory-lock checks.
create or replace function public.enforce_team_plan_board()
returns trigger language plpgsql security definer set search_path='' as $$
declare t public.teams; rank integer; prior jsonb; g jsonb; old_game jsonb; slot jsonb; old_slot jsonb; idx integer;
begin
 select * into t from public.teams where id=new.team_id;
 rank:=case when t.activation_status='suspended' then 0 when t.test_access then 3
   when t.activation_status='trial' and t.trial_ends_at>now() then 2
   when t.activation_status='active' then case t.subscription_tier when 'elite' then 3 when 'pro' then 2 when 'starter' then 1 else 0 end else 0 end;
 prior:=case when tg_op='UPDATE' then old.board else '{}'::jsonb end;
 if rank<2 then
  if coalesce(new.board->'practicePlans','[]'::jsonb) is distinct from coalesce(prior->'practicePlans','[]'::jsonb) then raise exception 'Pro access required for practice planning.' using errcode='42501'; end if;
  for idx in 3..greatest(9,jsonb_array_length(new.board->'defensiveLineups')-1) loop
   slot:=new.board->'defensiveLineups'->idx; old_slot:=prior->'defensiveLineups'->idx;
   if old_slot is null then
    if slot is not null and (coalesce(slot->'positions','{}'::jsonb)<>'{}'::jsonb or slot->>'id' is distinct from 'defense-'||(idx+1)::text or slot->>'name' is distinct from 'Lineup '||(idx+1)::text) then raise exception 'Pro access required for saved defenses 4–10.' using errcode='42501'; end if;
   elsif slot is distinct from old_slot then raise exception 'Pro access required for saved defenses 4–10.' using errcode='42501'; end if;
  end loop;
 end if;
 if rank<3 and coalesce(new.board->'seasonImports','[]'::jsonb) is distinct from coalesce(prior->'seasonImports','[]'::jsonb) then raise exception 'Elite access required for CSV imports.' using errcode='42501'; end if;
 for g in select value from jsonb_array_elements(new.board->'games') loop
  select value into old_game from jsonb_array_elements(coalesce(prior->'games','[]'::jsonb)) where value->>'id'=g->>'id' limit 1;
  if rank<2 and (coalesce(g->'pitchers','{}'::jsonb) is distinct from coalesce(old_game->'pitchers','{}'::jsonb) or coalesce(g->'defenseInnings','{}'::jsonb) is distinct from coalesce(old_game->'defenseInnings','{}'::jsonb) or coalesce(g->>'defenseTrackingInning','0') is distinct from coalesce(old_game->>'defenseTrackingInning','0')) then raise exception 'Pro access required for pitching and defensive innings tracking.' using errcode='42501'; end if;
  if rank<3 and (coalesce(g->'stats','{}'::jsonb) is distinct from coalesce(old_game->'stats','{}'::jsonb) or coalesce(g->>'importFingerprint','') is distinct from coalesce(old_game->>'importFingerprint','') or coalesce(g->>'importedAt','') is distinct from coalesce(old_game->>'importedAt','') or coalesce(g->>'statsContribution','') is distinct from coalesce(old_game->>'statsContribution','') or coalesce(g->'pitchingPlan','[]'::jsonb) is distinct from coalesce(old_game->'pitchingPlan','[]'::jsonb)) then raise exception 'Elite access required for stats imports and generated pitching plans.' using errcode='42501'; end if;
  if rank<2 and exists(select 1 from jsonb_array_elements(new.board->'defensiveLineups') with ordinality as l(value,n) where n>3 and value->>'id'=g->>'defensiveLineupId') and (g->'positions' is distinct from old_game->'positions' or g->>'defensiveLineupId' is distinct from old_game->>'defensiveLineupId') then raise exception 'Pro access required to use saved defenses 4–10.' using errcode='42501'; end if;
 end loop;
 return new;
end;
$$;
revoke all on function public.enforce_team_plan_board() from public,anon,authenticated;
drop trigger if exists enforce_team_plan_board on public.team_boards;
create trigger enforce_team_plan_board before insert or update of board on public.team_boards for each row execute function public.enforce_team_plan_board();
commit;
