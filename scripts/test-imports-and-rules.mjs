import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(url) {
  const path=new URL(url,import.meta.url);if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
  const exports={}; const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,resolveJsonModule:true}}).outputText;
  vm.runInNewContext(source,{exports,require:name=>load(new URL(name.endsWith('.json')?name:`${name}.ts`,path))});return exports;
}
const {csvRows,parseStatsImport,compileStatsImport}=load('../src/lib/coaching/csv-import.ts');
const roster=[{id:'a',name:'John Doe',number:'12'},{id:'b',name:'Sam Smith',number:'9'},{id:'c',name:'Sam Smith',number:'8'}];
const rows=parseStatsImport('\uFEFFPlayer,Number,AB,H,OBP\r\n"Doe, John",12,3,2,.667\r\nSam Smith,9,3,1,.333\r\nOther,99,2,0,0\r\nTotals,,8,3,.375',roster);
assert.equal(rows.length,3);assert.equal(rows[0].playerId,'a');assert.equal(rows[1].playerId,'b');assert.equal(rows[2].playerId,'');
assert.equal(Object.keys(compileStatsImport(rows,roster)).length,2);assert.equal(compileStatsImport(rows,roster).a.h,2);
const ambiguous=parseStatsImport('Player,AB,H\nSam Smith,3,1',roster);assert.equal(ambiguous[0].ambiguous,true);assert.equal(ambiguous[0].playerId,'');
assert.throws(()=>compileStatsImport(ambiguous,roster));assert.throws(()=>compileStatsImport(rows,[]));
assert.throws(()=>compileStatsImport([{...rows[0],stats:{h:2}},{...rows[0],stats:{h:3}}],roster));
assert.equal(compileStatsImport([{...rows[0],stats:{h:2}},{...rows[0],stats:{ip:'2.1'}}],roster).a.ip,'2.1');
assert.throws(()=>csvRows('Player,AB\n"unfinished,3'));assert.throws(()=>parseStatsImport('x'.repeat(1000001),roster));assert.throws(()=>parseStatsImport('Date,Team\nToday,Test',roster));
const invalid=parseStatsImport('Player,AB,H,IP,Pitches\nJohn Doe,-1,2,2.3,1.5',roster);assert.equal(invalid[0].stats.h,2);assert.equal(invalid[0].stats.ab,undefined);assert.equal(invalid[0].stats.ip,undefined);assert.equal(invalid[0].stats.pitches,undefined);
const multisection=parseStatsImport('Player,AB,H\nJohn Doe,3,2\nPlayer,IP,Pitches\nJohn Doe,2.1,30',roster);assert.equal(compileStatsImport(multisection,roster).a.pitches,30);
const {getRulesContext,hasReferencePack,answerRulesQuestion,officialRulesLink}=load('../src/lib/coaching/rules-context.ts');
const eleven=getRulesContext({rulesProfile:'usssa-11u-2026'});assert.equal(eleven.organization,'usssa');assert.equal(hasReferencePack(eleven),true);
assert.equal(answerRulesQuestion('What is the daily pitching limit?',eleven).kind,'reference');
assert.equal(answerRulesQuestion('What is the daily pitching limit for 12U?',eleven).kind,'mismatch');
assert.equal(answerRulesQuestion('What is the softball pitching limit?',eleven).kind,'mismatch');
for(const context of [{...eleven,age:'12U'},{...eleven,sport:'fastpitch',age:'16U'},{...eleven,season:'2027'}]) {assert.equal(hasReferencePack(context),false);assert.equal(answerRulesQuestion('pitching limit',context).kind,'reference');assert.ok(officialRulesLink(context).includes('usssa'));}
assert.equal(answerRulesQuestion('What is the weather?',eleven).kind,'unavailable');
assert.equal(answerRulesQuestion('Can a pitcher throw tomorrow?',eleven).kind,'reference');
assert.equal(answerRulesQuestion('Are lead-offs allowed?',eleven).kind,'reference');
assert.equal(answerRulesQuestion('What are Little League pitching limits?',eleven).kind,'mismatch');
assert.equal(answerRulesQuestion('Compare 11U and 12U pitching limits',eleven).kind,'mismatch');
assert.equal(answerRulesQuestion('What bats are allowed?',eleven).kind,'reference');
assert.equal(answerRulesQuestion('Explain the infield fly rule.',eleven).kind,'reference');
assert.ok(answerRulesQuestion('Explain the infield fly rule.',eleven).sources.some(source=>source.url.includes('mlbstatic.com')));
assert.equal(answerRulesQuestion('Explain the infield fly rule.',{...eleven,sport:'fastpitch'}).kind,'unavailable');
assert.equal(answerRulesQuestion('What bats are allowed?',{...eleven,age:'',season:''}).kind,'clarification');
assert.equal(answerRulesQuestion('What bats are allowed? 12U 2027',{...eleven,age:'',season:''}).kind,'reference');
console.log('PASS: quoted/BOM CSV, totals excluded, names/jerseys, ambiguous matches, stale rosters, conflicting rows, partial sections, invalid values, size limits, USSSA-only context, legacy profile, sport/age/season isolation and source fallback.');
for(const season of ['2026','2027']){
 const profile={...eleven,season,age:'12U'};
 assert.match(answerRulesQuestion('daily pitching limit',profile).answer,/daily maximum 6/);
 assert.match(answerRulesQuestion('daily pitching limit',{...profile,age:'13U'}).answer,/daily maximum 7/);
 assert.match(answerRulesQuestion('What bats are legal?',{...profile,age:'14U'}).answer,/-3 BBCOR/);
 assert.match(answerRulesQuestion('What bats are legal?',{...profile,age:'13U'}).answer,/-8/);
 assert.doesNotMatch(answerRulesQuestion('What is the pitching distance?',profile).answer,/daily maximum/);
}
assert.match(answerRulesQuestion('Can a pitcher throw tomorrow?',eleven).answer,/preceding day/);
assert.match(answerRulesQuestion('What bats are legal?',{...eleven,sport:'fastpitch',age:'16U'}).answer,/1.20/);
assert.notEqual(answerRulesQuestion('What bats are legal?',{...eleven,sport:'slowpitch'}).kind,'reference');
console.log('PASS: age-specific limits, 13U/14U bats, workload clarification, distance-topic isolation and softball separation.');
