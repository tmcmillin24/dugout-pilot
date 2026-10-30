import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(file,deps={}) {const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,require:name=>deps[name]});return exports;}
const calendar=load('src/lib/coaching/calendar.ts');
const exports=load('src/lib/coaching/team-stats.ts',{'./calendar':calendar});
const now=new Date(2026,9,30,12);

const {battingTotals,importedGames,nextTeamEvent}=exports;
assert.equal(battingTotals([{ab:2,h:1},{ab:8,h:1}]).avg,'.200');
assert.equal(battingTotals([{ab:0,h:0}]).avg,'—');
assert.equal(battingTotals([{avg:.500},{avg:.250}]).avg,'—');
assert.equal(battingTotals([{ab:2,h:1},{ab:3}]).h,null);
assert.equal(battingTotals([{ab:2,h:1},{ab:3}]).avg,'—');
assert.equal(battingTotals([{ab:2,h:1},{ip:'2.1'}]).avg,'.500');
const board={games:[{id:'blank',stats:{},importLabel:''},{id:'imported',stats:{p:{ab:2,h:1}},importLabel:'game.csv'},{id:'past',date:'2026-10-29',status:'planned'},{id:'final',date:'2026-10-30',status:'final'},{id:'next',date:'2026-11-01',time:'17:00',status:'planned',label:'Game 1',opponent:'Tigers'}],practicePlans:[]};
assert.equal(importedGames({...board,games:board.games.slice(0,2)}).length,1);
assert.equal(nextTeamEvent(board,now).id,'next');
assert.equal(nextTeamEvent({games:[],practicePlans:[]},now),null);
console.log('PASS: weighted AVG, missing/zero data, pitching-only records, import coverage and upcoming events.');

const legacy={games:[{id:'nov3',date:'11/3/2026',time:'17:00',status:'planned',label:'Game 1',opponent:'Thunder'}],practicePlans:[]};
assert.equal(nextTeamEvent(legacy,now).id,'nov3');
assert.equal(nextTeamEvent(legacy,now).date,'2026-11-03');
assert.equal(nextTeamEvent({...legacy,games:[{...legacy.games[0],date:'2026-11-03'}]},now).date,'2026-11-03');
assert.equal(nextTeamEvent({...legacy,games:[{...legacy.games[0],date:'2/30/2027'}]},now),null);
assert.equal(nextTeamEvent({...legacy,games:[{...legacy.games[0],date:'9/3/2026'}]},now),null);
assert.equal(calendar.parseCalendarDate('2/29/2027'),null);
assert.equal(calendar.dateKey(calendar.parseCalendarDate('2/29/2028')),'2028-02-29');
console.log('PASS: real calendar parser handles legacy November 3, canonical dates, leap days and invalid/past dates.');
