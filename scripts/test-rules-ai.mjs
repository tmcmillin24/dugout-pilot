import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const library=JSON.parse(readFileSync(new URL('../supabase/functions/rules-assistant/references.json',import.meta.url),'utf8'));
const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../supabase/functions/rules-assistant/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,AbortSignal,Date,JSON,require:()=>library});
const {createRulesHandler,referencesFor,extractAnswer}=exports;
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user='11111111-1111-4111-8111-111111111111';
const context={sport:'baseball',age:'11U',season:'2026',organization:'usssa'};
const provider=(answer={kind:'reference',answer:'A fair ball bouncing over the fence is an automatic double.',sourceIds:['mlb-2026-boundary-double']},finishReason='STOP')=>({candidates:[{finishReason,content:{parts:[{text:JSON.stringify(answer)}]}}]});
function harness(options={}){
 const calls=[];const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'admin-secret',GEMINI_API_KEY:'gemini-secret',OPENAI_API_KEY:'must-not-use'};
 const fetch=async(url,init={})=>{calls.push({url,init});const ok=value=>new Response(JSON.stringify(value),{status:200});
 if(url.endsWith('/auth/v1/user'))return options.authFailure?new Response('{}',{status:401}):ok({id:user});
 if(url.includes('/team_memberships?'))return ok(options.member===false?[]:[{role:'coach'}]);
 if(url.includes('/teams?'))return ok([{activation_status:options.expired?'trial':'active',trial_ends_at:'2000-01-01',test_access:false}]);
 if(url.includes('/team_boards?'))return ok([{board:{rulesContext:{...context,sport:options.sport??'baseball',age:options.age??'11U',season:options.season??'2026'},eventRules:'Coach note',players:[{name:'SECRET ROSTER'}]}}]);
 if(url.includes('/consume_rules_ai_budget'))return options.limited?new Response(JSON.stringify({code:'P0001',message:'Ask AI usage limit reached'}),{status:400}):ok(null);
 if(url==='https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent') {if(options.quota)return new Response('{}',{status:429});if(options.failure)throw Error('private provider failure');return ok(options.result??provider());}
 throw Error('Unexpected request '+url);
 };
 return {calls,handler:createRulesHandler({fetch,env:name=>options.noKey&&name==='GEMINI_API_KEY'?undefined:env[name]})};
}
const req=(body={teamId:team,question:'What happens if a fair ball hops over the fence after hitting the ground?',history:[{role:'user',content:'Earlier question'},{role:'assistant',content:'Earlier answer'}]},auth='Bearer user-token')=>new Request('https://local.test',{method:'POST',headers:{Authorization:auth},body:JSON.stringify(body)});
let h=harness();let response=await h.handler(req());let data=await response.json();assert.equal(response.status,200);assert.equal(data.kind,'reference');assert.equal(data.mlbFallback,true);assert.ok(data.citations[0].url.includes('mlbstatic.com'));assert.equal(data.answer.slice(data.citations[0].start,data.citations[0].end),'[1]');
const calls=h.calls.filter(call=>call.url.includes('generativelanguage'));assert.equal(calls.length,1);const body=JSON.parse(calls[0].init.body);assert.equal(body.tools,undefined);assert.equal(calls[0].init.headers['x-goog-api-key'],'gemini-secret');assert.ok(!calls[0].init.body.includes('SECRET ROSTER'));assert.ok(!calls[0].init.body.includes('admin-secret'));assert.ok(!calls[0].init.body.includes('must-not-use'));assert.ok(calls[0].init.body.includes('Earlier answer'));assert.ok(calls[0].init.body.includes('Coach note'));assert.equal(body.generationConfig.responseMimeType,'application/json');assert.ok(h.calls.findIndex(c=>c.url.includes('consume_rules'))<h.calls.findIndex(c=>c.url.includes('generativelanguage')));
for(const [options,status] of [[{authFailure:true},401],[{member:false},403],[{expired:true},403],[{noKey:true},503],[{limited:true},429]]){h=harness(options);assert.equal((await h.handler(req())).status,status);assert.equal(h.calls.filter(c=>c.url.includes('generativelanguage')).length,0);}
h=harness({quota:true});assert.equal((await h.handler(req())).status,429);assert.equal(h.calls.filter(c=>c.url.includes('generativelanguage')).length,1);
h=harness({failure:true});response=await h.handler(req());assert.equal(response.status,502);assert.ok(!(await response.text()).includes('private provider failure'));
h=harness({sport:'slowpitch'});data=await(await h.handler(req())).json();assert.equal(data.kind,'unverified');assert.equal(h.calls.filter(c=>c.url.includes('generativelanguage')).length,0);
assert.equal(referencesFor({...context,age:'12U',season:'2027'}).some(r=>r.id.startsWith('usssa-2026-11u-')),false);
assert.ok(referencesFor({...context,age:'',season:''}).length>0);
const refs=referencesFor(context);
for(const answer of [{kind:'reference',answer:'Fake',sourceIds:['unknown']},{kind:'reference',answer:'Fake',sourceIds:[]},{kind:'reference',answer:'Go https://evil.test',sourceIds:['mlb-2026-boundary-double']}])assert.throws(()=>extractAnswer(provider(answer),refs));
assert.throws(()=>extractAnswer(provider(undefined,'MAX_TOKENS'),refs));assert.equal(extractAnswer(provider({kind:'clarification',answer:'Did it bounce?',sourceIds:[]}),refs).kind,'clarification');
h=harness();assert.equal((await h.handler(req({teamId:'invalid',question:'Hi'}))).status,400);assert.equal((await h.handler(req(undefined,''))).status,401);
console.log('PASS: Gemini 3.5 Flash Lite only; exactly one attempt/no search or paid fallback; auth/membership/access/budgets, quota, history and server context, roster/key exclusion, owned citations, edition/sport isolation, structured output/finish validation and errors. Provider mocked; live accuracy untested.');

for(const [question,id] of [['What is obstruction considered?','mlb-2026-obstruction'],['What is interference?','mlb-2026-interference']]){
 const reference=refs.find(ref=>ref.id===id);assert.ok(reference?.text.length>200);
 h=harness({result:provider({kind:'reference',answer:'General MLB baseball fallback: '+reference.text,sourceIds:[id]})});
 data=await(await h.handler(req({teamId:team,question}))).json();assert.equal(data.kind,'reference');assert.equal(data.mlbFallback,true);assert.ok(data.citations.length);
 const request=JSON.parse(h.calls.find(call=>call.url.includes('generativelanguage')).init.body);
 const supplied=JSON.parse(request.contents[0].parts[0].text).references;assert.ok(supplied.find(ref=>ref.id===id));
 assert.match(request.systemInstruction.parts[0].text,/general definition question/);
}
assert.equal(referencesFor({...context,sport:'fastpitch'}).some(ref=>ref.id.includes('obstruction')),false);
console.log('PASS: obstruction/interference references reach Gemini with definition guidance and valid citations; MLB fallback excluded from softball.');

for(const season of ['2026','2027'])for(let age=4;age<=18;age++){const scoped=referencesFor({...context,season,age:`${age}U`});for(const topic of ['bats','pitching'])assert.ok(scoped.some(ref=>ref.id===`usssa-baseball-${season}-${age}U-${topic}`));assert.ok(!scoped.some(ref=>ref.id.startsWith('usssa-baseball-')&&!ref.id.includes(`-${season}-${age}U-`)));}
assert.ok(referencesFor({...context,sport:'fastpitch',age:'16U'}).some(ref=>ref.id==='usssa-fastpitch-2026-16U-bats'));
assert.ok(!referencesFor({...context,sport:'fastpitch'}).some(ref=>ref.id.startsWith('mlb-')));
console.log('PASS: age-specific bat/pitching coverage for every baseball division 4U–18U in 2026/2027; fastpitch references remain separate.');
