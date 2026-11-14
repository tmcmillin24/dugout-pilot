import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { randomUUID } from 'node:crypto';
import { build } from '../src/lib/coaching/practice-engine.js';
function load(file) { const source = ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText; const exports={}; vm.runInNewContext(source,{exports,require:name=>name==='expo-crypto'?{randomUUID}:name.startsWith('.')?load(new URL(`${name}.ts`,new URL(file,import.meta.url))):createRequire(import.meta.url)(name)}); return exports; }
const {defaultBoard,assignPosition,applyDefensiveLineup,recordFieldInning,fieldInnings,dayFieldInnings,fieldPlayingTime,fieldPlayingTimeLabel,playersForPosition}=load('../src/lib/coaching/board.ts');
const b=defaultBoard('My Team'); assert.equal(b.name,'My Team'); assert.equal(b.defensiveLineups.length,10);
b.players=[{id:'a',name:'A',positions:['P','SS']},{id:'b',name:'B',positions:['C']}];
assert.equal(playersForPosition(b.players,'P')[0].id,'a'); assert.equal(playersForPosition(b.players,'P').length,1); assert.equal(playersForPosition(b.players,'RF').length,0); assert.equal(playersForPosition([{id:'c',name:'No positions'}],'P').length,0);
let g=b.games[0]; const preset={...b.defensiveLineups[0],positions:{P:'a',C:'b'}};
g=applyDefensiveLineup(g,preset,b.players); assert.equal(fieldInnings(g,'a'),0); // Selection must never count innings.
g=recordFieldInning(g,1); assert.equal(fieldInnings(g,'a'),1);
g=recordFieldInning(g,1); assert.equal(fieldInnings(g,'a'),1); // Retry/replacement does not double count.
g={...g,positions:assignPosition(g.positions,'P','b')}; assert.equal(g.positions.C,undefined);
g=recordFieldInning(g,2); assert.equal(fieldInnings(g,'a'),1); assert.equal(fieldInnings(g,'b'),2);
b.games=[g]; assert.equal(dayFieldInnings(b,g.day,'b'),2); assert.equal(preset.positions.P,'a');
// Multiple innings in one game count as one appearance; unconfirmed games do not count.
b.games=[g,{...g,id:'second',day:g.day+1,defenseInnings:{1:{SS:'a'}}},{...g,id:'scheduled',defenseInnings:{}}];
assert.equal(fieldPlayingTime(b,'a').games,2); assert.equal(fieldPlayingTime(b,'a').innings,2);
assert.equal(fieldPlayingTimeLabel(b,'b'),'1 game played · 2 innings played');
assert.equal(fieldPlayingTimeLabel(b,'missing'),'0 games played · 0 innings played');
b.games=[{...g,defenseInnings:{1:{P:'a',SS:'a'}}}];
assert.equal(fieldPlayingTimeLabel(b,'a'),'1 game played · 1 inning played');
b.games=[recordFieldInning({...g,positions:{P:'b'}},1)];
assert.equal(fieldPlayingTimeLabel(b,'a'),'0 games played · 0 innings played');
for(const environment of ['indoor','outdoor']) for(const focus of ['hitting','throwing','defense','running']) for(const minutes of [45,60,75,90,105,120]) for(const players of [1,2,10,18]) for(const coaches of [1,3,6]) for(const cages of [0,3]) for(const turf of ['full','half','none']) {
 const p=build({environment,focus,minutes,players,coaches,cages,turf,machine:true,field:'small',start:'17:00'});
 assert.equal(p.phases.reduce((n,p)=>n+p.duration,0),minutes); assert.equal(p.sizes.reduce((n,x)=>n+x,0),players); assert.ok(p.stations.length>0 && p.stations.length<=coaches); assert.ok(p.phases.every(x=>x.duration>0)); assert.equal(p.phases.at(-1).end,minutes);
}
const {findRule}=load('../src/lib/coaching/rules.ts'); assert.ok(findRule('What is the daily pitching limit?')); assert.equal(findRule('Who wins the world series?'),null); assert.equal(findRule('the weather'),null);
console.log('PASS: ten reusable defenses, no innings on selection, outing retry/replacement, no duplicate positions, saved defense isolation, practice duration/group/resource combinations, rule topic matching.');
