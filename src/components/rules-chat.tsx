import { openInAppBrowser } from '@/lib/in-app-browser';
import { getNetworkStateAsync, useNetworkState } from 'expo-network';
import { answerDugout, type DugoutAnswer } from '@/lib/coaching/ask-dugout';
import { askRulesOnline } from '@/lib/rules-assistant';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, AppState, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useRulesAssistant } from '@/providers/rules-assistant-provider';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { contextLabel, getRulesContext } from '@/lib/coaching/rules-context';
import { getLocalAIAvailability, runLocalModel, type LocalAIStatus } from '@/lib/on-device-ai';
export function RulesChat() {
  const assistant=useRulesAssistant();const {board}=useCoaching();const {active}=useTeams();
  if(!assistant)return null;
  return <RulesConversation key={`${active?.id??'none'}:${JSON.stringify(getRulesContext(board??{}))}`} board={board} assistant={assistant}/>;
}
type Answer=DugoutAnswer;
type Entry={question:string;response?:Answer;error?:string;mode:'saved'|'ai'};
type Assistant=NonNullable<ReturnType<typeof useRulesAssistant>>;
function RulesConversation({board,assistant}:{board:ReturnType<typeof useCoaching>['board'];assistant:Assistant}) {
  const {active}=useTeams();const network=useNetworkState();
  const connected=network.isConnected!==false&&network.isInternetReachable!==false;
  const connectionLabel=network.isConnected===undefined?'Checking…':connected?'Online · Gemini 3.5 Flash Lite':'Offline';
  const context=getRulesContext(board??{});const insets=useSafeAreaInsets();
  const [keyboardVisible,setKeyboardVisible]=useState(false);
  const nearBottom=useRef(true);
  const [details,setDetails]=useState(false);const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [messages,setMessages]=useState<Entry[]>([]);
  const [availability,setAvailability]=useState<LocalAIStatus>({status:'checking',message:'Checking on-device AI…'});
  const scroll=useRef<ComponentRef<typeof ScrollView>>(null);const controller=useRef<AbortController|null>(null);const alive=useRef(true);const locked=useRef(false);
  useEffect(()=>{
    const show=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillShow':'keyboardDidShow',()=>setKeyboardVisible(true));
    const hide=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillHide':'keyboardDidHide',()=>setKeyboardVisible(false));
    return()=>{show.remove();hide.remove();};
  },[]);
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
    nearBottom.current=true;setError('');assistant.setPrompt('');
    const previous=messages.at(-1);
    const lookup=previous?.response?.kind==='clarification'?`${previous.question}\n${q}`:q;
    const history=messages.filter(m=>m.response).slice(-2).map(m=>({question:m.question,answer:m.response!.answer}));
    locked.current=true;setBusy(true);setMessages(list=>[...list.slice(-19),{question:q,mode:'ai'}]);
    const abort=new AbortController();controller.current=abort;const timeout=setTimeout(()=>abort.abort(),90000);
    void getNetworkStateAsync().catch(()=>network).then(state=>answerDugout({question:lookup,context,history,eventNotes:board?.eventRules??'',teamId:active?.id,connected:state.isConnected!==false&&state.isInternetReachable!==false,localAvailable:availability.status==='available',signal:abort.signal,online:askRulesOnline,generate:(instructions,prompt,signal)=>runLocalModel(instructions,prompt,signal)})).then(response=>{
      if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,response,mode:response.route==='online'?'ai':'saved'}]);
    }).catch(reason=>{if(alive.current)setMessages(list=>[...list.slice(0,-1),{question:q,error:reason instanceof Error?reason.message:'Could not finish the explanation. Please try again.',mode:'ai'}]);}).finally(()=>{clearTimeout(timeout);locked.current=false;if(alive.current)setBusy(false);});
  }
  function close(){controller.current?.abort();Keyboard.dismiss();assistant.close();}
  function openSource(url:string) {
    try{const parsed=new URL(url);if(parsed.protocol!=='https:')return;}catch{return;}
    void openInAppBrowser(url).catch(()=>setError('Could not open the source.'));
  }
  return <Modal visible={assistant.open} presentationStyle="fullScreen" animationType="slide" onRequestClose={close}><View style={[s.surface,{paddingTop:insets.top}]}><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.keyboardFrame}><View accessibilityViewIsModal style={s.inner}>
    <View style={s.header}><View style={s.avatar}><Icon name="chat" color={palette.white} size={24}/></View><View style={ui.flex}><DisplayText accessibilityRole="header" style={s.title}>ASK DUGOUT</DisplayText><Text numberOfLines={2} style={s.context}>{contextLabel(context)}{context.season?' · '+context.season:''}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close rules assistant" onPress={close} style={ui.headerButton}><Icon name="close" color={palette.ink} size={20}/></Pressable></View>
    <View style={s.connection}><View style={[s.dot,{backgroundColor:network.isConnected!==undefined&&connected?'#2B7B59':palette.muted}]}/><Text accessibilityLiveRegion="polite" numberOfLines={1} style={s.connectionText}>{connectionLabel}</Text></View>
    <ScrollView ref={scroll} style={ui.flex} onContentSizeChange={()=>{if(nearBottom.current)scroll.current?.scrollToEnd({animated:true});}} onLayout={()=>{if(nearBottom.current)scroll.current?.scrollToEnd({animated:false});}} onScroll={event=>{const {contentOffset,contentSize,layoutMeasurement}=event.nativeEvent;nearBottom.current=contentSize.height-contentOffset.y-layoutMeasurement.height<80;}} scrollEventThrottle={16} keyboardDismissMode={Platform.OS==='ios'?'interactive':'on-drag'} keyboardShouldPersistTaps="handled" contentContainerStyle={s.conversation}>
      {!messages.length&&<><View style={s.bot}><Text style={s.message}>Describe the play. I’ll explain the ruling and show the reference.</Text></View><View style={s.suggestions}>{['Explain the infield fly rule.','What bats are allowed?','Can a pitcher throw tomorrow?'].map(q=><Pressable key={q} accessibilityRole="button" onPress={()=>send(q)} style={s.suggestion}><Text style={s.suggestionText}>{q}</Text><Icon name="arrow" color={palette.accent} size={14}/></Pressable>)}</View></>}
      {messages.map((m,i)=><View key={i} style={s.exchange}><View style={s.user}><Text style={s.userText}>{m.question}</Text></View><View style={s.bot}>{m.response?<><CitedAnswer response={m.response} onSource={openSource}/>{m.response.notice&&<Text style={s.meta}>{m.response.notice}</Text>}</>:m.error?<><Text style={s.message}>{m.error}</Text><Pressable accessibilityRole="button" onPress={()=>{assistant.setPrompt(m.question);}} style={s.source}><Text style={s.sourceText}>Try again</Text></Pressable></>:<View style={s.loading}><ActivityIndicator color={palette.accent}/><Text style={s.meta}>Checking the ruling…</Text></View>}</View></View>)}
      {!!error&&<Text accessibilityLiveRegion="polite" style={ui.error}>{error}</Text>}
    </ScrollView>
    <View style={[s.composerArea,{paddingBottom:keyboardVisible?10:Math.max(insets.bottom,14)}]}><View style={s.composer}><TextInput accessibilityLabel="Message Ask Dugout" placeholder="Ask about a play…" placeholderTextColor={palette.muted} value={assistant.prompt} onChangeText={assistant.setPrompt} textAlignVertical="top" multiline maxLength={800} editable={!busy} style={s.input}/><Pressable accessibilityRole="button" accessibilityLabel={busy?"Stop answer":"Send rules question"} disabled={!assistant.prompt.trim()&&!busy} onPress={()=>{if(busy)controller.current?.abort();else send(assistant.prompt);}} style={[s.send,(!assistant.prompt.trim()&&!busy)&&ui.dim]}><Icon name={busy?"close":"send"} color={palette.white} size={21}/></Pressable></View>{!keyboardVisible&&<Pressable accessibilityRole="button" accessibilityLabel="About Ask Dugout" accessibilityState={{expanded:details}} onPress={()=>setDetails(!details)}><Text style={s.footnote}>About Ask Dugout · Check event rules</Text></Pressable>}{details&&!keyboardVisible&&<Text style={s.meta}>One conversation: online answers use official sources; offline answers use the references included in the app, with private explanations on supported devices. Offline coverage is limited. Source links need internet.</Text>}</View>
  </View></KeyboardAvoidingView></View></Modal>;
}
function CitedAnswer({response,onSource}:{response:Answer;onSource:(url:string)=>void}) {
  const sources=response.sources??(response.url?[{title:response.reference,url:response.url}]:[]);
  const unique=sources.filter((source,i)=>sources.findIndex(s=>s.url===source.url)===i);
  const parts:React.ReactNode[]=[];let offset=0;
  for(const citation of [...(response.citations??[])].sort((a,b)=>a.start-b.start)){if(citation.start<offset)continue;parts.push(response.answer.slice(offset,citation.start));parts.push(<Text key={`${citation.start}:${citation.url}`} accessibilityRole="link" onPress={()=>onSource(citation.url)} style={s.inlineSource}>{response.answer.slice(citation.start,citation.end)}</Text>);offset=citation.end;}parts.push(response.answer.slice(offset));
  return <><Text style={s.message}>{parts}</Text>{!!unique.length&&<View style={s.references}>{unique.map(source=><Pressable key={source.url} accessibilityRole="link" onPress={()=>onSource(source.url)} style={s.referenceLink}><Icon name="link" color={palette.accent} size={15}/><Text style={s.sourceText}>{source.title} ↗</Text></Pressable>)}</View>}{!unique.length&&<Text style={s.meta}>{response.reference}</Text>}</>;
}
const s=StyleSheet.create({
  connection:{flexDirection:'row',alignItems:'center',gap:6,paddingHorizontal:20,paddingVertical:9,backgroundColor:palette.panel},dot:{width:6,height:6,borderRadius:3},connectionText:{fontSize:11,color:palette.muted,fontWeight:'600'},availability:{paddingHorizontal:16,paddingBottom:10,backgroundColor:palette.panel},checkAgain:{minHeight:44,justifyContent:'center'},surface:{flex:1,backgroundColor:palette.panel},keyboardFrame:{flex:1,backgroundColor:palette.panel},inner:{flex:1,width:'100%',maxWidth:720,alignSelf:'center',backgroundColor:palette.canvas},header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:18,paddingVertical:12,borderBottomColor:palette.line,borderBottomWidth:1,backgroundColor:palette.panel},avatar:{width:40,height:40,backgroundColor:palette.navy,borderRadius:14,alignItems:'center',justifyContent:'center'},title:{color:palette.ink,fontSize:28},context:{color:palette.muted,fontSize:11,lineHeight:16},modeRow:{flexDirection:'row',padding:12,gap:8,backgroundColor:palette.panel},mode:{flex:1,padding:12,borderRadius:10,backgroundColor:palette.raised,gap:4},modeActive:{backgroundColor:palette.navy},modeLabel:{fontSize:11,fontWeight:'800',color:palette.ink},modeLabelActive:{color:palette.white},modeDetail:{fontSize:10,color:palette.muted},modeStamp:{fontSize:9,fontWeight:'800',letterSpacing:0.6,color:palette.muted},conversation:{padding:16,gap:18,paddingBottom:20,flexGrow:1},bot:{backgroundColor:palette.panel,borderRadius:14,borderTopLeftRadius:3,borderWidth:1,borderColor:palette.line,padding:16,gap:12,alignSelf:'flex-start',maxWidth:'95%'},message:{color:palette.ink,fontSize:15,lineHeight:23},meta:{color:palette.muted,fontSize:10,lineHeight:16},suggestions:{gap:8},suggestion:{borderWidth:1,borderColor:'#D5DEE5',padding:14,borderRadius:10,backgroundColor:palette.panel,flexDirection:'row',alignItems:'center',gap:10},suggestionText:{color:palette.ink,fontSize:13,fontWeight:'600',flex:1},exchange:{gap:12},user:{alignSelf:'flex-end',maxWidth:'85%',padding:14,borderRadius:14,borderBottomRightRadius:3,backgroundColor:palette.navy},userText:{color:palette.white,fontSize:15,lineHeight:22},references:{gap:0,borderTopWidth:1,borderColor:palette.line,paddingTop:4},referenceLink:{flexDirection:'row',alignItems:'center',gap:7,minHeight:36,paddingVertical:4},source:{flexDirection:'row',alignItems:'center',gap:7,minHeight:44},sourceText:{color:'#A43F14',fontSize:11,fontWeight:'700',flex:1,lineHeight:17},inlineSource:{color:'#A43F14',fontWeight:'700',textDecorationLine:'underline'},loading:{flexDirection:'row',alignItems:'center',gap:10},composerArea:{paddingHorizontal:14,paddingTop:10,backgroundColor:palette.panel,borderTopWidth:1,borderColor:palette.line,gap:8},composer:{flexDirection:'row',alignItems:'flex-end',gap:10,borderWidth:1,borderColor:palette.line,borderRadius:16,padding:7,backgroundColor:palette.canvas},input:{flex:1,color:palette.ink,minHeight:42,maxHeight:110,paddingHorizontal:8,paddingVertical:10,fontSize:15},send:{width:42,height:42,borderRadius:21,backgroundColor:palette.navy,alignItems:'center',justifyContent:'center'},footnote:{color:palette.muted,fontSize:10,textAlign:'center'},
});
