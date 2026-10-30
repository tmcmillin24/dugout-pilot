import { DraggableBattingOrder } from './draggable-batting-order';
import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Panel, StatusMessage, palette, ui } from './app-ui';
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
 const [order,setOrder]=useState(initial),[result,setResult]=useState<ReturnType<typeof suggestBattingOrder>|null>(null),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const scrollRef=useRef<ComponentRef<typeof ScrollView>>(null),offset=useRef(0);const [dragging,setDragging]=useState(false);
 function generate(){if(!hasEliteAccess(active))return;try{const next=suggestBattingOrder({...board,statsSeason:year},order,{});setResult(next);setOrder(next.map(r=>r.id));setError('');}catch(e){setError(e instanceof Error?e.message:'Could not suggest an order.');}}
 return <Sheet title="Elite batting order" open onClose={()=>{if(!saving)close();}} scrollRef={scrollRef} scrollEnabled={!dragging} onScroll={event=>{offset.current=event.nativeEvent.contentOffset.y;}}>
 <Text style={{color:palette.accent,fontSize:11,fontWeight:'800',letterSpacing:1}}>ELITE · YOUR ORDER, YOUR CALL</Text>
 <Choice label="Stats season" value={year} options={years.map(value=>({value,label:value}))} onChange={value=>{setYear(value);setResult(null);}}/>
 <Text style={c.small}>{statsSource(board,year).label}</Text>
 <Text style={ui.body}>Hold and drag to arrange your order. Tap × to sit a player out for this game.</Text>
 <Button disabled={!order.length||saving} onPress={generate}>{result?'REGENERATE SUGGESTION':'GENERATE SUGGESTION'}</Button>
 <View style={c.row}><Text style={[ui.rowTitle,c.grow]}>{result?'SUGGESTED ORDER':'GAME ORDER'} · {order.length}</Text><Text style={c.small}>HOLD TO MOVE</Text></View>
 <DraggableBattingOrder key={order.join(':')} order={order} players={board.players} disabled={saving} onSave={async next=>{setOrder(next);return true;}} onRemove={id=>setOrder(order.filter(p=>p!==id))} scroll={{ref:scrollRef,offset,onDragging:setDragging}}/>
 {board.players.some(p=>!order.includes(p.id))&&<Panel><View style={c.item}><Text style={ui.label}>SITTING OUT · TAP TO ADD BACK</Text>{board.players.filter(p=>!order.includes(p.id)).map(p=><Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Add ${formatPlayerName(p.name)} to order`} disabled={saving} onPress={()=>setOrder([...order,p.id])} style={[c.row,{minHeight:44}]}><Text style={[ui.rowTitle,c.grow]}>{p.number?`#${p.number} · `:''}{formatPlayerName(p.name)}</Text><Text style={{color:palette.accent,fontSize:22}}>+</Text></Pressable>)}</View></Panel>}
 <Text style={c.small}>Suggestions weigh on-base ability, power and strikeout avoidance. Drag to adjust before applying. Your saved order stays unchanged until you apply.</Text><StatusMessage text={error} error/>
 <Button disabled={!order.length||!writable||saving||!hasEliteAccess(active)} onPress={()=>{if(!hasEliteAccess(active))return;setSaving(true);void update(g=>{if(g.lineup.join(':')!==game.lineup.join(':'))throw new Error('The order changed. Close and try again.');return {...g,lineup:order,lastBatterId:order.includes(g.lastBatterId??'')?g.lastBatterId:undefined};}).then(ok=>{setSaving(false);if(ok)close();else setError('Order was not saved. Check the team message.');});}}>APPLY ORDER</Button>
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
 <View style={{padding:16,gap:10,borderRadius:8,borderWidth:1,borderColor:confirmed?palette.line:palette.accent,backgroundColor:confirmed?palette.panel:'#FFF3EA'}}><Text style={{color:palette.accent,fontWeight:'800',fontSize:12}}>{confirmed?'✓ VERIFICATION COMPLETE':'REQUIRED · CHECK BEFORE APPLYING'}</Text><Toggle label="I verified complete recent pitching history, event eligibility and player availability" selected={confirmed} onPress={()=>setConfirmed(!confirmed)}/>{!confirmed&&<Text style={c.small}>Check this box to enable Apply starter. Stats alone cannot confirm pitching eligibility.</Text>}</View><StatusMessage text={error} error/>
 <Button disabled={!writable||saving||!confirmed||!eligible[0]||!hasEliteAccess(active)} onPress={()=>{const id=eligible[0]?.player.id;if(!id||!hasEliteAccess(active))return;setSaving(true);void update(g=>({...g,positions:assignPosition(g.positions,'P',id),defensiveLineupId:'manual'})).then(ok=>{setSaving(false);if(ok)setOpen(false);else setError('Starter was not saved. Check the team message.');});}}>APPLY STARTER</Button>
 </Sheet></>;
}
