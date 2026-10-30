import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Sheet, c } from './coaching-ui';
import { Button, palette, ui } from './app-ui';
import { timeLabel, timeParts, timeValue } from '@/lib/coaching/practice-time';
export function TimeField({label='Start time',value,onChange}:{label?:string;value:string;onChange:(value:string)=>void}){
 const [pickerWidth,setPickerWidth]=useState(0);
 const [open,setOpen]=useState(false);const [pending,setPending]=useState(()=>{const {hour,minute}=timeParts(value);return new Date(2000,0,1,hour,minute);});
 function show(){const {hour,minute}=timeParts(value);setPending(new Date(2000,0,1,hour,minute));setOpen(true);}
 const picker=<DateTimePicker value={pending} mode="time" display={Platform.OS==='ios'?'spinner':'default'} presentation="dialog" is24Hour={false} themeVariant="light" accentColor={palette.accent} style={Platform.OS==='ios'?{height:216,width:Math.min(340,pickerWidth||280)}:undefined} onValueChange={(_event,date)=>{setPending(date);if(Platform.OS==='android'){onChange(timeValue(date.getHours(),date.getMinutes()));setOpen(false);}}} onDismiss={()=>setOpen(false)}/>;
 return <><Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value?timeLabel(value):'Choose time'}`} accessibilityState={{expanded:open}} onPress={show} style={c.choice}><Text style={ui.label}>{label}</Text><Text style={c.choiceValue}>{value?timeLabel(value):'Choose time'} ▾</Text></Pressable>{Platform.OS==='ios'?<Sheet title={label} maxWidth={420} open={open} onClose={()=>setOpen(false)}>{open&&<View onLayout={event=>{const width=Math.floor(event.nativeEvent.layout.width);if(width>0)setPickerWidth(width);}} style={{width:'100%',minHeight:216,alignItems:'center',justifyContent:'center',backgroundColor:palette.panel,borderRadius:10,overflow:'hidden'}}>{pickerWidth>0&&picker}</View>}<Button onPress={()=>{onChange(timeValue(pending.getHours(),pending.getMinutes()));setOpen(false);}}>DONE</Button></Sheet>:open&&picker}</>;
}
