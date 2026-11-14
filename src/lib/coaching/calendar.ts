export function dateKey(date: Date): string { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
/** Accept calendar keys and dates saved by the original US text input. */
export function parseCalendarDate(value:string):Date|null {
  const text=value.trim();
  const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const legacy=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if(!iso&&!legacy)return null;
  const [year,month,day]=iso?[+iso[1],+iso[2],+iso[3]]:[+legacy![3],+legacy![1],+legacy![2]];
  const date=new Date(year,month-1,day,12);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}
export function displayDate(value:string):string { return parseCalendarDate(value)?.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})??value; }
export function monthCells(year:number,month:number):(string|null)[] { const start=new Date(year,month,1,12);return [...Array(start.getDay()).fill(null),...Array.from({length:new Date(year,month+1,0).getDate()},(_,i)=>dateKey(new Date(year,month,i+1,12)))]; }
