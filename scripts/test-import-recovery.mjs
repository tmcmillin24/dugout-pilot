import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
const owner='11111111-1111-4111-8111-111111111111', outsider='22222222-2222-4222-8222-222222222222', coach='33333333-3333-4333-8333-333333333333';
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,email varchar(255),email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to authenticated,anon;
grant select,insert,update,delete on storage.objects to authenticated; grant select on storage.objects to anon;`);
for(const [id,email] of [[owner,'Tristan.mcmillin@yahoo.com'],[outsider,'other@example.test'],[coach,'coach@example.test']]) await db.query('insert into auth.users values($1,$2,now())',[id,email]);
for(const name of ['202610280001_teams.sql','202610280002_coaches_and_trials.sql','202610280003_team_logos.sql','202610280004_delete_teams.sql','202610280005_coaching.sql']) await db.exec(readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8'));
async function as(id,role='authenticated'){await db.exec(`reset role; set role ${role}; set request.jwt.claim.sub='${id}';`);}
const create=(name,id)=>db.query('select public.create_team($1,$2)',[name,id]);



await db.exec(readFileSync(new URL('../supabase/migrations/202611120001_tier_testing.sql',import.meta.url),'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/202611120004_three_team_plans.sql',import.meta.url),'utf8'));

await db.exec(readFileSync(new URL('../supabase/migrations/202611120005_import_recovery.sql',import.meta.url),'utf8'));
await db.exec(readFileSync(new URL('../supabase/migrations/202611120006_import_history_actor_type.sql',import.meta.url),'utf8'));
await as(owner);await create('Recovery',team);await db.query("select public.set_testing_tier($1,'elite')",[team]);
await db.exec('reset role');await db.query("insert into public.team_memberships values($1,$2,'coach',now())",[team,coach]);
await as(owner);
let revision=0;
let board={name:'Recovery',players:[{id:'p',name:'Player'}],games:[{id:'g',positions:{P:'p'},pitchers:{},stats:{},lineup:['p'],importLabel:''}],defensiveLineups:[],practicePlans:[]};
async function save(next){revision=(await db.query('select public.save_team_board($1,$2,$3) revision',[team,revision,JSON.stringify(next)])).rows[0].revision;board=next;}
const history=async()=> (await db.query('select * from public.list_team_import_history($1)',[team])).rows;
await save(board);assert.equal((await history()).length,0);
await save({...board,seasonImports:[{id:'s',season:'2026',label:'Season One.csv',stats:{p:{batting:{H:2}}}}]});
let rows=await history();assert.equal(rows.length,1);assert.equal(rows[0].actor,'You');await as(coach);assert.equal((await history())[0].actor,'Tristan.mcmillin@yahoo.com');await as(owner);assert.equal(rows[0].label,'Season One.csv');assert.equal(rows[0].summary,'Season 2026 totals updated');assert.equal(rows[0].player_count,1);
await save({...board,seasonImports:[{id:'s',season:'2026',label:'Season Two.csv',stats:{p:{batting:{H:9}}}}]});
rows=await history();const backup=rows[0];assert.equal(rows.length,2);assert.equal(backup.label,'Season Two.csv');
let next=structuredClone(board);next.games[0].lineup=[];next.games[0].pitchers={p:{innings:'2',pitches:24}};next.games[0].positions={P:'p',C:'p2'};next.players.push({id:'p2',name:'New Player'});await save(next);assert.equal((await history()).length,2);
await as(outsider);await assert.rejects(history());await assert.rejects(db.query('select public.restore_team_import($1,$2,$3)',[team,backup.id,revision]));
await as('', 'anon');await assert.rejects(history());
await as(coach);await assert.rejects(db.query('select previous_stats from public.team_import_history'));
await assert.rejects(db.query('select public.restore_team_import($1,$2,$3)',[team,backup.id,revision-1]),/changed/);
const restored=(await db.query('select public.restore_team_import($1,$2,$3) result',[team,backup.id,revision])).rows[0].result;
revision=restored.revision;board=restored.board;
assert.equal(board.seasonImports[0].stats.p.batting.H,2);assert.equal(board.games[0].pitchers.p.pitches,24);assert.equal(board.games[0].lineup.length,0);assert.equal(board.players.length,2);assert.equal(board.games[0].positions.C,'p2');assert.equal((await history()).length,3);
await as(owner);await db.query("select public.set_testing_tier($1,'pro')",[team]);await assert.rejects(db.query('select public.restore_team_import($1,$2,$3)',[team,backup.id,revision]),/Elite/);
await db.query("select public.set_testing_tier($1,'elite')",[team]);
next=structuredClone(board);next.games[0].stats={p:{batting:{H:3}}};next.games[0].statsSeason='2026';next.games[0].statsContribution='add';next.games[0].importLabel='Game.csv';next.games[0].importFingerprint='game';await save(next);
next=structuredClone(board);next.seasonImports[0].stats.p.batting.H=10;next.seasonImports[0].label='Replacement.csv';next.games[0].statsContribution='included';await save(next);
const coverageBackup=(await history())[0];const covered=(await db.query('select public.restore_team_import($1,$2,$3) result',[team,coverageBackup.id,revision])).rows[0].result;board=covered.board;revision=covered.revision;
assert.equal(board.games[0].statsContribution,'add');assert.equal(board.games[0].stats.p.batting.H,3);assert.equal(board.seasonImports[0].stats.p.batting.H,2);
next={...board,games:[]};await save(next);const deleted=(await db.query('select public.restore_team_import($1,$2,$3) result',[team,coverageBackup.id,revision])).rows[0].result;board=deleted.board;revision=deleted.revision;assert.equal(board.games.length,0,'deleted games are not recreated');
next={...board,players:[]};await save(next);const removed=(await db.query('select public.restore_team_import($1,$2,$3) result',[team,coverageBackup.id,revision])).rows[0].result;board=removed.board;revision=removed.revision;assert.deepEqual(board.seasonImports[0].stats,{},'removed players do not reappear in team totals');
await db.query("select public.set_testing_tier($1,'starter')",[team]);
await assert.rejects(db.query('select public.save_team_board($1,$2,$3)',[team,revision,JSON.stringify({...board,games:[{id:'review',stats:{},pitchers:{},positions:{},pitchingReviewedAt:'2026-11-12',pitchingReviewKey:'review'}]})]),/Pro/);
await db.query("select public.set_testing_tier($1,'elite')",[team]);
for(let i=0;i<32;i++){await save({...board,seasonImports:[{id:'s',season:'2026',label:'Season '+i,stats:{p:{batting:{H:i}}}}]});}
rows=await history();assert.equal(rows.length,30);assert.equal(rows.filter(r=>r.recoverable).length,5);await assert.rejects(db.query('select public.restore_team_import($1,$2,$3)',[team,backup.id,revision]),/no longer/);
console.log('PASS import audit capture, accurate filename/actor/count, no history for lineup edits, cross-team and anonymous isolation, Elite restore, revision conflicts, data-preserving restore and bounded retention.');
await db.close();

