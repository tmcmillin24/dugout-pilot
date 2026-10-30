import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(url) {
  const path=new URL(url,import.meta.url);if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
  const exports={}; const source=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,resolveJsonModule:true}}).outputText;
  vm.runInNewContext(source,{exports,require:name=>load(new URL(name.endsWith('.json')?name:`${name}.ts`,path))});return exports;
}
// CSV and roster workflows are covered by test-stats-workflow.mjs.
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
console.log('PASS: USSSA-only context, legacy profile, sport/age/season isolation and source fallback.');
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
