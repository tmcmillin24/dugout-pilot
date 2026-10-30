import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
let serial=0;const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date,require:name=>name==='expo-crypto'?{randomUUID:()=>`test-${++serial}`} : name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):{}},{filename:file});return exports;}
const csv=load('src/lib/coaching/csv-import.ts'),data=load('src/lib/coaching/stat-data.ts'),elite=load('src/lib/coaching/elite-stats.ts'),model=load('src/lib/coaching/board.ts');
const header=[['','','','Batting','','','','','','','','','','','Pitching','','','','','','','Fielding','','','','','','',''],['Number','Last','First','GP','PA','AB','H','BB','HBP','SF','SO','OBP','SLG','R','IP','GP','H','BB','SO','ERA','WHIP','TC','A','PO','E','FPCT','P','SS','RF']];
const rows=[['25','Smith','Colton',3,10,8,4,2,0,0,1,.6,.75,3,2.1,1,3,1,4,3,1.714,8,3,4,1,.875,1.0,2.1,0],['5','Jones','Ryan',3,10,8,2,2,0,0,3,.4,.25,1,1.2,1,2,2,1,4,2.4,7,2,5,0,1,1.2,0,2.0]];
const fixture=[...header,...rows,['Totals','',''],['Glossary','','']].map(r=>r.join(',')).join('\n');
const parsed=csv.parseDetailedImport(fixture,[]);assert.equal(parsed.rows.length,2);assert.equal(parsed.rows[0].stats.batting.H,4);assert.equal(parsed.rows[0].stats.pitching.H,3);assert.equal(parsed.rows[0].stats.pitching.BB,1);assert.equal(parsed.rows[0].stats.batting.BB,2);assert(parsed.rows[0].positions.includes('SS'));assert.equal(parsed.rows[0].playerId,csv.NEW_PLAYER);
const seed={...model.defaultBoard('Test'),practicePlans:[]};
const request={mode:'season',season:'2026',label:'season.csv',fingerprint:'first',importedAt:'2026-10-30T12:00:00Z',rows:parsed.rows,columns:parsed.columns,mergePositions:false};
const imported=csv.applyStatsImport(seed,request,()=>`created-${++serial}`);assert.equal(imported.players.length,2);assert.equal(imported.players[0].number,'25');assert.equal(imported.seasonImports.length,1);assert.equal(Object.keys(imported.games[0].stats).length,0);assert.equal(seed.players.length,0);
assert.throws(()=>csv.applyStatsImport(imported,request,()=>`created-${++serial}`),/already imported/);
const matched=csv.parseDetailedImport(fixture,imported.players);assert.equal(matched.rows[0].playerId,imported.players[0].id);
const reimported=csv.applyStatsImport(imported,{...request,rows:matched.rows,fingerprint:'second'},()=>`created-${++serial}`);assert.equal(reimported.players.length,2);assert.equal(reimported.seasonImports.length,1);
const changed=[...imported.players.map(p=>({...p,positions:['C']}))];const preserved=csv.applyStatsImport({...imported,players:changed},{...request,rows:matched.rows,fingerprint:'third'},()=>`created-${++serial}`);assert.equal(preserved.players[0].positions.join(','),'C');
assert.equal(csv.matchPlayer('C Smith','25',imported.players).playerId,imported.players[0].id);assert.equal(csv.matchPlayer('C Smith','',imported.players).playerId,csv.REVIEW_PLAYER);assert.equal(csv.matchPlayer('Stranger Person','25',imported.players).playerId,csv.NEW_PLAYER);
assert.throws(()=>csv.applyStatsImport(seed,{...request,mode:'game',gameId:seed.games[0].id},()=>`created-${++serial}`),/multiple games/);
const gameRows=matched.rows.map(r=>({...r,stats:{...r.stats,batting:{...r.stats.batting,GP:1},pitching:{...r.stats.pitching,GP:1}}}));
const gameImported=csv.applyStatsImport(imported,{...request,rows:gameRows,mode:'game',gameId:imported.games[0].id,fingerprint:'game'},()=>`created-${++serial}`);assert.equal(data.statsSource(gameImported).stats[imported.players[0].id].batting.H,4,'season snapshot must not double-count a game');
const ag=data.aggregateStats([{batting:{AB:2,H:1},pitching:{IP:1.2}},{batting:{AB:8,H:1},pitching:{IP:2.2}}]);assert.equal(ag.batting.AVG,.2);assert.equal(ag.pitching.IP,4.1);assert.equal(ag.pitching.ERA,undefined);assert.equal(data.inningsOuts(1.3),null);
const ids=imported.players.map(p=>p.id);const suggested=elite.suggestBattingOrder(imported,ids);assert.equal(new Set(suggested.map(p=>p.id)).size,ids.length);assert.equal(elite.suggestBattingOrder(imported,ids,{[ids[1]]:0})[0].id,ids[1]);assert.throws(()=>elite.suggestBattingOrder(imported,ids,{[ids[0]]:0,[ids[1]]:0}),/conflict/);
const game={...imported.games[0],date:'2026-11-03'};const prior={...game,id:'prior',date:'2026-11-02',pitchers:{[ids[0]]:{innings:'3.1',pitches:50}}};const rules={...imported,rulesContext:{sport:'baseball',age:'11U',season:'2026',organization:'usssa'},games:[prior,game]};assert.match(elite.pitchingRestriction(rules,game,ids[0]),/^Rest required/);assert.match(elite.pitchingRestriction({...rules,rulesContext:{...rules.rulesContext,sport:'fastpitch'}},game,ids[0]),/Coach must verify/);
assert.equal(elite.hasEliteAccess(null),false);assert.equal(elite.hasEliteAccess({access_status:'expired',test_access:false}),false);
const real=process.env.DUGOUT_TEST_CSV;
if(real&&existsSync(real)){const result=csv.parseDetailedImport(readFileSync(real,'utf8'),[]);assert.equal(result.rows.length,12);assert.equal(result.columns.length,178);assert.equal(result.rows[0].stats.batting.H,2);assert.equal(result.rows[0].stats.pitching.H,0);assert(result.rows[0].positions.includes('2B'));assert(result.rows[0].positions.includes('RF'));console.log(`PASS actual supplied CSV: ${result.rows.length} players, ${result.columns.length} statistics; sections and positions verified.`);}
console.log('PASS fresh roster, names/jerseys, matching ambiguity, replacements, duplicate protection, no double counting, innings math, locked lineup slots, rest flags and access.');
for(const count of [1,10,12,16,18,24]){
 const records=Array.from({length:count},(_,i)=>{const row=[...rows[0]];row[0]=String(i+1);row[1]=`Member${i+1}`;row[2]=`Player${i+1}`;return row;});
 const text=[...header,...records].map(r=>r.join(',')).join('\n');const parsedTeam=csv.parseDetailedImport(text,[]);
 const team=csv.applyStatsImport(seed,{...request,rows:parsedTeam.rows,columns:parsedTeam.columns,fingerprint:`roster-${count}`},()=>`size-${++serial}`);
 assert.equal(team.players.length,count);const all=team.players.map(p=>p.id);const order=elite.suggestBattingOrder(team,all,{[all[count-1]]:count-1});
 assert.equal(order.length,count);assert.equal(new Set(order.map(r=>r.id)).size,count);assert.equal(order[count-1].id,all[count-1]);
 const attending=all.slice(0,Math.min(10,count));const partial=elite.suggestBattingOrder(team,attending);assert.equal(partial.length,attending.length);assert(partial.every(r=>attending.includes(r.id)));
}
console.log('PASS variable rosters: 1, 10, 12, 16, 18 and 24 players, unique orders, last-slot locks and attendance subsets.');
const serialized=JSON.parse(JSON.stringify(imported));assert.equal(serialized.seasonImports[0].stats[serialized.players[0].id].pitching.H,3);assert.equal(serialized.seasonImports[0].stats[serialized.players[0].id].batting.H,4);
assert.equal(csv.parseDetailedImport('Player,Number,AB,H,OBP\n"Smith, Colton",25,2,1,.5',imported.players).rows[0].playerId,imported.players[0].id);
assert.throws(()=>csv.parseDetailedImport('Player,AB,H,OBP\nTest Player,2,1,2.5',[]),/Out-of-range/);
const secondGame={...gameImported.games[0],id:'another',importFingerprint:undefined,importLabel:'',stats:{}};
assert.throws(()=>csv.applyStatsImport({...gameImported,games:[...gameImported.games,secondGame]},{...request,mode:'game',rows:gameRows,gameId:'another',fingerprint:'game'},()=>`duplicate-${++serial}`),/another game/);
assert.throws(()=>csv.applyStatsImport(imported,{...request,fingerprint:'duplicate-row',rows:[matched.rows[0],matched.rows[0]]},()=>`duplicate-${++serial}`),/Two rows/);
assert.equal(elite.rankPitchers({...imported,players:imported.players.map(p=>({...p,positions:['C']}))},game,ids).length,0);
console.log('PASS JSON persistence, reversed names, invalid rates, cross-game duplicates, duplicate matches and pitcher-position filtering.');
