begin;
-- Dugout Pilot only: rlxscbutvxvsijgtcrbq. Snapshots contain stats, not entire boards.
create table if not exists public.team_import_history(
 id uuid primary key default gen_random_uuid(),team_id uuid not null references public.teams(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),
 label text not null,summary text not null,player_count integer not null default 0,previous_stats jsonb,revision integer not null
);
alter table public.team_import_history enable row level security;
revoke all on public.team_import_history from public,anon,authenticated;
create index if not exists team_import_history_recent on public.team_import_history(team_id,created_at desc);
create or replace function public.team_stats_snapshot(p_board jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select jsonb_build_object('seasonImports',coalesce(p_board->'seasonImports','[]'::jsonb),'statsSeason',p_board->'statsSeason','games',coalesce((select jsonb_agg(jsonb_build_object('id',g->'id')||coalesce((select jsonb_object_agg(k,v) from jsonb_each(g) as fields(k,v) where k=any(array['stats','statsSeason','statsContribution','eraInnings','statColumns','importedAt','importLabel','importFingerprint'])),'{}'::jsonb) order by g->>'id') from jsonb_array_elements(coalesce(p_board->'games','[]'::jsonb)) as games(g) where coalesce(g->>'importLabel','')<>'' or coalesce(g->'stats','{}'::jsonb)<>'{}'::jsonb),'[]'::jsonb));
$$;
create or replace function public.stats_for_current_roster(p_stats jsonb,p_players jsonb)
returns jsonb language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from jsonb_each(coalesce(p_stats,'{}'::jsonb)) fields(k,v) where exists(select 1 from jsonb_array_elements(p_players) p where p->>'id'=k);
$$;
create or replace function public.capture_team_import()
returns trigger language plpgsql security definer set search_path='' as $$
declare previous jsonb; next_stats jsonb; filename text; count_players integer; changed_season jsonb; changed_game jsonb; change_summary text;
begin
 previous:=public.team_stats_snapshot(case when tg_op='UPDATE' then old.board else '{}'::jsonb end);
 next_stats:=public.team_stats_snapshot(new.board);
 if previous=next_stats then return new; end if;
 select s into changed_season from jsonb_array_elements(coalesce(new.board->'seasonImports','[]'::jsonb)) new_s(s) where not exists(select 1 from jsonb_array_elements(previous->'seasonImports') old_s where old_s=s) limit 1;
 if changed_season is not null then
  filename:=changed_season->>'label';change_summary:='Season '||coalesce(changed_season->>'season','')||' totals updated';
 else
  select g into changed_game from jsonb_array_elements(next_stats->'games') g where not exists(select 1 from jsonb_array_elements(previous->'games') old_g where old_g=g) limit 1;
  filename:=changed_game->>'importLabel';
  select coalesce(g->>'label','Game')||' · vs '||coalesce(g->>'opponent','opponent') into change_summary from jsonb_array_elements(new.board->'games') g where g->>'id'=changed_game->>'id';
  change_summary:=coalesce(change_summary,'Stats updated or removed')||case changed_game->>'statsContribution' when 'add' then ' · Adds to season totals' when 'included' then ' · Included in season baseline' else '' end;
 end if;
 select count(distinct player_id) into count_players from (
  select jsonb_object_keys(coalesce(s->'stats','{}'::jsonb)) player_id from jsonb_array_elements(next_stats->'seasonImports') s
  union select jsonb_object_keys(coalesce(g->'stats','{}'::jsonb)) from jsonb_array_elements(next_stats->'games') g
 ) ids;
 insert into public.team_import_history(team_id,actor_id,label,summary,player_count,previous_stats,revision) values(new.team_id,auth.uid(),coalesce(nullif(filename,''),'Stats updated'),change_summary,count_players,previous,new.revision);
 -- Retain metadata for 30 changes and recoverable snapshots for the latest 5.
 update public.team_import_history set previous_stats=null where team_id=new.team_id and id in (select id from public.team_import_history where team_id=new.team_id order by revision desc,id desc offset 5);
 delete from public.team_import_history where team_id=new.team_id and id in (select id from public.team_import_history where team_id=new.team_id order by revision desc,id desc offset 30);
 return new;
end;
$$;
drop trigger if exists capture_team_import on public.team_boards;
create trigger capture_team_import after insert or update of board on public.team_boards for each row execute function public.capture_team_import();
create or replace function public.list_team_import_history(p_team_id uuid)
returns table(id uuid,created_at timestamptz,label text,summary text,player_count integer,actor text,recoverable boolean,revision integer)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then raise exception 'Team membership required.' using errcode='42501'; end if;
 return query select h.id,h.created_at,h.label,h.summary,h.player_count,case when h.actor_id=auth.uid() then 'You' when m.user_id is not null then coalesce(u.email,'Team coach') else 'Former team coach' end,h.previous_stats is not null,h.revision from public.team_import_history h left join auth.users u on u.id=h.actor_id left join public.team_memberships m on m.team_id=h.team_id and m.user_id=h.actor_id where h.team_id=p_team_id order by h.revision desc,h.id desc limit 30;
end;
$$;
create or replace function public.restore_team_import(p_team_id uuid,p_history_id uuid,p_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb; current_board jsonb; next_board jsonb; next_revision integer; restored_games jsonb; restored_seasons jsonb; keys text[]:=array['stats','statsSeason','statsContribution','eraInnings','statColumns','importedAt','importLabel','importFingerprint'];
begin
 perform pg_advisory_xact_lock(hashtextextended(p_team_id::text,0));
 perform 1 from public.teams where id=p_team_id for update;
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then raise exception 'Team membership required.' using errcode='42501'; end if;
 if not exists(select 1 from public.teams where id=p_team_id and activation_status<>'suspended' and (test_access or activation_status='active' and subscription_tier='elite')) then raise exception 'Elite access required to restore imported stats.' using errcode='42501'; end if;
 select previous_stats into snapshot from public.team_import_history where id=p_history_id and team_id=p_team_id;
 if snapshot is null then raise exception 'That stats backup is no longer available.' using errcode='22023'; end if;
 select board into current_board from public.team_boards where team_id=p_team_id and revision=p_revision;
 if current_board is null then raise exception 'Team data changed. Reload before restoring stats.' using errcode='40001'; end if;
 -- Keep current roster, lineups, schedules, pitch logs and practice plans.
 -- Never recreate a game deleted since the backup.
 select coalesce(jsonb_agg((g-keys)||coalesce((select s-'id' from jsonb_array_elements(snapshot->'games') s where s->>'id'=g->>'id'),'{}'::jsonb)||case when exists(select 1 from jsonb_array_elements(snapshot->'games') s where s->>'id'=g->>'id') then '{}'::jsonb else '{"stats":{},"importLabel":""}'::jsonb end order by n),'[]'::jsonb) into restored_games from jsonb_array_elements(current_board->'games') with ordinality as games(g,n);
 select coalesce(jsonb_agg(jsonb_set(g,'{stats}',public.stats_for_current_roster(g->'stats',current_board->'players')) order by n),'[]'::jsonb) into restored_games from jsonb_array_elements(restored_games) with ordinality games(g,n);
 select coalesce(jsonb_agg(jsonb_set(s,'{stats}',public.stats_for_current_roster(s->'stats',current_board->'players')) order by n),'[]'::jsonb) into restored_seasons from jsonb_array_elements(snapshot->'seasonImports') with ordinality seasons(s,n);
 next_board:=current_board||jsonb_build_object('seasonImports',restored_seasons,'games',restored_games);
 if snapshot->>'statsSeason' is not null then next_board:=next_board||jsonb_build_object('statsSeason',snapshot->'statsSeason'); else next_board:=next_board-'statsSeason'; end if;
 next_revision:=public.save_team_board(p_team_id,p_revision,next_board);
 return jsonb_build_object('board',next_board,'revision',next_revision);
end;
$$;
create or replace function public.enforce_pitching_review_plan()
returns trigger language plpgsql security definer set search_path='' as $$
declare g jsonb; old_g jsonb;
begin
 for g in select value from jsonb_array_elements(new.board->'games') loop
  select value into old_g from jsonb_array_elements(case when tg_op='UPDATE' then old.board->'games' else '[]'::jsonb end) where value->>'id'=g->>'id' limit 1;
  if g->>'pitchingReviewedAt' is distinct from old_g->>'pitchingReviewedAt' or g->>'pitchingReviewKey' is distinct from old_g->>'pitchingReviewKey' then
   if not exists(select 1 from public.teams t where t.id=new.team_id and t.activation_status<>'suspended' and (t.test_access or t.activation_status='trial' and t.trial_ends_at>now() or t.activation_status='active' and t.subscription_tier in ('pro','elite'))) then raise exception 'Pro access required for pitching availability review.' using errcode='42501'; end if;
  end if;
 end loop;
 return new;
end;
$$;
drop trigger if exists enforce_pitching_review_plan on public.team_boards;
create trigger enforce_pitching_review_plan before insert or update of board on public.team_boards for each row execute function public.enforce_pitching_review_plan();
revoke all on function public.enforce_pitching_review_plan() from public,anon,authenticated;
revoke all on function public.stats_for_current_roster(jsonb,jsonb),public.team_stats_snapshot(jsonb),public.capture_team_import(),public.list_team_import_history(uuid),public.restore_team_import(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.list_team_import_history(uuid),public.restore_team_import(uuid,uuid,integer) to authenticated;
commit;
