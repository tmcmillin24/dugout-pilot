import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { createPreferenceSync } from '@/lib/account-preference-sync';
// One store per account/key: Home and Team Stats cannot race each other's defaults.
const stores=new Map<string,ReturnType<typeof createPreferenceSync<unknown>>>();
export function useAccountPreference<T>(key:string,initial:T,validate:(value:unknown)=>T|null){
 const {session}=useAuth(),userId=session?.user.id;
 const identity=`${userId}:${key}`;
 let entry=stores.get(identity);
 if(!entry){entry=createPreferenceSync<unknown>(initial,validate,{
  load:async()=>{if(!userId)throw new Error('Sign in to sync.');const {data,error}=await supabase.from('account_preferences').select('value').eq('user_id',userId).eq('preference_key',key).maybeSingle();if(error)throw error;return data?.value;},
  write:async value=>{if(!userId)throw new Error('Sign in to sync.');const {error}=await supabase.from('account_preferences').upsert({user_id:userId,preference_key:key,value},{onConflict:'user_id,preference_key'});if(error)throw error;},
  cache:value=>{void AsyncStorage.setItem(key,JSON.stringify(value)).catch(()=>{});},
 });stores.set(identity,entry);}
 const store=entry;
 const subscribe=useCallback((notify:()=>void)=>{
  const unsubscribe=store.subscribe(notify);
  void AsyncStorage.getItem(key).then(value=>{if(value)store.hydrate(JSON.parse(value));}).catch(()=>{}).finally(()=>{void store.refresh();});
  const foreground=AppState.addEventListener('change',state=>{if(state==='active')void store.refresh();});
  const timer=setInterval(()=>{if(AppState.currentState==='active')void store.refresh();},5000);
  const channel=supabase.channel(`view:${identity}:${Math.random().toString(36).slice(2)}`).on('postgres_changes',{event:'*',schema:'public',table:'account_preferences',filter:`user_id=eq.${userId}`},()=>{void store.refresh();}).subscribe();
  return()=>{unsubscribe();foreground.remove();clearInterval(timer);void supabase.removeChannel(channel);};
 },[store,key,identity,userId]);
 const state=useSyncExternalStore(subscribe,store.getSnapshot,store.getSnapshot);
 useFocusEffect(useCallback(()=>{void store.refresh();},[store]));
 return {value:state.value as T,error:state.error,status:state.status,save:(next:T)=>store.save(next)};
}
