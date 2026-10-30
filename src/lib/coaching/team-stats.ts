import type { Board, Game, Stat } from './board';
import { dateKey, parseCalendarDate } from './calendar';
export function importedGames(board: Board): Game[] {
  return board.games.filter(g => !!g.importLabel && Object.keys(g.stats).length > 0);
}
export function battingTotals(stats: Stat[]) {
  const batting=stats.filter(s=>['pa','ab','h','bb','so','avg','obp','ops'].some(key=>s[key as keyof Stat]!==undefined));
  const sum = (key: 'ab'|'h'|'bb') => {
    const values = batting.map(s => s[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return values.length && values.length===batting.length ? values.reduce((a,b) => a+b,0) : null;
  };
  const ab=sum('ab'),h=sum('h'),bb=sum('bb');
  // Only calculate AVG when every included batting row contains both counts.
  const complete=batting.length>0&&batting.every(s=>s.ab!==undefined&&s.h!==undefined);
  return {ab,h,bb,avg:complete&&ab ? (h!/ab).toFixed(3).replace(/^0\./,'.') : '—'};
}
export function nextTeamEvent(board: Board, now=new Date()) {
  const today=dateKey(now);
  const events=[...board.games.filter(g=>g.status!=='final'&&g.date).map(g=>({id:g.id,date:g.date!,time:g.time,kind:'game' as const,title:`${g.label} · ${g.opponent}`})),...(board.practicePlans??[]).map(p=>({id:p.id,date:p.date,time:p.settings.start??'',kind:'practice' as const,title:`Practice · ${p.settings.focus}`}))];
  return events.flatMap(e=>{const parsed=parseCalendarDate(e.date);return parsed?[{...e,date:dateKey(parsed)}]:[];}).filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time))[0]??null;
}
