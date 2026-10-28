import type { RulesContext } from './rules-context';
import type { PracticePlan } from './practice';
import { randomUUID } from 'expo-crypto';
export const POSITIONS = ['P','C','1B','2B','3B','SS','LF','CF','RF'] as const;
export type Position = typeof POSITIONS[number];
export type Player = {id:string; name:string; number:string; bats:string; throws:string; notes:string; positions?:Position[]};
export type Stat = {pa?:number; ab?:number; h?:number; bb?:number; so?:number; avg?:number; obp?:number; ops?:number; era?:number; ip?:string; pitches?:number};
export type DefensiveLineup = {id:string; name:string; positions:Record<string,string>};
export type Game = {id:string; day:number; label:string; opponent:string; time:string; status:'planned'|'final'; lineup:string[]; lastBatterId?:string; positions:Record<string,string>; defensiveLineupId?:string; defenseTrackingInning?:number; defenseInnings?:Record<string,Record<string,string>>; pitchers:Record<string,{innings:string;pitches:number}>; stats:Record<string,Stat>; importLabel:string; importFingerprint?:string; score:string; notes:string};
export type Board = {name:string; players:Player[]; games:Game[]; activeGameId:string; defensiveLineups:DefensiveLineup[]; practicePlans?:PracticePlan[]; activePracticeId?:string; rulesProfile?:'usssa-11u-2026'|'custom'; eventRules?:string; rulesContext?:RulesContext};
export function newGame(day=1, number=1, previous?:Game):Game { return {id:randomUUID(),day,label:`Game ${number}`,opponent:'Opponent TBD',time:'',status:'planned',lineup:previous ? [...previous.lineup] : [],positions:previous ? {...previous.positions} : {},defensiveLineupId:previous?.defensiveLineupId||'manual',pitchers:{},stats:{},importLabel:'',score:'',notes:''}; }
export function defaultBoard(name = 'Team'):Board { const g=newGame(); return {name,players:[],games:[g],activeGameId:g.id,defensiveLineups:createDefensiveLineups()}; }
export function playerName(board:Board,id:string) { return board.players.find(p=>p.id===id)?.name || 'Unassigned'; }
export function pitchTotals(board:Board, excludeGameId?:string) { const totals:Record<string,{pitches:number;innings:number;games:number}>={}; for(const g of board.games) { if(g.id===excludeGameId) continue; for(const [id,log] of Object.entries(g.pitchers)) { const t=totals[id] ||= {pitches:0,innings:0,games:0}; t.pitches+=Number(log.pitches)||0; const [whole, outs]=String(log.innings||'0').split('.').map(Number); t.innings+=(whole||0)+Math.min(2,outs||0)/3; if(log.pitches || log.innings) t.games++; } } return totals; }

export function createDefensiveLineups(positions:Record<string,string>={}):DefensiveLineup[] { return Array.from({length:10},(_,i)=>({id:`defense-${i+1}`,name:`Lineup ${i+1}`,positions:{...positions}})); }
export function normalizeBoard(board:Board):Board { const seed=board.games.find(g=>g.id===board.activeGameId)?.positions||{};const defaults=createDefensiveLineups(seed);return {...board,defensiveLineups:defaults.map((slot,i)=>({...slot,...board.defensiveLineups?.[i],id:slot.id,positions:{...(board.defensiveLineups?.[i]?.positions||slot.positions)}}))}; }
export function assignPosition(positions:Record<string,string>,pos:string,id:string):Record<string,string> { const next={...positions};for(const key of Object.keys(next))if(next[key]===id&&id)delete next[key];if(id)next[pos]=id;else delete next[pos];return next; }
export function applyDefensiveLineup(game:Game,lineup:DefensiveLineup,players:Player[]):Game { return {...game,positions:Object.fromEntries(Object.entries(lineup.positions).filter(([pos,id])=>POSITIONS.includes(pos as Position)&&players.some(p=>p.id===id))),defensiveLineupId:lineup.id}; }
export function defensiveMode(game:Game,lineups:DefensiveLineup[]):string { const saved=lineups.find(l=>l.id===game.defensiveLineupId);return saved&&POSITIONS.every(pos=>(saved.positions[pos]||'')===(game.positions[pos]||''))?saved.id:'manual'; }

export function fieldInnings(game:Game,playerId:string):number { return Object.values(game.defenseInnings||{}).filter(positions=>Object.values(positions).includes(playerId)).length; }
export function dayFieldInnings(board:Board,day:number,playerId:string):number { return board.games.filter(g=>g.day===day).reduce((sum,g)=>sum+fieldInnings(g,playerId),0); }

export function recordFieldInning(game:Game,inning:number):Game {
 return {...game,defenseTrackingInning:inning,defenseInnings:{...game.defenseInnings,[inning]:{...game.positions}}};
}

export function playersForPosition(players: Player[], position: Position): Player[] { return players.filter(player => player.positions?.includes(position)); }
