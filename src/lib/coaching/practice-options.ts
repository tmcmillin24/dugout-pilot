import type { PracticeSettings } from './practice';
export const priorityLabels:Record<string,string>={hitting:'Hitting',throwing:'Throwing / pitching',infield:'Infield',outfield:'Outfield',running:'Baserunning',catching:'Catching',team:'Team situations'};
export function primaryCategories(focus:PracticeSettings['focus']):string[]{return focus==='defense'?['infield','outfield','team']:focus==='throwing'?['throwing','catching']:focus==='running'?['running']:['hitting'];}
export function additionalPriorities(settings:PracticeSettings):string[]{return [...new Set(settings.priorities??[])].filter(category=>category in priorityLabels&&!primaryCategories(settings.focus).includes(category));}
/** Basic player equipment is assumed; only facility inventory belongs in the form. */
export function simplifyPracticeSetup(settings:PracticeSettings):PracticeSettings{return {...settings,priorities:additionalPriorities(settings),equipment:{nets:settings.equipment?.nets??0,tees:settings.equipment?.tees??0,screens:settings.equipment?.screens??0}};}
