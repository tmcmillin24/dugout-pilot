import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useRulesAssistant } from '@/providers/rules-assistant-provider';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { answerRulesQuestion, contextLabel, getRulesContext, type RulesAnswer } from '@/lib/coaching/rules-context';
import { askRulesAI, type AssistantAnswer, type RuleCitation } from '@/lib/rules-assistant';
export function RulesChat() {
  const assistant=useRulesAssistant();const {board}=useCoaching();const {active}=useTeams();
  if(!assistant)return null;
  return <RulesConversation key={`${active?.id??'none'}:${JSON.stringify(getRulesContext(board??{}))}`} board={board} teamId={active?.id} assistant={assistant}/>;
}
type Answer=RulesAnswer|AssistantAnswer;
type Entry={question:string;response?:Answer;error?:string;mode:'saved'|'ai'};
type Assistant=NonNullable<ReturnType<typeof useRulesAssistant>>;
function RulesConversation({board,teamId,assistant}:{board:ReturnType<typeof useCoaching>['board'];teamId?:string;assistant:Assistant}) {
  const context=getRulesContext(board??{});const insets=useSafeAreaInsets();
  const [mode,setMode]=useState<'saved'|'ai'>('saved');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [messages,setMessages]=useState<Entry[]>([]);
  const scroll=useRef<ComponentRef<typeof ScrollView>>(null);const controller=useRef<AbortController|null>(null);const alive=useRef(true);const locked=useRef(false);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
  function send(text:string) {
    const q=text.trim();if(!q||locked.current)return;
    setError('');assistant.setPrompt('');
    const previous=messages.at(-1);
    const lookup=previous?.mode==='saved'&&previous.response?.kind==='clarification'?`${previous.question}\n${q}`:q;
    if(mode==='saved'){setMessages(list=>[...list.slice(-19),{question:q,response:answerRulesQuestion(lookup,context),mode:'saved'}]);return;}
    if(!teamId){assistant.setPrompt(q);setError('Choose your team before using Ask AI. Saved Rules can be used without a team.');return;}
    const history=messages.filter(m=>m.response).slice(-3).flatMap(m=>[{role:'user' as const,content:m.question},{role:'assistant' as const,content:m.response!.answer.slice(0,2500)}]);
    locked.current=true;setBusy(true);setMessages(list=>[...list.slice(-19),{question:q,mode:'ai'}]);
    const abort=new AbortController();controller.current=abort;const timeout=setTimeout(()=>abort.abort(),120000);
    void askRulesAI(teamId,q,history,abort.signal).then(response=>{
      if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,response,mode:'ai'}]);
    }).catch(reason=>{if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,error:reason instanceof Error?reason.message:'AI lookup failed. Try Saved Rules.',mode:'ai'}]);}).finally(()=>{clearTimeout(timeout);locked.current=false;if(alive.current)setBusy(false);});
  }
  function openSource(url:string) {
    try{const parsed=new URL(url);if(parsed.protocol!=='https:')return;}catch{return;}
    void Linking.openURL(url).catch(()=>setError('Could not open the source.'));
  }
  return <Modal visible={assistant.open} transparent animationType="slide" onRequestClose={assistant.close}><View style={s.scrim}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={[s.drawer,{marginTop:Math.max(insets.top,20)}]}><View accessibilityViewIsModal style={s.inner}>
    <View style={s.handle}/><View style={s.header}><View style={s.avatar}><Icon name="chat" color={palette.white} size={24}/></View><View style={ui.flex}><DisplayText accessibilityRole="header" style={s.title}>ASK DUGOUT</DisplayText><Text numberOfLines={2} style={s.context}>{contextLabel(context)}{context.season?' · '+context.season:''}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close rules assistant" onPress={assistant.close} style={ui.headerButton}><Icon name="close" color={palette.ink} size={20}/></Pressable></View>
    <View style={s.modeRow}>{([{value:'saved',label:'SAVED RULES',detail:'Works offline'},{value:'ai',label:'ASK AI',detail:'Internet required'}] as const).map(item=><Pressable key={item.value} disabled={busy} accessibilityRole="button" accessibilityState={{selected:mode===item.value}} onPress={()=>setMode(item.value)} style={[s.mode,mode===item.value&&s.modeActive]}><Text style={[s.modeLabel,mode===item.value&&s.modeLabelActive]}>{item.label}</Text><Text style={[s.modeDetail,mode===item.value&&s.modeLabelActive]}>{item.detail}</Text></Pressable>)}</View>
    <ScrollView ref={scroll} onContentSizeChange={()=>scroll.current?.scrollToEnd({animated:true})} keyboardShouldPersistTaps="handled" contentContainerStyle={s.conversation}>
      {!messages.length&&<><View style={s.bot}><Text style={s.message}>{mode==='saved'?'Ask a common rules question from the references stored in this app. No internet or AI call is used. For complex situations, choose Ask AI.':'Ask a question in your own words. AI checks official USSSA sources first, then MLB for uncovered baseball rules. It does not use MLB rules for softball.'}</Text><Text style={s.meta}>{mode==='saved'?'Opening source links requires internet.':'Your question, recent conversation, team rules profile and event notes are sent for this lookup. Roster data is not sent.'}</Text></View><View style={s.suggestions}>{['Explain the infield fly rule.','What bats are allowed?','Can a pitcher throw tomorrow?'].map(q=><Pressable key={q} accessibilityRole="button" onPress={()=>send(q)} style={s.suggestion}><Text style={s.suggestionText}>{q}</Text><Icon name="arrow" color={palette.accent} size={14}/></Pressable>)}</View></>}
      {messages.map((m,i)=><View key={i} style={s.exchange}><View style={s.user}><Text style={s.userText}>{m.question}</Text></View><View style={s.bot}><Text style={s.modeStamp}>{m.mode==='ai'?'AI · OFFICIAL-SOURCE LOOKUP':'SAVED REFERENCE · OFFLINE'}</Text>{m.response?<><CitedAnswer response={m.response} onSource={openSource}/>{'mlbFallback' in m.response&&m.response.mlbFallback&&<Text style={s.meta}>MLB fallback · check USSSA and event exceptions</Text>}</>:m.error?<><Text style={s.message}>{m.error}</Text><Pressable accessibilityRole="button" onPress={()=>{setMode('saved');assistant.setPrompt(m.question);}} style={s.source}><Text style={s.sourceText}>Use Saved Rules instead</Text></Pressable></>:<View style={s.loading}><ActivityIndicator color={palette.accent}/><Text style={s.meta}>Checking official sources…</Text></View>}</View></View>)}
      {!!error&&<Text accessibilityLiveRegion="polite" style={ui.error}>{error}</Text>}
    </ScrollView>
    <View style={[s.composerArea,{paddingBottom:Math.max(insets.bottom,14)}]}><View style={s.composer}><TextInput accessibilityLabel="Message Ask Dugout" placeholder={mode==='saved'?'Ask a saved-rules question…':'Ask AI about a play…'} placeholderTextColor={palette.muted} value={assistant.prompt} onChangeText={assistant.setPrompt} multiline maxLength={800} editable={!busy} style={s.input}/><Pressable accessibilityRole="button" accessibilityLabel="Send rules question" disabled={!assistant.prompt.trim()||busy} onPress={()=>send(assistant.prompt)} style={[s.send,(!assistant.prompt.trim()||busy)&&ui.dim]}><Icon name="send" color={palette.white} size={21}/></Pressable></View><Text style={s.footnote}>{mode==='saved'?'Saved edition · not a live rules update':'AI can make mistakes · verify cited rules and event modifications'}</Text></View>
  </View></KeyboardAvoidingView></View></Modal>;
}
function CitedAnswer({response,onSource}:{response:Answer;onSource:(url:string)=>void}) {
  const citations:RuleCitation[]='citations' in response?response.citations:[];const segments=[];let offset=0;
  for(const [i,citation] of citations.entries()){if(citation.start<offset||citation.end>response.answer.length)continue;segments.push(<Text key={`text-${i}`}>{response.answer.slice(offset,citation.start)}</Text>);segments.push(<Text accessibilityRole="link" accessibilityLabel={citation.title} key={`ref-${i}`} onPress={()=>onSource(citation.url)} style={s.inlineSource}> [{i+1}]</Text>);offset=citation.end;}
  segments.push(<Text key="end">{response.answer.slice(offset)}</Text>);
  const sources='citations' in response?response.citations.map(c=>({title:c.title,url:c.url})):response.sources??(response.url?[{title:response.reference,url:response.url}]:[]);
  const unique=sources.filter((source,i)=>sources.findIndex(s=>s.url===source.url)===i);
  return <><Text style={s.message}>{segments}</Text>{unique.map(source=><Pressable key={source.url} accessibilityRole="link" onPress={()=>onSource(source.url)} style={s.source}><Icon name="link" color={palette.accent} size={15}/><Text style={s.sourceText}>{source.title} ↗</Text></Pressable>)}{!('citations' in response)&&!unique.length&&<Text style={s.meta}>{response.reference}</Text>}</>;
}
const s=StyleSheet.create({
  scrim:{flex:1,backgroundColor:'#001426A8',justifyContent:'flex-end'},drawer:{flex:1,width:'100%',maxWidth:720,maxHeight:'94%',alignSelf:'center'},inner:{flex:1,backgroundColor:palette.canvas,borderTopLeftRadius:22,borderTopRightRadius:22,overflow:'hidden'},handle:{width:34,height:4,borderRadius:2,backgroundColor:palette.line,alignSelf:'center',marginTop:10},header:{flexDirection:'row',alignItems:'center',gap:12,padding:18,borderBottomColor:palette.line,borderBottomWidth:1,backgroundColor:palette.panel},avatar:{width:44,height:44,backgroundColor:palette.navy,borderRadius:14,alignItems:'center',justifyContent:'center'},title:{color:palette.ink,fontSize:28},context:{color:palette.muted,fontSize:11,lineHeight:16},modeRow:{flexDirection:'row',padding:12,gap:8,backgroundColor:palette.panel},mode:{flex:1,padding:12,borderRadius:10,backgroundColor:palette.raised,gap:4},modeActive:{backgroundColor:palette.navy},modeLabel:{fontSize:11,fontWeight:'800',color:palette.ink},modeLabelActive:{color:palette.white},modeDetail:{fontSize:10,color:palette.muted},modeStamp:{fontSize:9,fontWeight:'800',letterSpacing:0.6,color:palette.muted},conversation:{padding:18,gap:20,paddingBottom:26},bot:{backgroundColor:palette.panel,borderRadius:14,borderTopLeftRadius:3,borderWidth:1,borderColor:palette.line,padding:16,gap:12,alignSelf:'flex-start',maxWidth:'95%'},message:{color:palette.ink,fontSize:15,lineHeight:23},meta:{color:palette.muted,fontSize:10,lineHeight:16},suggestions:{gap:8},suggestion:{borderWidth:1,borderColor:'#D5DEE5',padding:14,borderRadius:10,backgroundColor:palette.panel,flexDirection:'row',alignItems:'center',gap:10},suggestionText:{color:palette.ink,fontSize:13,fontWeight:'600',flex:1},exchange:{gap:12},user:{alignSelf:'flex-end',maxWidth:'85%',padding:14,borderRadius:14,borderBottomRightRadius:3,backgroundColor:palette.navy},userText:{color:palette.white,fontSize:15,lineHeight:22},source:{flexDirection:'row',alignItems:'center',gap:7,minHeight:44},sourceText:{color:'#A43F14',fontSize:11,fontWeight:'700',flex:1,lineHeight:17},inlineSource:{color:'#A43F14',fontWeight:'700',textDecorationLine:'underline'},loading:{flexDirection:'row',alignItems:'center',gap:10},composerArea:{padding:14,backgroundColor:palette.panel,borderTopWidth:1,borderColor:palette.line,gap:8},composer:{flexDirection:'row',alignItems:'flex-end',gap:10,borderWidth:1,borderColor:palette.line,borderRadius:16,padding:7,backgroundColor:palette.canvas},input:{flex:1,color:palette.ink,minHeight:42,maxHeight:110,paddingHorizontal:8,paddingVertical:10,fontSize:15},send:{width:42,height:42,borderRadius:21,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center'},footnote:{color:palette.muted,fontSize:10,textAlign:'center'},
});
