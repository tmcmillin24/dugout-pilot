export type PreferenceState<T>={value:T;error:string;status:'loading'|'synced'|'saving'|'offline'};
export function createPreferenceSync<T>(initial:T,validate:(value:unknown)=>T|null,deps:{load:()=>Promise<unknown>;write:(value:T)=>Promise<void>;cache?:(value:T)=>void}){
 let state:PreferenceState<T>={value:initial,error:'',status:'loading'},version=0,reading=false,writing=false,pending:{value:T;version:number}|null=null;
 const listeners=new Set<()=>void>();
 function publish(next:PreferenceState<T>){if(JSON.stringify(state)===JSON.stringify(next))return;state=next;listeners.forEach(fn=>fn());}
 function failure(reason:unknown){const code=(reason as {code?:string})?.code;return code==='42P01'||code==='PGRST205'?'Account filter sync needs the account_preferences SQL setup.':'Could not sync this filter. Your selection is kept locally and will retry.';}
 async function flush(){if(writing||!pending)return;writing=true;try{while(pending){const item=pending;await deps.write(item.value);if(pending.version===item.version)pending=null;}publish({...state,error:'',status:'synced'});}catch(reason){publish({...state,error:failure(reason),status:'offline'});}finally{writing=false;}}
 async function refresh(){if(writing||reading)return;if(pending){await flush();return;}reading=true;const request=version;try{const remote=validate(await deps.load());if(request!==version)return;if(remote!==null){deps.cache?.(remote);publish({value:remote,error:'',status:'synced'});}else publish({...state,error:'',status:'synced'});}catch(reason){if(request===version)publish({...state,error:failure(reason),status:'offline'});}finally{reading=false;}}
 function save(value:T){version++;pending={value,version};deps.cache?.(value);publish({value,error:'',status:'saving'});void flush();}
 return {getSnapshot:()=>state,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};},refresh,save,hydrate:(value:unknown)=>{if(version||state.status!=='loading')return;const valid=validate(value);if(valid!==null)publish({...state,value:valid});}};
}
