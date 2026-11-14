import type { Board } from '../coaching/board';
import { seasonKey, statsSource, statValue, type StatGroup } from '../coaching/stat-data';
import { playerDevelopment } from '../coaching/player-development';

/** A director shortlist requires established denominators. Early signals remain in player detail only. */
export function organizationDevelopment(board:Board,season=seasonKey(board),group:StatGroup|'all'='all'){
 const source=statsSource(board,season);
 const rows=board.players.map(player=>{
  const stat=source.stats[player.id],report=playerDevelopment(player,stat);
  const priorities=report.priorities.filter(f=>{
   const category=['contact','decisions','impact'].includes(f.key)?'batting':f.key==='command'?'pitching':f.key==='fielding'?'fielding':'running';
   if(group!=='all'&&category!==group)return false;
   if(['contact','decisions'].includes(f.key))return (statValue(stat,'batting','PA')??0)>=20;
   if(f.key==='impact')return (statValue(stat,'batting','AB')??0)>=30;
   if(f.key==='command')return (statValue(stat,'pitching','BF')??0)>=30;
   if(f.key==='fielding')return (statValue(stat,'fielding','TC')??0)>=20;
   if(f.key==='running')return (statValue(stat,'batting','SB')??0)+(statValue(stat,'batting','CS')??0)>=10;
   return false;
  });
  return {player,stat,report,priorities,score:priorities[0]?.score??0};
 });
 const opportunities=rows.filter(r=>r.priorities.length).sort((a,b)=>b.score-a.score||a.player.name.localeCompare(b.player.name)).slice(0,3);
 return {source,rows,opportunities,season};
}
