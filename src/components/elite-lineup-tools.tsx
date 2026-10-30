import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Button, Panel, StatusMessage, ui } from './app-ui';
import { Choice, Sheet, c } from './coaching-ui';
import { Toggle } from './practice-planner-controls';
import { useTeams } from '@/providers/team-provider';
import type { Board, Game } from '@/lib/coaching/board';
import { statsSource, seasonKey, gameSeason } from '@/lib/coaching/stat-data';
import { assignPosition } from '@/lib/coaching/board';
import { hasEliteAccess, rankPitchers, suggestBattingOrder } from '@/lib/coaching/elite-stats';
import { formatPlayerName } from '@/lib/coaching/player-display';
type Props={renderTrigger?:(open:()=>void,disabled:boolean)=>ReactNode;board:Board;game:Game;writable:boolean;update:(change:(game:Game)=>Game)=>Promise<boolean>};
export function EliteBattingTools(props:Props){const {active}=useTeams();const [open,setOpen]=useState(false);const eligible=hasEliteAccess(active)&&props.board.players.length>0;const launch=()=>{if(eligible&&props.writable)setOpen(true);};return <>{props.renderTrigger?props.renderTrigger(launch,!eligible||!props.writable):<Button secondary disabled={!eligible||!props.writable} onPress={launch}>ELITE · SUGGEST BATTING ORDER</Button>}{!props.renderTrigger&&!eligible&&<Text style={c.small}>Elite access required.</Text>}{open&&eligible&&<BattingEditor {...props} close={()=>setOpen(false)}/>}</>;}

function BattingEditor({board,game,writable,update,close}:Props&{close:()=>void}){
 const [year,setYear]=useState(()=>seasonKey(board));
 const years=[...new Set([seasonKey(board),...(board.seasonImports??[]).map(s=>s.season),...board.games.map(gameSeason).filter(Boolean)])];
 const {active}=useTeams();
 const initial=game.lineup.length?game.lineup:board.players.map(p=>p.id);
 const [attending,setAttending]=useState(initial),[locked,setLocked]=useState<string[]>([]),[result,setResult]=useState<ReturnType<typeof suggestBattingOrder>|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const base=[...initial.filter(id=>attending.includes(id)),...attending.filter(id=>!initial.includes(id))];
 function generate(){if(!hasEliteAccess(active)){setError('Elite access required.');return;}try{setResult(suggestBattingOrder({...board,statsSeason:year},base,Object.fromEntries(locked.map(id=>[id,base.indexOf(id)]))));setError('');}catch(e){setError(e instanceof Error?e.message:'Could not suggest an order.');}}
 return <Sheet title="Elite batting order" open onClose={()=>{if(!saving)close();}}><Choice label="Stats season" value={year} options={years.map(value=>({value,label:value}))} onChange={value=>{setYear(value);setResult(null);}}/><Text style={c.small}>{statsSource(board,year).label}</Text><Text style={ui.body}>Select attending players and lock any slots you want to keep. The suggestion uses on-base ability, power and strikeout avoidance, with small samples pulled toward the team average.</Text><Text style={c.small}>A statistical starting point—not a prediction. Your saved order changes only when you apply it.</Text>
 {board.players.map(p=><View key={p.id} style={{gap:8}}><Toggle label={`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`} selected={attending.includes(p.id)} onPress={()=>{setAttending(attending.includes(p.id)?attending.filter(id=>id!==p.id):[...attending,p.id]);setLocked(locked.filter(id=>id!==p.id));setResult(null);}}/>{attending.includes(p.id)&&<Toggle label={`Keep in slot ${base.indexOf(p.id)+1}`} selected={locked.includes(p.id)} onPress={()=>{setLocked(locked.includes(p.id)?locked.filter(id=>id!==p.id):[...locked,p.id]);setResult(null);}}/>}</View>)}
 <Button disabled={!attending.length||saving} onPress={generate}>GENERATE SUGGESTION</Button><StatusMessage text={error} error/>
 {result&&<><Panel>{result.map((row,index)=>{const p=board.players.find(p=>p.id===row.id)!;return <View key={row.id} style={c.item}><Text style={ui.rowTitle}>{index+1}. {p.number?'#'+p.number+' ':''}{formatPlayerName(p.name)}</Text><Text style={c.small}>{row.reason}</Text><Text style={c.small}>Current: {game.lineup.includes(p.id)?`slot ${game.lineup.indexOf(p.id)+1}`:'Not in order'} · OBP {row.profile.obp?.toFixed(3)??'—'} · SLG {row.profile.slg?.toFixed(3)??'—'}</Text></View>;})}</Panel>
 <Button disabled={!writable||saving||!hasEliteAccess(active)} onPress={()=>{if(!hasEliteAccess(active))return;setSaving(true);void update(g=>{if(g.lineup.join(':')!==game.lineup.join(':'))throw new Error('The order changed. Close and regenerate.');return {...g,lineup:result.map(r=>r.id),lastBatterId:result.some(r=>r.id===g.lastBatterId)?g.lastBatterId:undefined};}).then(ok=>{setSaving(false);if(ok)close();else setError('Suggestion was not saved. Check the team message.');});}}>APPLY ORDER</Button><Text style={c.small}>You can still drag players into any order after applying.</Text></>}
 </Sheet>;
}
export function ElitePitchingTools({board,game,writable,update,renderTrigger}:Props){
 const {active}=useTeams();const [open,setOpen]=useState(false),[available,setAvailable]=useState<string[]>([]),[confirmed,setConfirmed]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const [year,setYear]=useState(()=>seasonKey(board));
 const years=[...new Set([seasonKey(board),...(board.seasonImports??[]).map(s=>s.season),...board.games.map(gameSeason).filter(Boolean)])];
 const pitchers=board.players.filter(p=>p.positions?.includes('P'));const ranked=hasEliteAccess(active)?rankPitchers({...board,statsSeason:year},game,available):[];
 const blocked=(text:string)=>/^(Rest required|Recorded innings|Already used|Set the game date)/.test(text);
 const eligible=ranked.filter(r=>Number.isFinite(r.score)&&!blocked(r.restriction));
 const launch=()=>{if(!hasEliteAccess(active)||!writable||!pitchers.length)return;setAvailable([]);setConfirmed(false);setError('');setOpen(true);};
 return <>{renderTrigger?renderTrigger(launch,!hasEliteAccess(active)||!writable||!pitchers.length):<Button secondary disabled={!hasEliteAccess(active)||!writable||!pitchers.length} onPress={launch}>ELITE · PITCHING PLAN</Button>}<Sheet title="Elite pitching plan" open={open&&hasEliteAccess(active)} onClose={()=>{if(!saving)setOpen(false);}}>
 <Choice label="Stats season" value={year} options={years.map(value=>({value,label:value}))} onChange={value=>{setYear(value);setConfirmed(false);}}/><Text style={c.small}>{statsSource(board,year).label}</Text><Text style={ui.body}>Choose available pitchers. Rankings use strikeouts, walks and WHIP, with innings shown for context. Low-volume and missing data need coach judgment.</Text><Text style={c.small}>Season totals cannot establish rest. Recorded workload checks cover USSSA 2026 baseball 7U–14U only; event exceptions, other teams and undated appearances need coach review.</Text>
 {pitchers.map(p=><Toggle key={p.id} label={`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`} selected={available.includes(p.id)} onPress={()=>{setAvailable(available.includes(p.id)?available.filter(id=>id!==p.id):[...available,p.id]);setConfirmed(false);}}/>)}
 {ranked.map(r=><Panel key={r.player.id}><View style={c.item}><Text style={ui.rowTitle}>{formatPlayerName(r.player.name)} · {r.outs} imported outs</Text><Text style={c.small}>{r.outs<9?'Small pitching sample. ':''}{r.restriction}</Text>{!Number.isFinite(r.score)&&<Text style={c.small}>Not enough IP, strikeout, walk and WHIP data to rank.</Text>}{Number.isFinite(r.score)&&!blocked(r.restriction)&&<Text style={ui.rowTitle}>{eligible[0]?.player.id===r.player.id?'Starter candidate':'Relief candidate'} · Coach approval required</Text>}</View></Panel>)}
 <Toggle label="I verified complete recent pitching history, event eligibility and player availability" selected={confirmed} onPress={()=>setConfirmed(!confirmed)}/><StatusMessage text={error} error/>
 <Button disabled={!writable||saving||!confirmed||!eligible[0]||!hasEliteAccess(active)} onPress={()=>{const id=eligible[0]?.player.id;if(!id||!hasEliteAccess(active))return;setSaving(true);void update(g=>({...g,positions:assignPosition(g.positions,'P',id),defensiveLineupId:'manual'})).then(ok=>{setSaving(false);if(ok)setOpen(false);else setError('Starter was not saved. Check the team message.');});}}>APPLY STARTER</Button>
 </Sheet></>;
}
