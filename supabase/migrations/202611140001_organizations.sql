begin;
-- Dugout Pilot only: rlxscbutvxvsijgtcrbq. Organization access never changes team billing or coaching permissions.
create table public.organizations (
 id uuid primary key default gen_random_uuid(),
 name text not null check(char_length(btrim(name)) between 2 and 80),
 owner_id uuid not null references auth.users(id) on delete cascade,
 join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
 created_at timestamptz not null default now()
);
create index organizations_owner on public.organizations(owner_id);
create table public.organization_teams (
 team_id uuid primary key references public.teams(id) on delete cascade,
 organization_id uuid not null references public.organizations(id) on delete cascade,
 joined_at timestamptz not null default now()
);
create index organization_teams_org on public.organization_teams(organization_id,team_id);
alter table public.organizations enable row level security;
alter table public.organization_teams enable row level security;
revoke all on public.organizations,public.organization_teams from public,anon,authenticated;
grant select on public.organizations to authenticated;
create policy organization_owner_read on public.organizations for select to authenticated using(owner_id=(select auth.uid()));

create function public.create_organization(p_name text,p_request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in to create an organization.' using errcode='42501'; end if;
 if p_request_id is null or p_name is null or char_length(btrim(p_name)) not between 2 and 80 then raise exception 'Use an organization name with 2 to 80 characters.'; end if;
 insert into public.organizations(id,name,owner_id) values(p_request_id,btrim(p_name),auth.uid()) on conflict(id) do nothing;
 if not exists(select 1 from public.organizations where id=p_request_id and owner_id=auth.uid()) then raise exception 'Organization unavailable.' using errcode='42501'; end if;
 return p_request_id;
end; $$;
create function public.rotate_organization_code(p_organization_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare code text;
begin
 update public.organizations set join_code=upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)) where id=p_organization_id and owner_id=auth.uid() returning join_code into code;
 if code is null then raise exception 'Director access required.' using errcode='42501'; end if;
 return code;
end; $$;
create function public.link_team_organization(p_team_id uuid,p_code text) returns text
language plpgsql security definer set search_path='' as $$
declare org_id uuid; org_name text; existing uuid;
begin
 perform 1 from public.teams where id=p_team_id for update;
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid() and role='owner') then raise exception 'Only the team owner can connect an organization.' using errcode='42501'; end if;
 select id,name into org_id,org_name from public.organizations where join_code=upper(regexp_replace(coalesce(p_code,''),'[[:space:]-]','','g')) for share;
 if org_id is null then raise exception 'Organization code not found. Check the code with your director.'; end if;
 select organization_id into existing from public.organization_teams where team_id=p_team_id;
 if existing is not null and existing<>org_id then raise exception 'Disconnect the current organization before joining another.'; end if;
 insert into public.organization_teams(team_id,organization_id) values(p_team_id,org_id) on conflict(team_id) do nothing;
 return org_name;
end; $$;
-- Creation plus association is atomic: an invalid code does not leave a half-created team.
create function public.create_team_with_organization(team_name text,request_id uuid,p_code text) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid;
begin
 result:=public.create_team(team_name,request_id);
 if nullif(btrim(p_code),'') is not null then perform public.link_team_organization(result,p_code); end if;
 return result;
end; $$;
create function public.team_organization(p_team_id uuid) returns table(id uuid,name text)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid()) then raise exception 'Team membership required.' using errcode='42501'; end if;
 return query select o.id,o.name from public.organizations o join public.organization_teams t on t.organization_id=o.id where t.team_id=p_team_id;
end; $$;
create function public.disconnect_team_organization(p_team_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.teams where id=p_team_id for update;
 if not exists(select 1 from public.team_memberships where team_id=p_team_id and user_id=auth.uid() and role='owner')
 and not exists(select 1 from public.organization_teams t join public.organizations o on o.id=t.organization_id where t.team_id=p_team_id and o.owner_id=auth.uid()) then raise exception 'Team owner or organization director required.' using errcode='42501'; end if;
 delete from public.organization_teams where team_id=p_team_id;
end; $$;
create function public.list_organization_teams(p_organization_id uuid,p_page integer default 0)
returns table(team_id uuid,name text,player_count integer,import_count integer,last_import text,age text,sport text)
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.organizations where id=p_organization_id and owner_id=auth.uid()) then raise exception 'Director access required.' using errcode='42501'; end if;
 if p_page is null or p_page<0 or p_page>10000 then raise exception 'Invalid page.'; end if;
 return query select t.id,t.name,jsonb_array_length(coalesce(b.board->'players','[]'::jsonb)),
 (jsonb_array_length(coalesce(b.board->'seasonImports','[]'::jsonb))+(select count(*)::integer from jsonb_array_elements(coalesce(b.board->'games','[]'::jsonb)) g where nullif(g->>'importLabel','') is not null))::integer,
 (select max(v->>'importedAt') from (select value v from jsonb_array_elements(coalesce(b.board->'seasonImports','[]'::jsonb)) union all select value from jsonb_array_elements(coalesce(b.board->'games','[]'::jsonb))) dates),
 coalesce(b.board#>>'{rulesContext,age}',''),coalesce(b.board#>>'{rulesContext,sport}','')
 from public.organization_teams ot join public.teams t on t.id=ot.team_id left join public.team_boards b on b.team_id=t.id
 where ot.organization_id=p_organization_id order by lower(t.name),t.id limit 50 offset p_page*50;
end; $$;
-- Explicit stats-only projection. No player notes, game notes, practices, staff emails or invitation data.
create function public.organization_team_stats(p_organization_id uuid,p_team_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b jsonb;
begin
 if not exists(select 1 from public.organizations o join public.organization_teams ot on ot.organization_id=o.id where o.id=p_organization_id and ot.team_id=p_team_id and o.owner_id=auth.uid()) then raise exception 'This team is not in your organization.' using errcode='42501'; end if;
 select board into b from public.team_boards where team_id=p_team_id;
 if b is null then return null; end if;
 return jsonb_build_object('statsSeason',b->'statsSeason','rulesContext',jsonb_build_object('age',b#>'{rulesContext,age}','sport',b#>'{rulesContext,sport}','season',b#>'{rulesContext,season}'),
 'players',coalesce((select jsonb_agg(jsonb_build_object('id',p->'id','name',p->'name','number',p->'number','positions',p->'positions')) from jsonb_array_elements(coalesce(b->'players','[]'::jsonb)) p),'[]'::jsonb),
 'seasonImports',coalesce((select jsonb_agg(jsonb_build_object('id',s->'id','season',s->'season','label',s->'label','importedAt',s->'importedAt','stats',s->'stats','coveredGameIds',s->'coveredGameIds','eraInnings',s->'eraInnings','gamesPlayed',s->'gamesPlayed')) from jsonb_array_elements(coalesce(b->'seasonImports','[]'::jsonb)) s),'[]'::jsonb),
 'games',coalesce((select jsonb_agg(jsonb_build_object('id',g->'id','date',g->'date','statsSeason',g->'statsSeason','stats',coalesce(g->'stats','{}'::jsonb),'statsContribution',g->'statsContribution','importLabel',g->'importLabel','importedAt',g->'importedAt','eraInnings',g->'eraInnings')) from jsonb_array_elements(coalesce(b->'games','[]'::jsonb)) g),'[]'::jsonb));
end; $$;
revoke all on function public.create_organization(text,uuid),public.rotate_organization_code(uuid),public.link_team_organization(uuid,text),public.create_team_with_organization(text,uuid,text),public.team_organization(uuid),public.disconnect_team_organization(uuid),public.list_organization_teams(uuid,integer),public.organization_team_stats(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_organization(text,uuid),public.rotate_organization_code(uuid),public.link_team_organization(uuid,text),public.create_team_with_organization(text,uuid,text),public.team_organization(uuid),public.disconnect_team_organization(uuid),public.list_organization_teams(uuid,integer),public.organization_team_stats(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
