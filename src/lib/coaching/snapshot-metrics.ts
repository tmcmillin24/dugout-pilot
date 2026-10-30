import type { Stat } from './board';
import { aggregateStats, statValue, teamSummary } from './stat-data';
export const SNAPSHOT_DEFAULTS=['AVG','OBP','ERA','H','R','BB'];
export function snapshotMetrics(stats:Record<string,Stat>,eraInnings?:number){
 const total=aggregateStats(Object.values(stats),eraInnings),summary=teamSummary(stats,eraInnings);
 return [
 {key:'AVG',label:'Batting average',value:summary.avg},
 {key:'OBP',label:'On-base percentage',value:summary.obp},
 {key:'SLG',label:'Slugging percentage',value:statValue(total,'batting','SLG')},
 {key:'OPS',label:'On-base + slugging',value:statValue(total,'batting','OPS')},
 {key:'ERA',label:'Team ERA',value:summary.era},
 {key:'WHIP',label:'Team WHIP',value:statValue(total,'pitching','WHIP')},
 {key:'H',label:'Hits',value:summary.hits},
 {key:'R',label:'Runs',value:summary.runs},
 {key:'BB',label:'Walks drawn',value:summary.walks},
 {key:'RBI',label:'Runs batted in',value:statValue(total,'batting','RBI')},
 {key:'HR',label:'Home runs',value:statValue(total,'batting','HR')},
 {key:'SB',label:'Stolen bases',value:statValue(total,'batting','SB')},
 {key:'SO',label:'Pitching strikeouts',value:statValue(total,'pitching','SO')},
 {key:'IP',label:'Innings pitched',value:statValue(total,'pitching','IP')},
 {key:'E',label:'Fielding errors',value:statValue(total,'fielding','E')},
 ];
}
