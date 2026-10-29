import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
let requests=0;
function load(path){if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,fetch(){requests++;throw Error('FAQs must never request the network');},require:name=>load(new URL(name.endsWith('.json')?name:`${name}.ts`,path))});return exports;}
const {quickFaq}=load(new URL('../src/lib/coaching/quick-faq.ts',import.meta.url));
const context={sport:'baseball',organization:'usssa',age:'11U',season:'2026'};
const faq=quickFaq(context);
assert.equal(faq.length,15);assert.equal(new Set(faq.map(q=>q.id)).size,faq.length);
assert.equal(faq.slice(0,4).map(q=>q.id).join(','),'bats,pitching,mercy,courtesy');
const answer=id=>faq.find(q=>q.id===id).answer.answer;
assert.match(answer('mercy'),/15.*3rd.*8.*4th/);assert.match(answer('courtesy'),/last batted out/);assert.match(answer('lineup'),/continuous lineup/);assert.match(answer('pitcher-return'),/cannot return/);assert.match(answer('cleats'),/non-metal/);
for(const profile of [{...context,sport:'fastpitch',age:'16U'},{...context,sport:'slowpitch'},{...context,age:'',season:''}]){const rows=quickFaq(profile);assert.ok(rows.every(q=>q.answer.kind==='reference'));assert.ok(!rows.some(q=>q.id==='mercy'),'Do not pass 11U-only answers off as another division');}
for(const age of ['9U','10U','12U','13U','14U'])assert.equal(quickFaq({...context,age}).length,15);
assert.match(quickFaq({...context,age:'13U'}).find(q=>q.id==='mercy').answer.answer,/12 in the 4th/);
assert.match(quickFaq({...context,age:'14U'}).find(q=>q.id==='cleats').answer.answer,/permitted/);
assert.equal(quickFaq({...context,age:'12U',season:'2027'}).length,2);
assert.equal(quickFaq({...context,sport:'slowpitch'}).length,0);assert.equal(requests,0);
console.log('PASS: 15 common FAQs, correct topic routing, profile isolation and zero network/AI requests.');
