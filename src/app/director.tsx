import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react';
import { AppState, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Loading, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { Choice } from '@/components/coaching-ui';
import { ResponsiveColumns } from '@/components/responsive-columns';
import { listOrganizations, listOrganizationTeams, organizationTeamStats, rotateOrganizationCode, disconnectTeamOrganization, type Organization, type OrganizationTeam } from '@/lib/organizations';
import { organizationDevelopment } from '@/lib/organizations/development';
import type { Board } from '@/lib/coaching/board';
import { availableColumns, formatStat, seasonKey, statValue, teamSummary, type StatGroup } from '@/lib/coaching/stat-data';
import { teamError } from '@/lib/teams';
import { formatPlayerName } from '@/lib/coaching/player-display';

export default function DirectorScreen(){
 const {width}=useWindowDimensions();
 const {id}=useLocalSearchParams<{id:string}>();
 const [org,setOrg]=useState<Organization|null>(null),[teams,setTeams]=useState<OrganizationTeam[]>([]),[selected,setSelected]=useState(''),[board,setBoard]=useState<Board|null>(null);
 const [page,setPage]=useState(0),[more,setMore]=useState(false),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[statsLoading,setStatsLoading]=useState(false),[error,setError]=useState(''),[statsError,setStatsError]=useState('');
 const [statsVersion,setStatsVersion]=useState(0);
 const [season,setSeason]=useState(''),[category,setCategory]=useState<StatGroup|'all'>('all'),[playerId,setPlayerId]=useState('');
 const epoch=useRef(0),lock=useRef(false),screenScroll=useRef<ComponentRef<typeof ScrollView>>(null);
 const refresh=useCallback(async(cancelled:()=>boolean=()=>false)=>{const token=++epoch.current;try{const [owned,rows]=await Promise.all([listOrganizations(),listOrganizationTeams(id,0)]);if(token!==epoch.current||cancelled())return;setOrg(owned.find(o=>o.id===id)??null);setTeams(rows);setPage(0);setMore(rows.length===50);setError('');}catch(e){if(token===epoch.current&&!cancelled()){setOrg(null);setTeams([]);setBoard(null);setError(teamError(e));}}finally{if(token===epoch.current&&!cancelled())setLoading(false);}},[id]);
 // Initial data is applied only after the network request resolves.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{let cancelled=false;void refresh(()=>cancelled);return()=>{cancelled=true;};},[refresh]);
 const loadStats=useCallback(async()=>{if(!selected)return;try{const value=await organizationTeamStats(id,selected);return {value};}catch(e){return {error:teamError(e)};}},[id,selected]);
 useEffect(()=>{let live=true;let request=0;async function load(){const token=++request;const result=await loadStats();if(!live||token!==request)return;if(result){setBoard(result.value??null);setStatsError(result.error??'');}setStatsLoading(false);}void load();const timer=setInterval(()=>{if(AppState.currentState==='active')void load();},30000);const sub=AppState.addEventListener('change',s=>{if(s==='active')void load();});return()=>{live=false;clearInterval(timer);sub.remove();};},[loadStats,statsVersion]);
 async function nextPage(){if(lock.current)return;lock.current=true;setBusy(true);try{const rows=await listOrganizationTeams(id,page+1);setTeams(previous=>[...previous,...rows.filter(t=>!previous.some(p=>p.team_id===t.team_id))]);setPage(page+1);setMore(rows.length===50);}catch(e){setError(teamError(e));}finally{lock.current=false;setBusy(false);}}
 async function rotate(){if(lock.current)return;lock.current=true;setBusy(true);try{const code=await rotateOrganizationCode(id);setOrg(previous=>previous?{...previous,join_code:code}:previous);setError('');}catch(e){setError(teamError(e));}finally{lock.current=false;setBusy(false);}}
 async function disconnect(){if(!selected||lock.current)return;lock.current=true;setBusy(true);try{await disconnectTeamOrganization(selected);setSelected('');setBoard(null);await refresh();}catch(e){setError(teamError(e));}finally{lock.current=false;setBusy(false);}}
 const team=teams.find(t=>t.team_id===selected),report=board?organizationDevelopment(board,season||seasonKey(board),category):null;
 const seasons=board?[...new Set([seasonKey(board),...(board.seasonImports??[]).map(s=>s.season),...board.games.map(g=>g.statsSeason||g.date?.match(/\b\d{4}\b/)?.[0]||'')].filter(Boolean))].sort().reverse():[];
 const player=report?.rows.find(r=>r.player.id===playerId);
 const filtered=teams.filter(t=>`${t.name} ${t.age} ${t.sport}`.toLowerCase().includes(query.toLowerCase()));
 return <Screen title={org?.name??'Director dashboard'} subtitle="Organization development center" back scrollRef={screenScroll} onRefresh={async()=>{await refresh();setStatsVersion(value=>value+1);}}>
  <StatusMessage text={error} error/>{loading?<Loading/>:!org?<Button secondary onPress={()=>{void refresh();}}>Retry dashboard</Button>:<>
  {!selected&&<Panel accent="orange"><View style={[ui.inset,{backgroundColor:palette.navy}]}><Text style={[ui.label,{color:'#B6CFDE'}]}>ORGANIZATION TEAM CODE</Text><Text selectable style={{fontSize:18,fontWeight:'800',letterSpacing:1,color:palette.white}}>{org.join_code.match(/.{1,4}/g)?.join('-')??org.join_code}</Text><Text style={{color:'#B6CFDE',lineHeight:20}}>Coaches enter this code when creating a team or in Team details → Organization.</Text><Button secondary disabled={busy} onPress={()=>{void rotate();}}>Generate replacement code</Button><Text style={{color:'#B6CFDE',fontSize:12}}>Replacing the code keeps connected teams in place.</Text></View></Panel>}
  {!selected&&<Section title={`Connected teams · ${teams.length}${more?'+':''}`}><TextInput accessibilityLabel="Search organization teams" style={ui.input} placeholder="Search team, age group or sport" placeholderTextColor={palette.muted} value={query} onChangeText={setQuery}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{filtered.map(t=><Panel key={t.team_id} style={{width:width>=900?'48.5%':'100%'}} accent={selected===t.team_id?'orange':undefined}><MenuRow icon="teams" title={t.name} description={`${t.age||'Age not set'} · ${t.sport||'Sport not set'} · ${t.player_count} players\n${t.last_import?'Last import '+new Date(t.last_import).toLocaleDateString():'No CSV imported'}`} last onPress={()=>{screenScroll.current?.scrollTo({y:0,animated:false});setSelected(t.team_id);setStatsLoading(true);setBoard(null);setSeason('');setPlayerId('');setStatsError('');}}/></Panel>)}</View>
   {!teams.length&&<Text style={ui.body}>No connected teams yet. Share your organization code with the team owners. Existing CSV data appears as soon as a team connects.</Text>}{!filtered.length&&!!teams.length&&<Text style={ui.body}>No matching teams.</Text>}{more&&<Button secondary disabled={busy} onPress={()=>{void nextPage();}}>Load more teams</Button>}
  </Section>}
  {!!selected&&<Section title={team?.name??'Team development'}><Button secondary onPress={()=>{setSelected('');setBoard(null);setPlayerId('');}}>← All connected teams</Button><StatusMessage text={statsError} error/>{statsLoading&&!board?<Loading/>:statsError?<Button secondary onPress={()=>{setSelected('');}}>Choose team again</Button>:!board?<Text style={ui.body}>This team has not saved its roster or imported stats yet.</Text>:report&&<>
   <ResponsiveColumns minimum={230}><Choice label="Season" value={season||seasonKey(board)} options={seasons.map(s=>({value:s,label:s}))} onChange={value=>{setSeason(value);setPlayerId('');}}/><Choice label="Development area" value={category} options={[{value:'all',label:'All areas'},{value:'batting',label:'Batting'},{value:'pitching',label:'Pitching'},{value:'fielding',label:'Fielding'}]} onChange={value=>setCategory(value as StatGroup|'all')}/></ResponsiveColumns>
   <Text style={ui.body}>{report.source.label} · {report.rows.length} roster players</Text>
   <Totals board={board} season={report.season}/>
   <Section title="Development opportunities"><Text style={ui.body}>Up to three players with established statistical signals in this team. Coaching indicators, not age-group benchmarks or mechanical diagnoses.</Text>
    {report.opportunities.length?report.opportunities.map(row=><Panel key={row.player.id} accent="orange"><MenuRow icon="teams" title={formatPlayerName(row.player.name)} description={`${row.priorities[0].title} · ${row.priorities[0].evidence}`} last onPress={()=>setPlayerId(row.player.id)}/></Panel>):<Panel><View style={ui.inset}><Text style={ui.heading}>No established development flags</Text><Text style={ui.body}>More recorded opportunities may be needed. We do not select a bottom three just to fill the list.</Text></View></Panel>}
   </Section>
   <Choice label="Player detail" value={playerId} options={[{value:'',label:'Choose any player'},...board.players.map(p=>({value:p.id,label:`${p.number?'#'+p.number+' ':''}${formatPlayerName(p.name)}`}))]} onChange={setPlayerId}/>
   {player&&<Panel accent="navy"><View style={ui.inset}><Text style={ui.heading}>{player.player.name}</Text><Text style={ui.body}>{player.report.summary}</Text>{player.report.priorities.map(f=><View key={f.key} style={{gap:6,paddingVertical:10,borderBottomWidth:1,borderColor:palette.line}}><Text style={ui.rowTitle}>{f.title}{f.early?' · Early signal':''}</Text><Text style={ui.body}>{f.evidence}</Text><Text style={ui.body}>{f.drill}</Text><Text style={ui.body}>{f.track}</Text></View>)}{player.report.missing.map(m=><Text key={m} style={ui.body}>{m}</Text>)}
    {(['batting','pitching','fielding'] as const).filter(g=>category==='all'||g===category).map(g=><View key={g} style={{gap:8}}><Text style={ui.label}>{g.toUpperCase()} · IMPORTED STATISTICS</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{availableColumns({p:player.stat??{}},g).map(key=><View key={key} style={{minWidth:90,flexGrow:1,padding:10,backgroundColor:'#ECF3F7',borderRadius:6}}><Text style={ui.label}>{key}</Text><Text style={ui.rowTitle}>{formatStat(statValue(player.stat,g,key),key)}</Text></View>)}</View></View>)}
   </View></Panel>}
  </>}<Button secondary disabled={busy} onPress={()=>{void disconnect();}}>Remove team from organization</Button></Section>}
  </>}
 </Screen>;
}
function Totals({board,season}:{board:Board;season:string}){const report=organizationDevelopment(board,season),t=teamSummary(report.source.stats,report.source.eraInnings);return <Panel><View style={[ui.inset,{flexDirection:'row',flexWrap:'wrap'}]}>{[{label:'AVG',value:formatStat(t.avg,'AVG')},{label:'HITS',value:t.hits??'—'},{label:'RUNS',value:t.runs??'—'},{label:'ERA',value:formatStat(t.era,'ERA')}].map(m=><View key={m.label} style={{flex:1,minWidth:80,gap:6}}><Text style={ui.label}>{m.label}</Text><Text style={ui.heading}>{m.value}</Text></View>)}</View></Panel>;}
