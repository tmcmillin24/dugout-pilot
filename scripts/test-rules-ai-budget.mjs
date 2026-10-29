import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111', outsider='22222222-2222-4222-8222-222222222222', coach='33333333-3333-4333-8333-333333333333';
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated; grant select on storage.objects to anon;`);
for(const [id,email] of [[owner,'owner@example.test'],[outsider,'other@example.test'],[coach,'coach@example.test']]) await db.query('insert into auth.users values($1,$2,now())',[id,email]);
for(const name of ['202610280001_teams.sql','202610280002_coaches_and_trials.sql','202610280003_team_logos.sql','202610280004_delete_teams.sql','202610280005_coaching.sql']) await db.exec(readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
async function as(id,role='authenticated'){await db.exec(`reset role; set role ${role}; set request.jwt.claim.sub='${id}';`);}
const create=(name,id)=>db.query('select public.create_team($1,$2)',[name,id]);



await db.exec(readFileSync(new URL('../supabase/migrations/202610290006_rules_ai_budget.sql',import.meta.url),'utf8'));
await as(owner); await create('Budget team',team);
await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await as('', 'anon'); await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await as('', 'service_role');
await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,outsider]));
for(let i=0;i<20;i++)await db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]);
await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await db.exec('reset role');
let counts=(await db.query('select requests from app_private.rules_ai_usage order by scope')).rows;
assert.equal(counts.length,4);for(const count of counts)assert.equal(count.requests,20);
await db.query("update public.teams set trial_started_at=now()-interval '15 days',trial_ends_at=now()-interval '1 day' where id=$1",[team]);
await as('', 'service_role'); await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await db.exec('reset role');await db.query("update public.teams set activation_status='active' where id=$1",[team]);
await db.query("update app_private.rules_ai_usage set requests=0 where scope='user-hour'");
await db.query("update app_private.rules_ai_usage set requests=100 where scope='user-day'");
await as('', 'service_role');await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await db.exec('reset role');assert.equal((await db.query("select requests from app_private.rules_ai_usage where scope='user-hour'")).rows[0].requests,0);
await db.query("update app_private.rules_ai_usage set requests=0");await db.query("update app_private.rules_ai_usage set requests=500 where scope='team-day'");
await as('', 'service_role');await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
await db.exec('reset role');await db.query("update app_private.rules_ai_usage set requests=0");await db.query("update app_private.rules_ai_usage set requests=2000 where scope='project-day'");
await as('', 'service_role');await assert.rejects(db.query('select public.consume_rules_ai_budget($1,$2)',[team,owner]));
console.log('PASS: service-only budget RPC, member/access enforcement, per-user/hour/day, team and project caps, failed-request rollback.');
await db.close();
