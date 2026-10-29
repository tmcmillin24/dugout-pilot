import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function loader(mocks={}) {
  const cache=new Map();
  function load(url){
    const path=new URL(url,import.meta.url);if(cache.has(path.href))return cache.get(path.href);
    if(path.pathname.endsWith('.json'))return JSON.parse(readFileSync(path,'utf8'));
    const exports={};cache.set(path.href,exports);
    const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,resolveJsonModule:true}}).outputText;
    vm.runInNewContext(code,{exports,Date,Math,Set,Promise,AbortController,URL,require:name=>mocks[name]??load(new URL(name.endsWith('.json')?name:`${name}.ts`,path))});return exports;
  }
  return load;
}
const load=loader();const {explainRulesLocally,localReferences,selectedIds}=load('../src/lib/coaching/local-rules.ts');
const context={sport:'baseball',organization:'usssa',age:'11U',season:'2026'};
const options={question:'Explain infield fly.',context,history:[],eventNotes:'',signal:new AbortController().signal};
assert.ok(localReferences(context).length>20);assert.equal(localReferences({...context,sport:'fastpitch'}).length,0);
assert.equal(selectedIds(['fake-source'],localReferences(context)),null);
let calls=[];
let response=await explainRulesLocally({...options,generate:async(instructions,prompt)=>{calls.push({instructions,prompt});return calls.length===1?'```json\n{"sourceIds":["mlb-2026-infield-fly"]}\n```':'{"answer":"A short explanation of the saved infield-fly reference.","sourceIds":["mlb-2026-infield-fly"]}';}});
assert.equal(response.mode,'on-device');assert.equal(calls.length,2);assert.ok(response.sources.some(s=>s.url.includes('mlbstatic.com')));assert.ok(calls.every(call=>call.prompt.length<=7800));
let count=0;response=await explainRulesLocally({...options,question:'What bats are allowed?',context:{...context,age:'',season:''},generate:async()=>{count++;return'{}';}});assert.equal(response.kind,'clarification');assert.equal(count,0);
response=await explainRulesLocally({...options,context:{...context,sport:'fastpitch'},generate:async()=>{count++;return'{}';}});assert.equal(response.mode,'saved');assert.equal(count,0);
for(const output of ['not json','{"sourceIds":["made-up"]}','{"sourceIds":[]}']){response=await explainRulesLocally({...options,generate:async()=>output});assert.equal(response.mode,'saved');}
let phase=0;response=await explainRulesLocally({...options,generate:async()=>++phase===1?'{"sourceIds":["mlb-2026-infield-fly"]}':'{"answer":"Fake sourced claim","sourceIds":["invented"]}'});assert.equal(response.mode,'saved');
phase=0;response=await explainRulesLocally({...options,generate:async()=>++phase===1?'{"sourceIds":["mlb-2026-infield-fly"]}':'{"answer":"Read https://evil.test","sourceIds":["mlb-2026-infield-fly"]}'});assert.equal(response.mode,'saved');
const aborted=new AbortController();aborted.abort();await assert.rejects(explainRulesLocally({...options,signal:aborted.signal,generate:async()=>'{"sourceIds":[]}'}));
let maxPrompt=0;await explainRulesLocally({...options,question:'x'.repeat(800),history:[{question:'q'.repeat(800),answer:'a'.repeat(4000)},{question:'q'.repeat(800),answer:'a'.repeat(4000)}],generate:async(_i,prompt)=>{maxPrompt=Math.max(maxPrompt,prompt.length);return'{"sourceIds":[]}';}});assert.ok(maxPrompt<=7800);
const ios=loader({'react-native':{Platform:{OS:'ios'}},expo:{requireOptionalNativeModule:()=>null}})('../src/lib/on-device-ai.ts');assert.equal((await ios.getLocalAIAvailability()).status,'native-build-required');
const android=loader({'react-native':{Platform:{OS:'android'}},expo:{requireOptionalNativeModule:()=>{throw Error('Must not load iOS model');}}})('../src/lib/on-device-ai.ts');assert.equal((await android.getLocalAIAvailability()).status,'platform-not-supported');
await assert.rejects(ios.runLocalModel('instructions','prompt',new AbortController().signal));
let generatedId,cancelledId,resolveNative;
const native={generate:async(id)=>{generatedId=id;return new Promise(resolve=>{resolveNative=resolve;});},cancel:async id=>{cancelledId=id;return true;}};
const cancel=new AbortController();const pending=ios.runLocalModel('instructions','prompt',cancel.signal,native);cancel.abort();await assert.rejects(pending);assert.equal(generatedId,cancelledId);resolveNative('late result');
const {moveBatter,dragTarget,sameBattingOrder}=load('../src/lib/coaching/batting-order.ts');
const order=['a','b','c','d'];assert.equal(moveBatter(order,'a',3).join(','),'b,c,d,a');assert.equal(moveBatter(order,'d',0).join(','),'d,a,b,c');assert.equal(order.join(','),'a,b,c,d');assert.equal(moveBatter(order,'unknown',1).join(','),order.join(','));assert.equal(moveBatter(order,'a',999).join(','),'b,c,d,a');assert.equal(dragTarget(1,76,76,4),3);assert.equal(dragTarget(0,-999,0,4),0);assert.equal(sameBattingOrder(order,[...order]),true);
assert.equal(existsSync(new URL('../supabase/migrations/202610290006_rules_ai_budget.sql',import.meta.url)),false);
console.log('PASS: local source selection/explanation, edition and sport isolation, unknown-source/URL rejection, context bounds, Expo Go/Android fallback, native cancellation and late-result handling, drag ordering/scroll delta/bounds, cloud migration removal. Native model generation is mocked.');

const {formatPlayerName}=load('../src/lib/coaching/player-display.ts');
for(const [full,short] of [['Tristan McMillin','T McMillin'],['  Tristan  James McMillin  ','T McMillin'],['Ana de la Cruz','A de la Cruz'],['Sam Jones Jr.','S Jones Jr.'],['McMillin, Tristan','T McMillin'],['Prince','Prince'],['','Player']]) assert.equal(formatPlayerName(full),short);
const {removeGame,nextGameNumber}=load('../src/lib/coaching/game-management.ts');
const sample={players:[{id:'p'}],games:[{id:'a',label:'Game 1'},{id:'b',label:'Game 3'}],activeGameId:'a',practicePlans:[{id:'practice'}],defensiveLineups:[{id:'preset'}]};
assert.equal(removeGame(sample,'missing'),sample);const removed=removeGame(sample,'a');assert.equal(removed.activeGameId,'b');assert.equal(removed.players,sample.players);assert.equal(removed.practicePlans,sample.practicePlans);assert.equal(removed.defensiveLineups,sample.defensiveLineups);assert.equal(removeGame(removed,'b').activeGameId,'');assert.equal(nextGameNumber(sample.games),4);
console.log('PASS: uniform player display names and game deletion preserve roster, practice and presets.');

const {answerRulesQuestion}=load('../src/lib/coaching/rules-context.ts');
const reported="what happens if. batter hits the ball to the outfield and it hops over the fence after hitting the ground?";
for(const question of [reported,'A fair ball bounces over the wall. What happens to the runners?','ground rule double','Ball rolls under the outfield fence']) { const answer=answerRulesQuestion(question,context);assert.equal(answer.kind,'reference');assert.match(answer.answer,/automatic double/);assert.doesNotMatch(answer.answer,/230|275|pitching distance/); }
for(const question of ['The ball cleared the fence without touching the ground','An outfielder throws the ball over the fence','The ball hit the top of the wall and went over','The ball did not bounce before going over the fence']) assert.equal(answerRulesQuestion(question,context).kind,'clarification');
assert.match(answerRulesQuestion('What are the field dimensions?',context).answer,/70-foot/);
assert.equal(answerRulesQuestion('Someone leaned on the fence',context).kind,'unavailable');
assert.notEqual(answerRulesQuestion(reported,{...context,sport:'fastpitch'}).kind,'reference');
let boundaryCalls=0;const boundaryAnswer=await explainRulesLocally({...options,question:reported,generate:async()=>{boundaryCalls++;return '{}';}});assert.match(boundaryAnswer.answer,/automatic double/);assert.equal(boundaryCalls,0);
let wrongSelection=0;const dimensionsId=localReferences(context).find(ref=>ref.text.includes('230 feet')).id;
const wrong=await explainRulesLocally({...options,question:'An outfielder loses the ball in the sun. Is the batter out?',generate:async()=>{wrongSelection++;return JSON.stringify({sourceIds:[dimensionsId]});}});assert.equal(wrong.mode,'saved');assert.doesNotMatch(wrong.answer,/230|275/);assert.equal(wrongSelection,1);
const {dateKey,parseCalendarDate,monthCells}=load('../src/lib/coaching/calendar.ts');
assert.equal(parseCalendarDate('2026-02-29'),null);assert.equal(dateKey(parseCalendarDate('2028-02-29')),'2028-02-29');assert.equal(monthCells(2026,9).filter(Boolean).length,31);assert.equal(monthCells(2026,9)[4],'2026-10-01');assert.equal(monthCells(2027,0).filter(Boolean)[0],'2027-01-01');
console.log('PASS: reported boundary play, paraphrases, runner award, flight/throw ambiguity, dimension isolation, softball exclusion, rejected irrelevant model source and calendar leap/month boundaries.');
