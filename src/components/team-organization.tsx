import { useCallback, useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Loading, Panel, Section, StatusMessage, palette, ui } from './app-ui';
import { disconnectTeamOrganization, getTeamOrganization, linkTeamOrganization } from '@/lib/organizations';
import { teamError } from '@/lib/teams';

export function OrganizationCodeField({value,onChange,disabled=false}:{value:string;onChange:(value:string)=>void;disabled?:boolean}){
 return <View style={{gap:8}}><Text style={ui.label}>Organization code · Optional</Text><TextInput accessibilityLabel="Organization code, optional" autoCapitalize="characters" autoCorrect={false} maxLength={64} value={value} onChangeText={onChange} editable={!disabled} placeholder="Enter your director’s code" placeholderTextColor={palette.muted} style={ui.input}/></View>;
}
export function TeamOrganization({teamId}:{teamId:string}){
 const [org,setOrg]=useState<{id:string;name:string}|null>(null),[code,setCode]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{try{const result=await getTeamOrganization(teamId);setOrg(result[0]??null);setError('');}catch(e){setError(teamError(e));}finally{setLoading(false);}},[teamId]);
 // The request resolves before updating screen state.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{void load();},[load]);
 async function change(){if(busy)return;setBusy(true);setError('');try{if(org)await disconnectTeamOrganization(teamId);else await linkTeamOrganization(teamId,code);setCode('');await load();}catch(e){setError(teamError(e));}finally{setBusy(false);}}
 return <Section title="Organization"><Panel accent="navy"><View style={ui.inset}>{loading?<Loading/>:org?<><Text style={ui.heading}>{org.name}</Text><Text style={ui.body}>Connected organization</Text><Button secondary disabled={busy} onPress={()=>{void change();}}>{busy?'Disconnecting…':'Disconnect organization'}</Button></>:<><OrganizationCodeField value={code} onChange={setCode} disabled={busy}/><Button disabled={busy||!code.trim()} onPress={()=>{void change();}}>{busy?'Connecting…':'Connect organization'}</Button></>}<StatusMessage text={error} error/>{!!error&&<Button secondary disabled={busy} onPress={()=>{void load();}}>Retry</Button>}</View></Panel></Section>;
}
