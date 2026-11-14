import type { PracticeSettings,PracticePlan,Phase } from './practice';
export type Drill={id:string;name:string;category:string;how:string;cue:string;requirements:Record<string,number>;minAge:number;maxAge:number;minPlayers:number;space:string;sports:string[]};
export const categories:string[];
export function resources(s:PracticeSettings):Record<string,number>;
export function availableDrills(s:PracticeSettings,index?:number,stations?:PracticePlan['stations']):Drill[];
export function plannerBuild(s:PracticeSettings,options?:{seed?:number;recent?:string[]}):Omit<PracticePlan,'id'|'name'|'date'>;
export function retime(phases:Phase[]):Phase[];
export function swapStation(plan:PracticePlan,index:number,drillId:string):PracticePlan;
export function changeDuration(plan:PracticePlan,index:number,duration:number):PracticePlan;
export function movePhase(plan:PracticePlan,index:number,direction:number):PracticePlan;
export function regeneratePlan(plan:PracticePlan,seed:number,recent?:string[]):PracticePlan;

export function swapPhaseDrill(plan:PracticePlan,index:number,drillId:string):PracticePlan;
