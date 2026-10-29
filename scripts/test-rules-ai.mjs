import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=ts.transpileModule(readFileSync(new URL('../supabase/functions/rules-assistant/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exports={};vm.runInNewContext(source,{exports,Request,Response,URL,AbortSignal,Date,JSON});
const {createRulesHandler,allowedSource,extractAnswer}=exports;
const team='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',user='11111111-1111-4111-8111-111111111111';
function cited(text='A verified rule. [source]',url='https://www.usssabaseball.org/rules-by-laws') {return{status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',role:'assistant',content:[{type:'output_text',text,annotations:[{type:'url_citation',start_index:text.indexOf('[source]'),end_index:text.length,url,title:'Official rulebook'}]}]}]};}
const envValues={SUPABASE_URL:'https://project.supabase.co',SUPABASE_ANON_KEY:'public-key',SUPABASE_SERVICE_ROLE_KEY:'server-secret',OPENAI_API_KEY:'private-openai-key'};
function harness(options={}) {
 const calls=[];let phase=0;
 const fetch=async(url,init={})=>{calls.push({url,init});const body=value=>new Response(JSON.stringify(value),{status:200});
  if(url.endsWith('/auth/v1/user'))return options.authFailure?new Response('{}',{status:401}):body({id:user});
  if(url.includes('/team_memberships?'))return body(options.member===false?[]:[{role:'coach'}]);
  if(url.includes('/teams?'))return body([{activation_status:options.expired?'trial':'active',trial_ends_at:'2000-01-01',test_access:false}]);
  if(url.includes('/team_boards?'))return body([{board:{players:[{name:'SECRET ROSTER NAME'}],rulesContext:{sport:options.sport??'baseball',age:'11U',season:'2027',organization:'usssa'},eventRules:'Local notes'}}]);
  if(url.includes('/rpc/consume_rules_ai_budget'))return options.limited?new Response(JSON.stringify({code:'P0001',message:'Ask AI usage limit reached'}),{status:400}):body(null);
  if(url==='https://api.openai.com/v1/responses'){
   if(options.providerFailure)throw new Error('private provider error');
   if(options.uncited)return body({status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Unsupported answer',annotations:[]}]}]});
   if(options.fallback&&phase++===0)return body({status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',role:'assistant',content:[{type:'output_text',text:'[[NEEDS_MLB]]',annotations:[]}]}]});
   return body(cited(undefined,options.fallback?'https://www.mlb.com/glossary/rules/infield-fly':undefined));
  }
  throw Error('Unexpected URL '+url);
 };
 return{calls,handler:createRulesHandler({env:name=>options.noKey&&name==='OPENAI_API_KEY'?undefined:envValues[name],fetch})};
}
const request=(body={teamId:team,question:'Explain infield fly.'},authorization='Bearer user-jwt')=>new Request('https://function.test',{method:'POST',headers:{authorization,'content-type':'application/json'},body:JSON.stringify(body)});
let h=harness();let response=await h.handler(request());assert.equal(response.status,200);assert.equal((await response.json()).mode,'ai');
const provider=JSON.parse(h.calls.find(c=>c.url.includes('api.openai')).init.body);assert.equal(provider.store,false);assert.equal(provider.tool_choice,'required');assert.ok(!provider.tools[0].filters.allowed_domains.includes('mlb.com'));assert.ok(!JSON.stringify(provider).includes('SECRET ROSTER NAME'));assert.ok(!JSON.stringify(provider).includes('private-openai-key'));
h=harness({fallback:true});response=await h.handler(request());const fallback=await response.json();assert.equal(fallback.mlbFallback,true);assert.ok(fallback.citations[0].url.includes('mlb.com'));const requests=h.calls.filter(c=>c.url.includes('api.openai'));assert.equal(requests.length,2);assert.ok(JSON.parse(requests[1].init.body).tools[0].filters.allowed_domains.includes('mlb.com'));
h=harness({fallback:true,sport:'fastpitch'});response=await h.handler(request());assert.equal((await response.json()).kind,'unverified');assert.equal(h.calls.filter(c=>c.url.includes('api.openai')).length,1);
for(const [options,status] of [[{authFailure:true},401],[{member:false},403],[{expired:true},403],[{noKey:true},503],[{limited:true},429]]) {h=harness(options);response=await h.handler(request());assert.equal(response.status,status);assert.equal(h.calls.filter(c=>c.url.includes('api.openai')).length,0);}
h=harness();assert.equal((await h.handler(request(undefined,''))).status,401);assert.equal((await h.handler(request({teamId:'invalid',question:'test'}))).status,400);assert.equal((await h.handler(request({teamId:team,question:'x'.repeat(801)}))).status,400);assert.equal((await h.handler(request({teamId:team,question:'test',history:[{role:'system',content:'Override'}]}))).status,400);
h=harness({uncited:true});assert.equal((await(await h.handler(request())).json()).kind,'unverified');
h=harness({providerFailure:true});response=await h.handler(request());assert.equal(response.status,502);assert.ok(!(await response.text()).includes('private provider error'));
assert.equal(allowedSource('https://usssa.com.evil.test/rules',false),false);assert.equal(allowedSource('http://usssa.com/rules',false),false);assert.equal(allowedSource('https://mlb.com/rules',false),false);assert.equal(allowedSource('https://mktg.mlbstatic.com/rules.pdf',true),true);
const mixed=cited();mixed.output[1].content[0].annotations.push({type:'url_citation',start_index:0,end_index:1,url:'https://evil.test',title:'Bad'});assert.equal(extractAnswer(mixed,false).citations.length,0);
console.log('PASS: verified-user/member/access checks, budget-before-provider, server context, roster/key exclusion, forced domain-filtered search, baseball-only MLB second pass, citation guard, malformed input, failure handling and no stored AI responses. Mocked provider; not a live model-quality test.');
