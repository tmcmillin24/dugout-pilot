begin;
-- One shared coaching board per team. Revision checks prevent silent lost updates.
create table public.team_boards (
  team_id uuid primary key references public.teams(id) on delete cascade,
  board jsonb not null,
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
alter table public.team_boards enable row level security;
grant select on public.team_boards to authenticated;
create policy board_members_read on public.team_boards for select to authenticated
  using (exists(select 1 from public.team_memberships m where m.team_id = team_boards.team_id and m.user_id = auth.uid()));

create function public.save_team_board(p_team_id uuid, p_revision integer, p_board jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_revision integer;
begin
  -- Serialize against team deletion and other board writers, then recheck membership.
  perform pg_advisory_xact_lock(hashtextextended(p_team_id::text,0));
  perform 1 from public.teams where id = p_team_id for update;
  if not exists(select 1 from public.team_memberships where team_id = p_team_id and user_id = auth.uid()) then
    raise exception 'Team membership required';
  end if;
  if not (public.has_team_feature_access(p_team_id) or exists(select 1 from public.teams where id=p_team_id and test_access)) then
    raise exception 'Team access has ended. Your saved data is still available to view.';
  end if;
  if p_board is null or jsonb_typeof(p_board) <> 'object' or octet_length(p_board::text)>2000000
    or jsonb_typeof(p_board->'players') is distinct from 'array'
    or jsonb_typeof(p_board->'games') is distinct from 'array'
    or jsonb_typeof(p_board->'defensiveLineups') is distinct from 'array'
    or jsonb_typeof(p_board->'practicePlans') is distinct from 'array' then
    raise exception 'Invalid coaching data';
  end if;
  if p_revision = 0 then
    insert into public.team_boards(team_id,board,updated_by) values(p_team_id,p_board,auth.uid())
      on conflict do nothing returning revision into next_revision;
  else
    update public.team_boards set board=p_board,revision=revision+1,updated_at=now(),updated_by=auth.uid()
      where team_id=p_team_id and revision=p_revision returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'Another coach saved changes. Reload the latest team data and try again.' using errcode='40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_team_board(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.save_team_board(uuid,integer,jsonb) to authenticated;
commit;
