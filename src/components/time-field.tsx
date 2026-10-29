import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Choice, Sheet, c } from './coaching-ui';
import { Button, ui } from './app-ui';
import { timeLabel, timeParts, timeValue } from '@/lib/coaching/practice-time';
/** Web fallback: selection controls, never a typed time. Native uses platform wheels/clock. */
export function TimeField({label='Start time',value,onChange}:{label?:string;value:string;onChange:(value:string)=>void}){
 const [open,setOpen]=useState(false);const [pending,setPending]=useState(value);const {hour,minute}=timeParts(pending);
 return <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${timeLabel(value)}`} accessibilityState={{expanded:open}} onPress={()=>{setPending(value);setOpen(true);}} style={c.choice}><Text style={ui.label}>{label}</Text><Text style={c.choiceValue}>{timeLabel(value)} ▾</Text></Pressable><Sheet title={label} open={open} onClose={()=>setOpen(false)}><View style={c.row}><View style={c.grow}><Choice label="Hour" value={String(hour%12)} options={Array.from({length:12},(_,i)=>({value:String(i),label:String(i||12)}))} onChange={v=>setPending(timeValue(Number(v)+(hour>=12?12:0),minute))}/></View><View style={c.grow}><Choice label="Minute" value={String(minute)} options={Array.from({length:60},(_,i)=>({value:String(i),label:String(i).padStart(2,'0')}))} onChange={v=>setPending(timeValue(hour,Number(v)))}/></View></View><Choice label="Period" value={hour<12?'am':'pm'} options={[{value:'am',label:'AM'},{value:'pm',label:'PM'}]} onChange={v=>setPending(timeValue(hour%12+(v==='pm'?12:0),minute))}/><Button onPress={()=>{onChange(pending);setOpen(false);}}>DONE</Button></Sheet></>;
}
