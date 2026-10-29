import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useRulesAssistant } from '@/providers/rules-assistant-provider';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { answerRulesQuestion, contextLabel, getRulesContext, type RulesAnswer } from '@/lib/coaching/rules-context';
import { getLocalAIAvailability, runLocalModel, type LocalAIStatus } from '@/lib/on-device-ai';
import { explainRulesLocally, type LocalAnswer } from '@/lib/coaching/local-rules';
export function RulesChat() {
  const assistant=useRulesAssistant();const {board}=useCoaching();const {active}=useTeams();
  if(!assistant)return null;
  return <RulesConversation key={`${active?.id??'none'}:${JSON.stringify(getRulesContext(board??{}))}`} board={board} assistant={assistant}/>;
}
type Answer=RulesAnswer|LocalAnswer;
type Entry={question:string;response?:Answer;error?:string;mode:'saved'|'ai'};
type Assistant=NonNullable<ReturnType<typeof useRulesAssistant>>;
function RulesConversation({board,assistant}:{board:ReturnType<typeof useCoaching>['board'];assistant:Assistant}) {
  const context=getRulesContext(board??{});const insets=useSafeAreaInsets();
  const [mode,setMode]=useState<'saved'|'ai'>('ai');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [messages,setMessages]=useState<Entry[]>([]);
  const [availability,setAvailability]=useState<LocalAIStatus>({status:'checking',message:'Checking on-device AI…'});
  const scroll=useRef<ComponentRef<typeof ScrollView>>(null);const controller=useRef<AbortController|null>(null);const alive=useRef(true);const locked=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
  useEffect(()=>{
    if(!assistant.open)return;
    let mounted=true;
    const refresh=()=>{void getLocalAIAvailability().then(state=>{if(mounted&&alive.current)setAvailability(state);});};
    refresh();const listener=AppState.addEventListener('change',state=>{if(state==='active')refresh();});
    return()=>{mounted=false;listener.remove();};
  },[assistant.open]);
  function send(text:string) {
    const q=text.trim();if(!q||locked.current)return;
    setError('');assistant.setPrompt('');
    const previous=messages.at(-1);
    const lookup=previous?.response?.kind==='clarification'?`${previous.question}\n${q}`:q;
    if(mode==='saved'||availability.status!=='available') {
      const response:LocalAnswer={...answerRulesQuestion(lookup,context),mode:'saved',...(mode==='ai'?{fallbackReason:availability.message}:{})};
      setMessages(list=>[...list.slice(-19),{question:q,response,mode:'saved'}]);return;
    }
    const history=messages.filter(m=>m.response).slice(-2).map(m=>({question:m.question,answer:m.response!.answer}));
    locked.current=true;setBusy(true);setMessages(list=>[...list.slice(-19),{question:q,mode:'ai'}]);
    const abort=new AbortController();controller.current=abort;const timeout=setTimeout(()=>abort.abort(),90000);
    void explainRulesLocally({question:lookup,context,history,eventNotes:board?.eventRules??'',signal:abort.signal,generate:(instructions,prompt,signal)=>runLocalModel(instructions,prompt,signal)}).then(response=>{
      if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,response,mode:response.mode==='on-device'?'ai':'saved'}]);
    }).catch(reason=>{if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,error:reason instanceof Error?reason.message:'Local AI could not finish. Try Saved Rules.',mode:'ai'}]);}).finally(()=>{clearTimeout(timeout);locked.current=false;if(alive.current)setBusy(false);});
  }
  function close(){controller.current?.abort();assistant.close();}
  function openSource(url:string) {
    try{const parsed=new URL(url);if(parsed.protocol!=='https:')return;}catch{return;}
    void Linking.openURL(url).catch(()=>setError('Could not open the source.'));
  }
  return <Modal visible={assistant.open} transparent animationType="slide" onRequestClose={close}><View style={s.scrim}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={[s.drawer,{marginTop:Math.max(insets.top,20)}]}><View accessibilityViewIsModal style={s.inner}>
    <View style={s.handle}/><View style={s.header}><View style={s.avatar}><Icon name="chat" color={palette.white} size={24}/></View><View style={ui.flex}><DisplayText accessibilityRole="header" style={s.title}>ASK DUGOUT</DisplayText><Text numberOfLines={2} style={s.context}>{contextLabel(context)}{context.season?' · '+context.season:''}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close rules assistant" onPress={close} style={ui.headerButton}><Icon name="close" color={palette.ink} size={20}/></Pressable></View>
    <View style={s.modeRow}>{([{value:'saved',label:'SAVED RULES',detail:'Works offline'},{value:'ai',label:'ON-DEVICE AI',detail:availability.status==='available'?'Works offline':'Saved Rules fallback'}] as const).map(item=><Pressable key={item.value} disabled={busy} accessibilityRole="button" accessibilityState={{selected:mode===item.value}} onPress={()=>setMode(item.value)} style={[s.mode,mode===item.value&&s.modeActive]}><Text style={[s.modeLabel,mode===item.value&&s.modeLabelActive]}>{item.label}</Text><Text style={[s.modeDetail,mode===item.value&&s.modeLabelActive]}>{item.detail}</Text></Pressable>)}</View>
    {mode==='ai'&&availability.status!=='available'&&<View style={s.availability}><Text style={s.meta}>{availability.message}</Text><Pressable accessibilityRole="button" accessibilityLabel="Check on-device AI availability" onPress={()=>{void getLocalAIAvailability().then(state=>setAvailability(state));}} style={s.checkAgain}><Text style={s.sourceText}>CHECK AGAIN</Text></Pressable></View>}
    <ScrollView ref={scroll} onContentSizeChange={()=>scroll.current?.scrollToEnd({animated:true})} keyboardShouldPersistTaps="handled" contentContainerStyle={s.conversation}>
      {!messages.length&&<><View style={s.bot}><Text style={s.message}>{mode==='saved'?'Ask a common rules question from the references stored in this app. No internet or AI call is used.':'Ask in your own words. Apple’s on-device model explains the saved USSSA references, with saved MLB fallback for baseball only. It cannot browse for rules that are not in this library.'}</Text><Text style={s.meta}>{mode==='saved'?'Opening source links requires internet.':'Questions and explanations stay on this device. Initial model setup and reference updates need internet.'}</Text></View><View style={s.suggestions}>{['Explain the infield fly rule.','What bats are allowed?','Can a pitcher throw tomorrow?'].map(q=><Pressable key={q} accessibilityRole="button" onPress={()=>send(q)} style={s.suggestion}><Text style={s.suggestionText}>{q}</Text><Icon name="arrow" color={palette.accent} size={14}/></Pressable>)}</View></>}
      {messages.map((m,i)=><View key={i} style={s.exchange}><View style={s.user}><Text style={s.userText}>{m.question}</Text></View><View style={s.bot}><Text style={s.modeStamp}>{m.mode==='ai'?'ON-DEVICE AI · SAVED SOURCES':'SAVED REFERENCE · OFFLINE'}</Text>{m.response?<><CitedAnswer response={m.response} onSource={openSource}/>{'fallbackReason' in m.response&&m.response.fallbackReason&&<Text style={s.meta}>{m.response.fallbackReason}</Text>}</>:m.error?<><Text style={s.message}>{m.error}</Text><Pressable accessibilityRole="button" onPress={()=>{setMode('saved');assistant.setPrompt(m.question);}} style={s.source}><Text style={s.sourceText}>Use Saved Rules instead</Text></Pressable></>:<View style={s.loading}><ActivityIndicator color={palette.accent}/><Text style={s.meta}>Explaining saved references on your device…</Text></View>}</View></View>)}
      {!!error&&<Text accessibilityLiveRegion="polite" style={ui.error}>{error}</Text>}
    </ScrollView>
    <View style={[s.composerArea,{paddingBottom:Math.max(insets.bottom,14)}]}><View style={s.composer}><TextInput accessibilityLabel="Message Ask Dugout" placeholder={mode==='saved'?'Ask a saved-rules question…':'Ask on-device AI about a play…'} placeholderTextColor={palette.muted} value={assistant.prompt} onChangeText={assistant.setPrompt} multiline maxLength={800} editable={!busy} style={s.input}/><Pressable accessibilityRole="button" accessibilityLabel={busy?"Stop answer":"Send rules question"} disabled={!assistant.prompt.trim()&&!busy} onPress={()=>{if(busy)controller.current?.abort();else send(assistant.prompt);}} style={[s.send,(!assistant.prompt.trim()&&!busy)&&ui.dim]}><Icon name={busy?"close":"send"} color={palette.white} size={21}/></Pressable></View><Text style={s.footnote}>{mode==='saved'?'Saved edition · not a live rules update':'On-device explanation · verify the saved edition and event exceptions'}</Text></View>
  </View></KeyboardAvoidingView></View></Modal>;
}
function CitedAnswer({response,onSource}:{response:Answer;onSource:(url:string)=>void}) {
  const sources=response.sources??(response.url?[{title:response.reference,url:response.url}]:[]);
  const unique=sources.filter((source,i)=>sources.findIndex(s=>s.url===source.url)===i);
  return <><Text style={s.message}>{response.answer}</Text>{unique.map(source=><Pressable key={source.url} accessibilityRole="link" onPress={()=>onSource(source.url)} style={s.source}><Icon name="link" color={palette.accent} size={15}/><Text style={s.sourceText}>{source.title} ↗</Text></Pressable>)}{!unique.length&&<Text style={s.meta}>{response.reference}</Text>}</>;
}
const s=StyleSheet.create({
  availability:{paddingHorizontal:16,paddingBottom:10,backgroundColor:palette.panel},checkAgain:{minHeight:44,justifyContent:'center'},scrim:{flex:1,backgroundColor:'#001426A8',justifyContent:'flex-end'},drawer:{flex:1,width:'100%',maxWidth:720,maxHeight:'94%',alignSelf:'center'},inner:{flex:1,backgroundColor:palette.canvas,borderTopLeftRadius:22,borderTopRightRadius:22,overflow:'hidden'},handle:{width:34,height:4,borderRadius:2,backgroundColor:palette.line,alignSelf:'center',marginTop:10},header:{flexDirection:'row',alignItems:'center',gap:12,padding:18,borderBottomColor:palette.line,borderBottomWidth:1,backgroundColor:palette.panel},avatar:{width:44,height:44,backgroundColor:palette.navy,borderRadius:14,alignItems:'center',justifyContent:'center'},title:{color:palette.ink,fontSize:28},context:{color:palette.muted,fontSize:11,lineHeight:16},modeRow:{flexDirection:'row',padding:12,gap:8,backgroundColor:palette.panel},mode:{flex:1,padding:12,borderRadius:10,backgroundColor:palette.raised,gap:4},modeActive:{backgroundColor:palette.navy},modeLabel:{fontSize:11,fontWeight:'800',color:palette.ink},modeLabelActive:{color:palette.white},modeDetail:{fontSize:10,color:palette.muted},modeStamp:{fontSize:9,fontWeight:'800',letterSpacing:0.6,color:palette.muted},conversation:{padding:18,gap:20,paddingBottom:26},bot:{backgroundColor:palette.panel,borderRadius:14,borderTopLeftRadius:3,borderWidth:1,borderColor:palette.line,padding:16,gap:12,alignSelf:'flex-start',maxWidth:'95%'},message:{color:palette.ink,fontSize:15,lineHeight:23},meta:{color:palette.muted,fontSize:10,lineHeight:16},suggestions:{gap:8},suggestion:{borderWidth:1,borderColor:'#D5DEE5',padding:14,borderRadius:10,backgroundColor:palette.panel,flexDirection:'row',alignItems:'center',gap:10},suggestionText:{color:palette.ink,fontSize:13,fontWeight:'600',flex:1},exchange:{gap:12},user:{alignSelf:'flex-end',maxWidth:'85%',padding:14,borderRadius:14,borderBottomRightRadius:3,backgroundColor:palette.navy},userText:{color:palette.white,fontSize:15,lineHeight:22},source:{flexDirection:'row',alignItems:'center',gap:7,minHeight:44},sourceText:{color:'#A43F14',fontSize:11,fontWeight:'700',flex:1,lineHeight:17},inlineSource:{color:'#A43F14',fontWeight:'700',textDecorationLine:'underline'},loading:{flexDirection:'row',alignItems:'center',gap:10},composerArea:{padding:14,backgroundColor:palette.panel,borderTopWidth:1,borderColor:palette.line,gap:8},composer:{flexDirection:'row',alignItems:'flex-end',gap:10,borderWidth:1,borderColor:palette.line,borderRadius:16,padding:7,backgroundColor:palette.canvas},input:{flex:1,color:palette.ink,minHeight:42,maxHeight:110,paddingHorizontal:8,paddingVertical:10,fontSize:15},send:{width:42,height:42,borderRadius:21,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center'},footnote:{color:palette.muted,fontSize:10,textAlign:'center'},
});
