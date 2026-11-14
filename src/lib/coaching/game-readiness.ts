import type {Board,Game} from './board';
import {POSITIONS} from './board';
import {parseCalendarDate} from './calendar';
import {gameSchedule} from './game-schedule';
import {nextTeamEvent} from './team-stats';
export function setupComplete(board:Board){return board.players.length>0&&board.games.some(g=>!!parseCalendarDate(gameSchedule(g).date)&&g.opponent.trim()!==''&&g.opponent!=='Opponent TBD')&&board.games.some(g=>g.lineup.some(id=>board.players.some(p=>p.id===id)));}
export function nextGame(board:Board,now=new Date()):Game|undefined{const event=nextTeamEvent({...board,practicePlans:[]},now);return board.games.find(g=>g.id===event?.id);}
function canonical(value:unknown):unknown{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));return value;}
export function pitchingReviewKey(board:Board,game:Game){return JSON.stringify(canonical({game:game.id,date:gameSchedule(game).date,context:board.rulesContext,pitchers:board.players.filter(p=>p.positions?.includes('P')).map(p=>p.id).sort(),plan:game.pitchingPlan??[],starter:game.positions.P??'',history:board.games.map(g=>({id:g.id,date:gameSchedule(g).date,pitchers:g.pitchers,innings:g.defenseInnings,ip:Object.fromEntries(Object.entries(g.stats).map(([id,s])=>[id,s.pitching?.IP??s.ip??null]))})).sort((a,b)=>a.id.localeCompare(b.id))}));}
export function gameReadiness(board:Board,game:Game){const roster=new Set(board.players.map(p=>p.id));const batters=new Set(game.lineup.filter(id=>roster.has(id)));const missing=POSITIONS.filter(pos=>!roster.has(game.positions[pos]??''));const invalid=game.lineup.some(id=>!roster.has(id))||batters.size!==game.lineup.length;return {batters:batters.size,invalid,missing,pitchingReviewed:!!game.pitchingReviewedAt&&game.pitchingReviewKey===pitchingReviewKey(board,game)};}
