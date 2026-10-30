import { dateKey, parseCalendarDate } from './calendar';

/** Early game editors stored a free-text date/time in `time`, before `date` existed. */
export function gameSchedule(game: {date?:string;time?:string}): {date:string;time:string} {
  const explicit=game.date?.trim()??'';
  const time=game.time?.trim()??'';
  const legacy=/^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})(?:\s*(?:·|,|@|at)?\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?|\d{1,2}\s*[AP]M))?$/i.exec(time);
  const legacyDate=legacy?parseCalendarDate(legacy[1]):null;
  const date=parseCalendarDate(explicit);
  if(date)return {date:dateKey(date),time:legacyDate?legacy?.[2]??'':time};
  if(!explicit&&legacyDate)return {date:dateKey(legacyDate),time:legacy?.[2]??''};
  return {date:explicit,time};
}
