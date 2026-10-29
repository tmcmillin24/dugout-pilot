import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Sheet, c } from './coaching-ui';
import { Button, palette, ui } from './app-ui';
import { timeLabel, timeParts, timeValue } from '@/lib/coaching/practice-time';
export function TimeField({label='Start time',value,onChange}:{label?:string;value:string;onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false);const [pending,setPending]=useState(()=>{const {hour,minute}=timeParts(value);return new Date(2000,0,1,hour,minute);});
 function show(){const {hour,minute}=timeParts(value);setPending(new Date(2000,0,1,hour,minute));setOpen(true);}
 const picker=<DateTimePicker value={pending} mode="time" display={Platform.OS==='ios'?'spinner':'default'} presentation="dialog" is24Hour={false} themeVariant="light" accentColor={palette.accent} style={Platform.OS==='ios'?{height:216,width:'100%'}:undefined} onValueChange={(_event,date)=>{setPending(date);if(Platform.OS==='android'){onChange(timeValue(date.getHours(),date.getMinutes()));setOpen(false);}}} onDismiss={()=>setOpen(false)}/>;
 return <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${timeLabel(value)}`} accessibilityState={{expanded:open}} onPress={show} style={c.choice}><Text style={ui.label}>{label}</Text><Text style={c.choiceValue}>{timeLabel(value)} ▾</Text></Pressable>{Platform.OS==='ios'?<Sheet title={label} open={open} onClose={()=>setOpen(false)}>{open&&<View style={{backgroundColor:palette.panel,borderRadius:10,overflow:'hidden'}}>{picker}</View>}<Button onPress={()=>{onChange(timeValue(pending.getHours(),pending.getMinutes()));setOpen(false);}}>DONE</Button></Sheet>:open&&picker}</>;
}
