import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const jsx=(type,props)=>({type,props}),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
let server={board:{name:'Team',players:[],games:[],defensiveLineups:[],statsSeason:'2026'},revision:1};
function boardDevice(){const states=[],effects=[],timers=[],listeners=[];let event;const channel={on(_type,_filter,callback){event=callback;return this;},subscribe(){return this;}};const exports={};const source=readFileSync(new URL('../src/providers/coaching-provider.tsx',import.meta.url),'utf8').replace('function TeamCoaching(', 'export function TeamCoaching(');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,setInterval:fn=>{timers.push(fn);return 1;},clearInterval(){},require:name=>name==='react'?{createContext:()=>({Provider:'Provider'}),useCallback:fn=>fn,useState:initial=>[initial,value=>states.push(value)],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)}:name==='react/jsx-runtime'?{jsx,jsxs:jsx}:name==='react-native'?{AppState:{currentState:'active',addEventListener:(_name,fn)=>{listeners.push(fn);return{remove(){}};}}}:name.includes('/supabase')?{supabase:{from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:structuredClone(server)})})})}),rpc:async(_name,args)=>{if(args.p_revision!==server.revision)return{error:{code:'40001',message:'Concurrent update'}};server={board:args.p_board,revision:server.revision+1};return{data:server.revision};},channel:()=>channel,removeChannel:async()=>{}}}:name.includes('/teams')?{teamError:error=>error.message}:name.includes('/board')?{normalizeBoard:b=>b,defaultBoard:()=>({})}:{}},{filename:'coaching-provider.tsx'});
const tree=exports.TeamCoaching({teamId:'team',teamName:'Team',access:true,children:null}),cleanup=effects.map(fn=>fn());return {states,timers,listeners,event:()=>event(),commit:tree.props.value.commit,cleanup:()=>cleanup.forEach(fn=>fn?.())};}
const phone=boardDevice(),ipad=boardDevice();await tick();
assert.equal(await phone.commit(b=>({...b,statsSeason:'2027'})),true);ipad.event();await tick();assert.ok(ipad.states.some(s=>s?.statsSeason==='2027'),'realtime refreshes the other device');
server={board:{...server.board,statsSeason:'2028'},revision:server.revision+1};ipad.listeners[0]('active');await tick();assert.ok(ipad.states.some(s=>s?.statsSeason==='2028'),'foreground refreshes stale stats');
server={board:{...server.board,statsSeason:'2029'},revision:server.revision+1};phone.timers[0]();await tick();assert.ok(phone.states.some(s=>s?.statsSeason==='2029'),'polling works without Realtime publication');
server={board:{...server.board,statsSeason:'2030'},revision:server.revision+1};assert.equal(await phone.commit(b=>({...b,statsSeason:'BAD'})),false);await tick();assert.equal(server.board.statsSeason,'2030');assert.ok(phone.states.some(s=>s?.statsSeason==='2030'),'conflict refreshes latest without overwriting');phone.cleanup();ipad.cleanup();
const metadata={};
function preferenceDevice(){
 const effects=[],timers=[],values=[],exports={};
 const auth={getUser:async()=>({data:{user:{user_metadata:{...metadata}}}}),updateUser:async({data})=>{Object.assign(metadata,data);return {data:{user:{user_metadata:{...metadata}}}};}};
 const source=readFileSync(new URL('../src/hooks/use-account-preference.ts',import.meta.url),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{
 exports,setInterval:fn=>{timers.push(fn);return 1;},clearInterval(){},require:name=>{
 if(name==='react')return {useState:value=>[value,next=>values.push(typeof next==='function'?next(values.at(-1)):next)],useRef:value=>({current:value}),useEffect:fn=>effects.push(fn)};
 if(name==='react-native')return {AppState:{currentState:'active',addEventListener:()=>({remove(){}})}};
 if(name.includes('async-storage'))return {getItem:async()=>null,setItem:async()=>{}};
 return {supabase:{auth}};
 }});
 const hook=exports.useAccountPreference('same-user:team:metrics',['AVG'],v=>Array.isArray(v)?v:null);effects.forEach(fn=>fn());return {save:hook.save,timers,values};
}

const a=preferenceDevice(),b=preferenceDevice();await tick();a.save(['H','R']);await tick();b.timers[0]();await tick();assert.equal(b.values.filter(Array.isArray).at(-1).join(','),'H,R','stat preferences sync through account metadata');
assert.match(readFileSync(new URL('../src/app/account.tsx',import.meta.url),'utf8'),/signOut\(\{ scope: 'local' \}\)/);
console.log('PASS two-device realtime, foreground and polling refresh; revision conflicts preserve server changes; account stat preferences sync; signout remains local.');
