export function timeParts(value:string):{hour:number;minute:number}{const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);return match?{hour:Number(match[1]),minute:Number(match[2])}:{hour:17,minute:0};}
export function timeValue(hour:number,minute:number):string{return `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;}
export function timeLabel(value:string):string{const {hour,minute}=timeParts(value);return `${hour%12||12}:${String(minute).padStart(2,'0')} ${hour<12?'AM':'PM'}`;}
