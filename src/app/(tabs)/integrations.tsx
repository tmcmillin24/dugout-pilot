import { openInAppBrowser } from '@/lib/in-app-browser';
import { formatPlayerName } from '@/lib/coaching/player-display';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { CryptoDigestAlgorithm, digestStringAsync } from 'expo-crypto';
import { Button, Icon, Panel, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { Choice, CoachingScreen, Sheet, c } from '@/components/coaching-ui';
import { DisplayText } from '@/components/sports-type';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { compileStatsImport, parseStatsImport, type ImportRow } from '@/lib/coaching/csv-import';
export default function ImportsScreen() {
  const { active }=useTeams();const { board }=useCoaching();
  return <CoachingScreen title="Imports">{board&&<ImportWorkspace key={active?.id} />}</CoachingScreen>;
}
function ImportWorkspace() {
  const { board,commit,writable }=useCoaching();
  const [preview,setPreview]=useState<{rows:ImportRow[];name:string;fingerprint:string;gameId:string}|null>(null);
  const [confirmed,setConfirmed]=useState(false);const [picking,setPicking]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const pickerLock=useRef(false);
  if(!board)return null;
  const game=board.games.find(g=>g.id===board.activeGameId)??board.games[0];
  const matched=preview?.rows.filter(r=>r.playerId).length??0;
  async function chooseFile() {
    if(pickerLock.current||!game||!board)return;pickerLock.current=true;setPicking(true);setError('');setNotice('');
    try {
      const result=await DocumentPicker.getDocumentAsync({type:['text/csv','text/comma-separated-values','application/csv','application/vnd.ms-excel','text/plain'],copyToCacheDirectory:true,multiple:false,base64:false});
      if(result.canceled)return;const asset=result.assets[0];if((asset.size??0)>1000000)throw new Error('Choose a CSV under 1 MB.');
      if(!/\.csv$/i.test(asset.name))throw new Error('Choose a .csv export, not an Excel workbook.');
      const text=Platform.OS==='web'&&asset.file?await asset.file.text():await new File(asset.uri).text();
      const fingerprint=await digestStringAsync(CryptoDigestAlgorithm.SHA256,text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim());
      if(game.importFingerprint===fingerprint)throw new Error('This CSV is already imported into this game.');
      setPreview({rows:parseStatsImport(text,board.players),name:asset.name,fingerprint,gameId:game.id});setConfirmed(false);
    } catch(reason) { setError(reason instanceof Error?reason.message:'Could not read the CSV.'); }
    finally {pickerLock.current=false;setPicking(false);}
  }
  function apply() {
    if(!preview||!confirmed||!board)return;
    try { const imported=compileStatsImport(preview.rows,board.players);const pending=preview;
      void commit(b=>{
        const target=b.games.find(g=>g.id===pending.gameId);if(!target)throw new Error('The target game is no longer available.');
        if(target.importFingerprint===pending.fingerprint)throw new Error('This CSV is already imported into this game.');
        compileStatsImport(pending.rows,b.players);
        return {...b,games:b.games.map(g=>g.id===pending.gameId?{...g,stats:imported,importFingerprint:pending.fingerprint,importLabel:`${pending.name} · ${Object.keys(imported).length} players`}:g)};
      }).then(ok=>{if(ok){setPreview(null);setNotice('Game stats imported.');}});
    }catch(reason){setError(reason instanceof Error?reason.message:'Check the player matches.');}
  }
  return <>
    <View style={s.hero}><View style={s.icon}><Icon name="upload" color={palette.white} size={30}/></View><Text style={s.kicker}>BRING YOUR GAME WITH YOU</Text><DisplayText italic style={s.heroTitle}>{'FROM THE BOX SCORE.\nINTO YOUR DUGOUT.'}</DisplayText><Text style={s.heroCopy}>Import a CSV exported from GameChanger.</Text></View>
    {!game&&<Text style={ui.body}>Add a game in Lineups before importing stats.</Text>}
    {game&&<Choice label="Import into game" value={game.id} options={board.games.map(g=>({value:g.id,label:`Day ${g.day} · ${g.label} vs ${g.opponent}`}))} disabled={!writable||picking||!!preview} onChange={id=>{void commit(b=>({...b,activeGameId:id}));}}/>}
    <Panel><View style={s.upload}><Text style={s.uploadTitle}>Your stats. Your roster.</Text><Button secondary onPress={()=>{void openInAppBrowser('https://web.gc.com/').catch(()=>setError('Could not open GameChanger.'));}}>OPEN GAMECHANGER</Button><Text style={ui.body}>Open GameChanger, export your CSV and save it to Files. Tap Done to return, then choose the file below.</Text><Button disabled={!writable||picking||!game||!board.players.length} onPress={()=>{void chooseFile();}}>{picking?'READING CSV…':'CHOOSE CSV FILE'}</Button>{!board.players.length&&<Text style={c.small}>Add players in Roster before importing stats.</Text>}</View></Panel>
    <StatusMessage text={error} error/><StatusMessage text={notice}/>
    <Section title="Before you export"><Panel>{[['01','Filter to one game','Use the same game selected above. Season totals should not be added to a single game.'],['02','Export your stats','Sign in as team staff. Open your team → Stats → Filter Stats, choose one game, then Export Stats.'],['03','Review the matches','Check every player and stat before replacing this game’s imported stats.']].map(([n,title,detail])=><View style={s.step} key={n}><DisplayText style={s.stepNumber}>{n}</DisplayText><View style={ui.flex}><Text style={s.stepTitle}>{title}</Text><Text style={s.stepDetail}>{detail}</Text></View></View>)}</Panel></Section>
    {!!game?.importLabel&&<Section title="Current import"><Panel><View style={c.item}><Text style={ui.rowTitle}>{game.importLabel}</Text><Text style={c.small}>{Object.keys(game.stats).length} players · saved to {game.label}</Text>{Object.entries(game.stats).map(([id,stats])=><View key={id} style={s.statRow}><Text style={s.statName}>{formatPlayerName(board.players.find(p=>p.id===id)?.name)}</Text><Text style={s.statValues}>{Object.entries(stats).map(([key,value])=>`${key.toUpperCase()} ${value}`).join(' · ')}</Text></View>)}</View></Panel></Section>}
    <Pressable accessibilityRole="link" onPress={()=>{void openInAppBrowser('https://help.gc.com/hc/en-us/articles/360043583651-Exporting-Season-Stats').catch(()=>setError('Could not open export instructions.'));}} style={s.help}><Icon name="link" color={palette.ink} size={18}/><Text style={s.helpText}>How to export your team’s stats</Text><Icon name="arrow" size={14}/></Pressable>
    <Text style={c.small}>If the in-app browser cannot save the download, export from the GameChanger app and save to Files, then return here.</Text><Text style={s.disclosure}>Independent CSV import. Dugout Pilot is not affiliated with or endorsed by GameChanger. No account connection or live sync.</Text>
    <Sheet title="Review import" open={!!preview} onClose={()=>{setPreview(null);setError('');}}>{preview&&<><Text style={ui.rowTitle}>{preview.name}</Text><Text style={c.small}>{matched}/{preview.rows.length} rows matched · {board.games.find(g=>g.id===preview.gameId)?.label}</Text><StatusMessage text={error} error/>{preview.rows.map(row=><View key={row.id} style={s.previewRow}><Text style={ui.rowTitle}>{row.number?`#${row.number} `:''}{formatPlayerName(row.name)}</Text><Text style={c.small}>{Object.entries(row.stats).map(([key,value])=>`${key.toUpperCase()} ${value}`).join(' · ')}</Text><Choice label={`Match ${formatPlayerName(row.name)}`} value={row.playerId} options={[{value:'',label:row.ambiguous?'Ambiguous — choose player or skip':'Skip this row'},...board.players.map(p=>({value:p.id,label:`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`}))]} onChange={playerId=>setPreview({...preview,rows:preview.rows.map(r=>r.id===row.id?{...r,playerId}:r)})}/></View>)}<Text style={c.small}>{preview.rows.length-matched} unmatched rows will be skipped. This replaces imported stats for the selected game; pitching logs and lineups stay as entered.</Text><Pressable accessibilityRole="checkbox" accessibilityState={{checked:confirmed}} onPress={()=>setConfirmed(!confirmed)} style={s.confirm}><View style={[s.checkbox,confirmed&&s.checkboxChecked]}>{confirmed&&<Icon name="check" color={palette.white} size={15}/>}</View><Text style={[ui.body,ui.flex]}>I confirm this file contains only this game’s stats and I reviewed the player matches.</Text></Pressable><Button disabled={!writable||!confirmed||!matched} onPress={apply}>IMPORT REVIEWED STATS</Button></>}</Sheet>
  </>;
}
const s=StyleSheet.create({
  hero:{backgroundColor:palette.navy,padding:23,gap:14,borderRadius:9,borderBottomWidth:4,borderBottomColor:palette.accent},icon:{width:50,height:50,borderRadius:15,backgroundColor:'#20475F',alignItems:'center',justifyContent:'center'},kicker:{fontSize:9,fontWeight:'800',letterSpacing:1.4,color:'#B5CAD8'},heroTitle:{fontSize:36,lineHeight:38,color:palette.white},heroCopy:{color:'#C4D6E2',fontSize:13,lineHeight:20},upload:{padding:20,gap:15},uploadTitle:{fontSize:20,fontWeight:'700',color:palette.ink},step:{flexDirection:'row',gap:15,padding:17,borderBottomWidth:1,borderColor:palette.line},stepNumber:{fontSize:27,color:'#B34616',width:30},stepTitle:{fontSize:14,fontWeight:'700',color:palette.ink},stepDetail:{fontSize:12,color:palette.muted,lineHeight:19,marginTop:5},help:{flexDirection:'row',alignItems:'center',gap:10,minHeight:48},helpText:{fontSize:13,color:palette.ink,fontWeight:'600',flex:1},disclosure:{color:palette.muted,fontSize:10,lineHeight:17},previewRow:{gap:9,borderBottomWidth:1,borderColor:palette.line,paddingBottom:16},confirm:{flexDirection:'row',alignItems:'center',gap:12,minHeight:54},checkbox:{width:24,height:24,borderWidth:1,borderColor:palette.muted,borderRadius:5,alignItems:'center',justifyContent:'center'},checkboxChecked:{backgroundColor:palette.navy,borderColor:palette.navy},statRow:{gap:4,paddingVertical:10,borderTopWidth:1,borderColor:palette.line},statName:{fontSize:13,fontWeight:'700',color:palette.ink},statValues:{fontSize:11,lineHeight:18,color:palette.muted},
});
