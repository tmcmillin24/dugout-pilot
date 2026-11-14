import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Date,require:name=>name==='expo-crypto'?{randomUUID:()=> 'fixture-game'}:load(path.resolve(path.dirname(file),name+'.ts'))});return exports;}
const model=load('src/lib/coaching/board.ts'),readiness=load('src/lib/coaching/game-readiness.ts'),printing=load('src/lib/coaching/lineup-export.ts');
let board=model.defaultBoard('Team');assert.equal(readiness.setupComplete(board),false);
board.players=Array.from({length:18},(_,i)=>({id:'p'+i,name:'First Player'+i,number:String(i+1),positions:i<3?['P']:['SS']}));
board.games[0]={...board.games[0],date:'2026-11-20',opponent:'Visitors',lineup:board.players.map(p=>p.id)};
assert.equal(readiness.setupComplete(board),true);assert.equal(readiness.nextGame(board,new Date('2026-11-12T12:00:00')).id,board.games[0].id);
let ready=readiness.gameReadiness(board,board.games[0]);assert.equal(ready.batters,18);assert.equal(ready.missing.length,9);assert.equal(ready.pitchingReviewed,false);
let game=board.games[0];game.pitchingReviewedAt='2026-11-12T12:00:00Z';game.pitchingReviewKey=readiness.pitchingReviewKey(board,game);assert.equal(readiness.gameReadiness(board,game).pitchingReviewed,true);
const before=readiness.pitchingReviewKey(board,game);game.positions=Object.fromEntries(Object.entries(game.positions).reverse());assert.equal(readiness.pitchingReviewKey(board,game),before);
game.pitchers.p0={innings:'1',pitches:15};assert.equal(readiness.gameReadiness(board,game).pitchingReviewed,false);
const invalid=readiness.gameReadiness(board,{...game,lineup:['p0','p0','removed']});assert.equal(invalid.invalid,true);assert.equal(invalid.batters,1);
game.opponent='<script>alert(1)</script>';const html=printing.lineupHTML(board,game,'Team & Coaches');assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('Team &amp; Coaches'));assert(html.includes('F Player17'));assert(html.includes('Unassigned'));assert(html.includes('BATTING ORDER'));assert(html.includes('DEFENSE'));
if(process.env.EXPORT_LINEUP_FIXTURE)writeFileSync('/tmp/dugout-lineup-fixture.html',html);
if(process.env.EXPORT_LONG_LINEUP){const long={...board,players:Array.from({length:40},(_,i)=>({id:'long'+i,name:'First Player'+i,number:String(i+1)}))};writeFileSync('/tmp/dugout-long-lineup.html',printing.lineupHTML(long,{...game,lineup:long.players.map(p=>p.id)},'Large team'));}
console.log('PASS setup completion, next scheduled game, variable roster readiness, invalid players, review invalidation and escaped complete printable lineup.');
