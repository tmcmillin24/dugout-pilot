import { useCallback, useEffect, useRef, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { Text, TextInput, View } from 'react-native';
import { Button, Loading, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { createOrganization, listOrganizations, type Organization } from '@/lib/organizations';
import { teamError } from '@/lib/teams';

export default function OrganizationsScreen(){
 const [orgs,setOrgs]=useState<Organization[]>([]),[name,setName]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef<{name:string;id:string}|null>(null),lock=useRef(false);
 const refresh=useCallback(async()=>{try{setOrgs(await listOrganizations());setError('');}catch(e){setError(teamError(e));}finally{setLoading(false);}},[]);
 // The request resolves before updating screen state.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void refresh();},[refresh]);
 async function create(){if(lock.current)return;if(name.trim().length<2){setError('Enter an organization name with 2 to 80 characters.');return;}lock.current=true;setBusy(true);setError('');try{if(request.current?.name!==name.trim())request.current={name:name.trim(),id:randomUUID()};const id=await createOrganization(name,request.current.id);setName('');await refresh();router.push({pathname:'/director',params:{id}});}catch(e){setError(teamError(e));}finally{lock.current=false;setBusy(false);}}
 return <Screen title="Organizations" subtitle="Your director workspace" back onRefresh={refresh}>
  <Panel accent="orange"><View style={[ui.inset,{backgroundColor:palette.navy}]}><Text style={[ui.heading,{color:palette.white}]}>One organization. Every team.</Text><Text style={[ui.body,{color:'#BCD0DE'}]}>Organization ownership is free. Teams keep their existing plans.</Text></View></Panel>
  <StatusMessage text={error} error/>{loading?<Loading/>:<Section title="Your organizations">{orgs.length?orgs.map(o=><Panel key={o.id}><MenuRow icon="teams" title={o.name} description="Open director dashboard" last onPress={()=>router.push({pathname:'/director',params:{id:o.id}})}/></Panel>):<Text style={ui.body}>Create your organization below to generate its unique team code.</Text>}</Section>}
  <Section title="Create organization"><Panel><View style={ui.inset}><Text style={ui.label}>Organization name</Text><TextInput accessibilityLabel="Organization name" style={ui.input} placeholder="Your baseball or softball organization" placeholderTextColor={palette.muted} value={name} onChangeText={setName} maxLength={80} editable={!busy}/><Button disabled={busy||name.trim().length<2} onPress={()=>{void create();}}>{busy?'Creating…':'Create organization'}</Button></View></Panel></Section>
 </Screen>;
}
