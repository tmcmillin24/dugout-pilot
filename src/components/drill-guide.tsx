import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Sheet, c } from './coaching-ui';
import { palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { drillGuide } from '@/lib/coaching/drill-guide';
export type GuideSelection={id?:string;name:string;where?:string;notes?:string;category?:string;choices?:GuideSelection[];backTo?:GuideSelection[]};
export function DrillGuideSheet({selection,onClose,onSelect}:{selection:GuideSelection|null;onClose:()=>void;onSelect:(selection:GuideSelection)=>void}){
 const [query,setQuery]=useState('');
 function choose(next:GuideSelection){setQuery('');onSelect(next);}
 const choices=selection?.choices?.filter(choice=>`${choice.name} ${choice.category??''}`.toLowerCase().includes(query.trim().toLowerCase()));
 const guide=selection?drillGuide(selection.id,selection.name):null;
 return <Sheet title={guide?.name??selection?.name??'Coach guide'} open={!!selection} onClose={()=>{setQuery('');onClose();}}>{selection?.choices?<><TextInput accessibilityLabel="Search drill guides" placeholder="Search drills…" value={query} onChangeText={setQuery} style={ui.input}/>{choices?.map(choice=><Pressable key={choice.id??choice.name} accessibilityRole="button" onPress={()=>choose({...choice,backTo:selection.choices})} style={c.option}><Text style={ui.rowTitle}>{choice.name}</Text>{choice.category&&<Text style={c.small}>{choice.category}</Text>}<Text style={{color:palette.accent,fontSize:11,marginTop:6,fontWeight:'700'}}>OPEN COACH GUIDE →</Text></Pressable>)}{!choices?.length&&<Text style={ui.body}>No drills match that search.</Text>}</>:guide?<>
 {selection?.backTo&&<Pressable accessibilityRole="button" onPress={()=>choose({name:'Drill guides',choices:selection.backTo})} style={c.option}><Text style={ui.rowTitle}>← Back to drill guides</Text></Pressable>}<Text style={c.small}>COACH GUIDE · AVAILABLE OFFLINE</Text><Text style={ui.body}>{guide.purpose}</Text>
 <GuideSection title="Set it up"><Text style={ui.body}>{guide.setup}</Text>{!!selection?.where&&<Text style={ui.rowTitle}>Assigned area: {selection.where}</Text>}<Text style={c.small}>{guide.equipment.join(' · ')}</Text><Text style={ui.body}>{guide.roles}</Text></GuideSection>
 <GuideSection title="Run the drill">{guide.steps.map((step,i)=><View key={i} style={{flexDirection:'row',gap:10,alignItems:'flex-start'}}><Text style={[ui.rowTitle,{color:palette.accent,minWidth:18}]}>{i+1}.</Text><Text style={[ui.body,{flex:1}]}>{step}</Text></View>)}</GuideSection>
 <GuideSection title="Show this example"><Text style={ui.body}>{guide.example}</Text></GuideSection>
 <GuideSection title="What to coach"><Text style={ui.rowTitle}>{guide.cue}</Text><Text style={ui.body}>{guide.check}</Text></GuideSection>
 <GuideSection title="Rotate & finish"><Text style={ui.body}>{guide.finish}</Text></GuideSection>
 <GuideSection title="Keep it controlled"><Text style={ui.body}>{guide.safety}</Text></GuideSection>
 {!!selection?.notes&&<GuideSection title="Your session instructions"><Text style={ui.body}>{selection.notes}</Text></GuideSection>}
 </>:<><Text style={ui.body}>{selection?.notes||'This older or custom block does not identify a library drill. Edit a copy and select a library drill to attach a full coach guide.'}</Text>{!!selection?.where&&<Text style={c.small}>{selection.where}</Text>}<Text style={c.small}>A full library guide is not attached to this custom or older block.</Text></>}</Sheet>;
}
function GuideSection({title,children}:{title:string;children:React.ReactNode}){return <View style={{gap:10,borderTopWidth:1,borderTopColor:palette.line,paddingTop:14}}><DisplayText style={[c.headline,{fontSize:21}]}>{title.toUpperCase()}</DisplayText>{children}</View>;}
