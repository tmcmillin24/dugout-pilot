import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
const library=JSON.parse(readFileSync(new URL('../supabase/functions/rules-assistant/references.json',import.meta.url),'utf8'));
const exports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../supabase/functions/rules-assistant/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{exports,Request,Response,URL,AbortSignal,Date,JSON,TextEncoder,TextDecoder,crypto:webcrypto,require:()=>library});
const {createRulesHandler,referencesFor,rulebooksFor,extractAnswer}=exports;
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user='11111111-1111-4111-8111-111111111111';
const context={sport:'baseball',age:'11U',season:'2026',organization:'usssa'};
const now=new Date('2026-11-12T12:00:00Z');
const req=(question='How many balls and strikes do you get?',history=[])=>new Request('https://local.test',{method:'POST',headers:{Authorization:'Bearer user-token'},body:JSON.stringify({teamId:team,question,history})});
function harness(options={}) {
 const calls=[],cache=new Map(),versions=new Map();
 const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'admin-secret',GEMINI_API_KEY:'gemini-secret'};
 let digest='source-version-1';
 const ok=value=>new Response(JSON.stringify(value));
 const fetch=async(url,init={})=>{
  calls.push({url,init});
  if(url.endsWith('/auth/v1/user'))return options.authFailure?new Response('{}',{status:401}):ok({id:user});
  if(url.includes('/team_memberships?'))return ok(options.member===false?[]:[{role:'coach'}]);
  if(url.includes('/teams?'))return ok([{activation_status:options.expired?'trial':'active',trial_ends_at:'2000-01-01',test_access:false}]);
  if(url.includes('/team_boards?'))return ok([{board:{rulesContext:{...context,sport:options.sport??'baseball',age:options.age??'11U',season:options.season??'2026'},eventRules:'Coach note',players:[{name:'SECRET ROSTER'}]}}]);
  if(url.includes('/rules_source_versions?'))return options.noCache?new Response('{}',{status:404}):ok([{digest,checked_at:now.toISOString()}]);
  if(url.endsWith('/rules_source_versions')){versions.set(JSON.parse(init.body).url,JSON.parse(init.body));return ok(null);}
  if(url.includes('/rules_answer_cache?')) {
   if(init.method==='DELETE')return ok(null);
   const key=new URL(url).searchParams.get('cache_key').slice(3);
   return ok(cache.has(key)?[{answer:cache.get(key)}]:[]);
  }
  if(url.endsWith('/rules_answer_cache')){const value=JSON.parse(init.body);cache.set(value.cache_key,value.answer);return ok(null);}
  if(url.includes('/consume_rules_ai_budget'))return options.limited?new Response(JSON.stringify({code:'P0001',message:'Ask AI usage limit reached'}),{status:400}):ok(null);
  if(url.includes('generativelanguage')) {
   if(options.quota)return new Response('{}',{status:429});
   if(options.failure)return new Response('{}',{status:503});
   const body=JSON.parse(init.body),input=JSON.parse(body.contents[0].parts[0].text),books=input.rulebooks;
   const id=options.forged?'mlb-forged-source':books[0].id;
   return ok({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({kind:options.clarify?'clarification':'reference',answer:options.clarify?'Which format does your event use?':'Verified ruling from the full official rulebook.',sourceIds:options.clarify?[]:[id]})}]},urlContextMetadata:{urlMetadata:books.filter(b=>!options.usssaFailure||b.id.startsWith('mlb-')).map(b=>({retrievedUrl:b.sources[0].url,urlRetrievalStatus:options.unretrieved?'URL_RETRIEVAL_STATUS_ERROR':'URL_RETRIEVAL_STATUS_SUCCESS'}))}}]});
  }
  throw Error('Unexpected request '+url);
 };
 return {calls,cache,versions,changeSource:()=>{digest='source-version-2';},handler:createRulesHandler({fetch,env:name=>options.noKey&&name==='GEMINI_API_KEY'?undefined:env[name],now:()=>now})};
}
for(const sport of ['baseball','fastpitch','slowpitch']) {
 const h=harness({sport});const response=await h.handler(req());const data=await response.json();
 assert.equal(response.status,200);assert.equal(data.kind,'reference');assert.ok(data.citations.length);
 const providers=h.calls.filter(c=>c.url.includes('generativelanguage'));assert.equal(providers.length,1);
 const body=JSON.parse(providers[0].init.body),input=JSON.parse(body.contents[0].parts[0].text);
 assert.deepEqual(Object.keys(body.tools[0]),['url_context']);assert.equal(body.generationConfig.responseMimeType,'application/json');
 assert.ok(input.rulebooks.some(b=>b.id.includes(sport)));
 assert.equal(input.rulebooks.some(b=>b.id.startsWith('mlb-')),sport==='baseball');
 assert.ok(!providers[0].init.body.includes('SECRET ROSTER'));assert.ok(!providers[0].init.body.includes('admin-secret'));
 assert.equal(providers[0].init.headers['x-goog-api-key'],'gemini-secret');
 assert.ok(h.calls.findIndex(c=>c.url.includes('consume_rules'))<h.calls.findIndex(c=>c.url.includes('generativelanguage')));
 const label=data.citations[0];assert.equal(data.answer.slice(label.start,label.end),'[1]');
}
for(const [options,status,code] of [[{member:false},403,'membership_required'],[{expired:true},403,'trial_expired'],[{limited:true},429,'app_usage_limit'],[{quota:true},429,'quota_exhausted'],[{unretrieved:true},503,'lookup_unavailable'],[{usssaFailure:true},503,'lookup_unavailable'],[{failure:true},503,'lookup_unavailable']]) {
 const h=harness(options),response=await h.handler(req());assert.equal(response.status,status);assert.equal((await response.json()).code,code);assert.equal(h.cache.size,0);
}
for(const [options,status] of [[{authFailure:true},401],[{noKey:true},503],[{forged:true},502]]){const h=harness(options);assert.equal((await h.handler(req())).status,status);assert.equal(h.cache.size,0);}
const cached=harness();await cached.handler(req());let data=await(await cached.handler(req())).json();assert.equal(data.cacheHit,true);assert.equal(cached.calls.filter(c=>c.url.includes('generativelanguage')).length,1);
await cached.handler(req('Can the runner advance?'));assert.equal(cached.calls.filter(c=>c.url.includes('generativelanguage')).length,2);
await cached.handler(req('How many balls and strikes do you get?',[{role:'user',content:'A different play'}]));assert.equal(cached.calls.filter(c=>c.url.includes('generativelanguage')).length,3);
cached.changeSource();data=await(await cached.handler(req())).json();assert.equal(data.cacheHit,undefined);assert.equal(cached.calls.filter(c=>c.url.includes('generativelanguage')).length,4);
const noCache=harness({noCache:true});await noCache.handler(req());await noCache.handler(req());assert.equal(noCache.calls.filter(c=>c.url.includes('generativelanguage')).length,2);
const clarification=harness({clarify:true});assert.equal((await(await clarification.handler(req())).json()).kind,'clarification');assert.equal(clarification.cache.size,0);
assert.equal(rulebooksFor({...context,sport:'fastpitch',season:'2027'}).length,0);
for(const season of ['2026','2027'])for(let age=4;age<=18;age++)for(const topic of ['bats','pitching'])assert.ok(referencesFor({...context,season,age:`${age}U`}).some(ref=>ref.id===`usssa-baseball-${season}-${age}U-${topic}`));
assert.throws(()=>extractAnswer({candidates:[{finishReason:'MAX_TOKENS'}]},[]));
console.log('PASS full-rulebook URL retrieval, sport/edition isolation, one Gemini request, auth/access/budgets, citations, failure messages, source-version cache invalidation, conversation isolation, missing-cache fallback and no caching guesses. Gemini mocked; live retrieval and answer accuracy still require deployment testing.');

const refreshHarness=harness();
const denied=await refreshHarness.handler(new Request('https://local.test',{method:'POST',headers:{Authorization:'Bearer user-token'},body:JSON.stringify({action:'refresh_sources'})}));
assert.equal(denied.status,403);
assert.equal(refreshHarness.calls.length,0);
console.log('PASS ordinary account cannot trigger service-only source refresh');
