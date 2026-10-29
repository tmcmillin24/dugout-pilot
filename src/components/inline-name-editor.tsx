import { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, ui } from './app-ui';
import { c } from './coaching-ui';
/** Mount at the name being edited; existing content and scroll position stay put. */
export function InlineNameEditor({value,label,onSave,onCancel,minLength=1,maxLength=80}:{value:string;label:string;onSave:(value:string)=>Promise<boolean>;onCancel:()=>void;minLength?:number;maxLength?:number}) {
  const [name,setName]=useState(value);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
  async function save(){if(lock.current||name.trim().length<minLength)return;lock.current=true;setBusy(true);setError('');try{if(!await onSave(name.trim()))setError('Name was not saved. Your edit is still here; try again.');}catch{setError('Name was not saved. Your edit is still here; try again.');}finally{lock.current=false;setBusy(false);}}
  return <View style={c.group}><TextInput autoFocus selectTextOnFocus accessibilityLabel={label} value={name} onChangeText={setName} editable={!busy} maxLength={maxLength} returnKeyType="done" onSubmitEditing={()=>{void save();}} style={ui.input}/>{!!error&&<Text accessibilityRole="alert" style={c.danger}>{error}</Text>}<View style={c.row}><View style={c.grow}><Button disabled={busy||name.trim().length<minLength} onPress={()=>{void save();}}>{busy?'SAVING…':'SAVE'}</Button></View><View style={c.grow}><Button secondary disabled={busy} onPress={onCancel}>CANCEL</Button></View></View></View>;
}
