import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
// Only display preferences belong here. Authorization never uses user metadata.
export function useAccountPreference<T>(key:string,initial:T,validate:(value:unknown)=>T|null){
 const [value,setValue]=useState(initial),[error,setError]=useState('');
 const config=useRef({initial,validate}),actions=useRef<{save:(value:T)=>void}|null>(null);
 useEffect(()=>{
  let last=config.current.initial;
  let alive=true,version=0,busy=false,pending:{value:T;version:number}|null=null;
  const remoteKey=`dugout_view:${key}`;
  function paint(next:T){last=next;if(alive)setValue(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next);}
  async function flush(){if(busy||!pending)return;busy=true;const item=pending;try{const result=await supabase.auth.updateUser({data:{[remoteKey]:item.value}});if(result.error)throw result.error;if(pending?.version===item.version)pending=null;if(alive)setError('');}catch{if(alive)setError('Filter saved on this device. Account sync will retry when connected.');}finally{busy=false;}}
  async function sync(){if(busy)return;if(pending){await flush();return;}const request=version;try{const {data,error:failure}=await supabase.auth.getUser();if(failure)throw failure;const remote=config.current.validate(data.user?.user_metadata?.[remoteKey]);if(alive&&request===version&&remote!==null){paint(remote);void AsyncStorage.setItem(key,JSON.stringify(remote)).catch(()=>{});setError('');}else if(alive&&request===version&&data.user&&data.user.user_metadata?.[remoteKey]===undefined&&config.current.validate(last)!==null){pending={value:last,version};await flush();}}catch{/* Keep the last view while offline; team statistics remain server-backed. */}}
  actions.current={save(next){version++;paint(next);pending={value:next,version};void AsyncStorage.setItem(key,JSON.stringify(next)).catch(()=>{if(alive)setError('Could not cache this filter on the device.');});void flush();}};
  void AsyncStorage.getItem(key).then(v=>{if(!alive||version||!v)return;const local=config.current.validate(JSON.parse(v));if(local!==null)paint(local);}).catch(()=>{}).finally(()=>{if(alive)void sync();});
  const foreground=AppState.addEventListener('change',state=>{if(state==='active')void sync();});
  const timer=setInterval(()=>{if(AppState.currentState==='active')void sync();},10000);
  return()=>{alive=false;actions.current=null;clearInterval(timer);foreground.remove();};
 },[key]);
 return {value,error,save:(next:T)=>actions.current?.save(next)};
}
