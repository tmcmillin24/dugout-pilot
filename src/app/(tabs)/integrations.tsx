import { useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';
import { Button, Panel, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { Choice, CoachingScreen, Field, Sheet, c } from '@/components/coaching-ui';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { openInAppBrowser } from '@/lib/in-app-browser';
import { applyStatsImport, parseDetailedImport, NEW_PLAYER, REVIEW_PLAYER, type ParsedImport, type ImportRow } from '@/lib/coaching/csv-import';
import { POSITIONS } from '@/lib/coaching/board';
import { seasonKey, inferEraInnings, suggestedContribution } from '@/lib/coaching/stat-data';
import { Toggle } from '@/components/practice-planner-controls';
export default function ImportsScreen(){const {active}=useTeams();return <CoachingScreen title="Imports"><ImportWorkspace key={active?.id}/></CoachingScreen>;}
function ImportWorkspace(){
 const {board,commit,writable,busy}=useCoaching();
 const [mode,setMode]=useState<'season'|'game'>('season');
 const [season,setSeason]=useState(()=>board?seasonKey(board):String(new Date().getFullYear()));
 const [gameId,setGameId]=useState(board?.activeGameId??'');
 const [preview,setPreview]=useState<(ParsedImport&{name:string;fingerprint:string})|null>(null);
 const [confirmed,setConfirmed]=useState(false),[mergePositions,setMergePositions]=useState(false),[picking,setPicking]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[positionRow,setPositionRow]=useState('');
 const [contribution,setContribution]=useState<'add'|'included'>('add'),[eraInnings,setEraInnings]=useState(6);
 const lock=useRef(false);
 if(!board)return null;
 function changeRow(id:string,change:Partial<ImportRow>){setPreview(p=>p?{...p,rows:p.rows.map(r=>r.id===id?{...r,...change}:r)}:p);setConfirmed(false);}
 async function chooseFile(){if(lock.current)return;lock.current=true;setPicking(true);setError('');setNotice('');try{
  const result=await DocumentPicker.getDocumentAsync({type:['text/csv','text/comma-separated-values','application/csv','application/vnd.ms-excel','text/plain'],copyToCacheDirectory:true,multiple:false,base64:false});
  if(result.canceled)return;const asset=result.assets[0];if((asset.size??0)>1000000)throw new Error('Choose a CSV under 1 MB.');if(!/\.csv$/i.test(asset.name))throw new Error('Choose a CSV, not a PDF or Excel workbook.');
  const text=Platform.OS==='web'&&asset.file?await asset.file.text():await new File(asset.uri).text();
  const parsed=parseDetailedImport(text,board!.players);const fingerprint=await digestStringAsync(CryptoDigestAlgorithm.SHA256,text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').trim());
  if(mode==='game'&&((parsed.gamesPlayed??0)>1||parsed.rows.some(r=>(r.stats.batting?.GP??0)>1||(r.stats.pitching?.GP??0)>1)))throw new Error('This CSV includes multiple games. Select Season, or export stats filtered to one game.');
  setEraInnings(inferEraInnings(Object.fromEntries(parsed.rows.map(r=>[r.id,r.stats])))??6);setContribution(suggestedContribution(board!,gameId,season));
  setPreview({...parsed,name:asset.name,fingerprint});setConfirmed(false);setMergePositions(false);
 }catch(e){setError(e instanceof Error?e.message:'Could not read this file.');}finally{setPicking(false);lock.current=false;}}
 async function apply(){if(!preview||!confirmed||lock.current)return;lock.current=true;setError('');try{
  const request={mode,season,gameId,label:preview.name,fingerprint:preview.fingerprint,importedAt:new Date().toISOString(),rows:preview.rows,columns:preview.columns,mergePositions,contribution,eraInnings,gamesPlayed:preview.gamesPlayed};
  const old=board?.seasonImports?.find(s=>s.season===season);const metadataOnly=mode==='season'&&old?.fingerprint===preview.fingerprint&&old.gamesPlayed===undefined&&preview.gamesPlayed!==undefined;
  const ok=await commit(b=>applyStatsImport(b,request,randomUUID));if(ok){setPreview(null);setNotice(metadataOnly?'Games played updated; existing stats and game additions kept.':`${mode==='season'?'Season':'Game'} stats saved. Roster updated.`);}else setError('Import was not saved. Check the team message, then try again.');
 }finally{lock.current=false;}}
 const count=preview?.rows.filter(r=>r.playerId&&r.playerId!==REVIEW_PLAYER).length??0;
 const current=mode==='season'?board.seasonImports?.find(s=>s.season===season):board.games.find(g=>g.id===gameId);
 return <>
 <View style={{backgroundColor:palette.navy,borderRadius:10,padding:20,gap:8,borderBottomWidth:3,borderBottomColor:palette.accent}}><Text style={{color:palette.accent,fontSize:11,fontWeight:'800',letterSpacing:1}}>YOUR NUMBERS. YOUR ADVANTAGE.</Text><Text style={{color:'white',fontSize:23,fontWeight:'800'}}>Bring your stats to the dugout.</Text><Text style={{color:'#BCD0DC',fontSize:13,lineHeight:19}}>Choose a CSV, review your players, then save.</Text></View>
 <View style={{flexDirection:'row',gap:8}}>{(['season','game'] as const).map(value=><Pressable key={value} accessibilityRole="tab" accessibilityState={{selected:mode===value}} onPress={()=>setMode(value)} style={{flex:1,minWidth:0,height:52,alignItems:'center',justifyContent:'center',borderRadius:8,borderWidth:1,borderColor:mode===value?palette.navy:palette.line,backgroundColor:mode===value?palette.navy:palette.panel}}><Text style={{fontSize:12,fontWeight:'800',color:mode===value?'white':palette.ink}}>{value==='season'?'SEASON CSV':'GAME CSV'}</Text></Pressable>)}</View>
 <Panel><View style={{padding:18,gap:16,borderTopWidth:3,borderTopColor:palette.accent}}><Field label="Season year" value={season} onChange={setSeason} numeric/>
 {mode==='game'&&<Choice label="Game" value={gameId} options={board.games.map(g=>({value:g.id,label:`${g.label} · ${g.opponent}`}))} onChange={setGameId}/>}
 <Text style={[ui.body,{minHeight:66}]}>{mode==='season'?'Create or match your roster and replace this season’s stats snapshot. Individual game history stays intact.':'Import one game’s stats. New games add to season totals. Re-importing updates that game without adding it twice.'}</Text>
 <Button disabled={!writable||picking||!/^20\d{2}$/.test(season)||(mode==='game'&&!board.games.some(g=>g.id===gameId))} onPress={()=>{void chooseFile();}}>{picking?'READING CSV…':'CHOOSE CSV FILE'}</Button>
 <Button secondary onPress={()=>{void openInAppBrowser('https://web.gc.com/').catch(()=>setError('Could not open GameChanger.'));}}>OPEN GAMECHANGER</Button>
 </View></Panel><StatusMessage text={error} error/><StatusMessage text={notice}/>
 <Section title="Before you import"><Panel><View style={[c.item,{gap:12}]}><Text style={ui.body}>In GameChanger: select your team → Stats → scroll down to Export Stats. Save the CSV to Files, then choose it above.</Text><Text style={c.small}>You must be listed as team staff. For one game, filter the stats before exporting.</Text><Button secondary onPress={()=>{void openInAppBrowser('https://help.gc.com/hc/en-us/articles/360043583651-Exporting-Season-Stats').catch(()=>setError('Could not open the export guide. Please try again.'));}}>HOW TO EXPORT A CSV ↗</Button></View></Panel></Section>
 {current&&<Section title="Current import"><Panel><View style={c.item}><Text style={ui.rowTitle}>{mode==='season'?current.label:board.games.find(g=>g.id===gameId)?.importLabel||'No CSV imported into this game'}</Text><Text style={c.small}>{Object.keys(current.stats).length} player records · {season}</Text></View></Panel></Section>}
 <Text style={c.small}>Independent CSV import. Dugout Pilot is not affiliated with or endorsed by GameChanger. No live sync.</Text>
 <Sheet title={`Review ${mode} import`} open={!!preview} onClose={()=>{if(!busy&&!lock.current)setPreview(null);}}>{preview&&<View pointerEvents={busy?'none':'auto'} style={c.group}>
 <Text style={ui.rowTitle}>{preview.name}</Text><Text style={ui.body}>{season} · {preview.rows.length} players · {preview.columns.length} stat columns{preview.gamesPlayed!==undefined?` · ${preview.gamesPlayed} games`:''}</Text>
 <Text style={c.small}>{mode==='season'?'Replaces all currently tracked season totals. Existing game history stays, marked as already included.':'Replaces imported stats for the selected game. Pitching logs and lineups stay unchanged.'}</Text>
 <Choice label="ERA calculation" value={String(eraInnings)} options={[6,7,9].map(n=>({value:String(n),label:`${n}-inning ERA`}))} onChange={v=>{setEraInnings(Number(v));setConfirmed(false);}}/>
 {mode==='game'&&<><Choice label="Season totals" value={contribution} options={[{value:'add',label:'Add this game to season totals'},{value:'included',label:'Already included in the season CSV'}]} onChange={v=>{setContribution(v as 'add'|'included');setConfirmed(false);}}/><Text style={c.small}>If this game is already part of your season export, choose Already included to prevent double counting.</Text></>}
 <StatusMessage text={error} error/>{preview.warnings.map(w=><Text key={w} style={c.small}>{w}</Text>)}
 {preview.rows.map(row=><View key={row.id} style={[c.item,{gap:10}]}><Text style={ui.rowTitle}>{row.number?`#${row.number} · `:''}{row.name}</Text><Text style={c.small}>{row.matchNote}</Text>
 <Choice label="Roster match" value={row.playerId} disabled={busy} options={[{value:REVIEW_PLAYER,label:'Choose a match'},{value:NEW_PLAYER,label:'Add as new player'},{value:'',label:'Skip this row'},...board.players.map(p=>({value:p.id,label:`${p.number?'#'+p.number+' · ':''}${p.name}`}))]} onChange={playerId=>changeRow(row.id,{playerId})}/>
 <Pressable accessibilityRole="button" onPress={()=>setPositionRow(positionRow===row.id?'':row.id)} style={{paddingVertical:8}}><Text style={ui.rowTitle}>Positions: {row.positions.join(', ')||'Not set'} · Edit</Text></Pressable>
 {positionRow===row.id&&<View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{POSITIONS.map(pos=><Toggle key={pos} label={pos} selected={row.positions.includes(pos)} onPress={()=>changeRow(row.id,{positions:row.positions.includes(pos)?row.positions.filter(p=>p!==pos):[...row.positions,pos]})}/>)}</View>}
 </View>)}
 <Toggle label="Add reviewed positions to existing players (keep their current positions)" selected={mergePositions} onPress={()=>{setMergePositions(!mergePositions);setConfirmed(false);}}/>
 <Text style={c.small}>{count} included · {preview.rows.filter(r=>r.playerId===NEW_PLAYER).length} new · {preview.rows.filter(r=>!r.playerId).length} skipped. Existing names and jersey numbers stay; missing jersey numbers are filled from the CSV.</Text>
 <Toggle label="I reviewed the players, positions, season and replacement above" selected={confirmed} onPress={()=>setConfirmed(!confirmed)}/>
 <Button disabled={!writable||!confirmed||!count||preview.rows.some(r=>r.playerId===REVIEW_PLAYER)} onPress={()=>{void apply();}}>{busy?'SAVING…':'CONFIRM IMPORT'}</Button>
 </View>}</Sheet>
 </>;
}
