export type DrillGuide={id:string;name:string;purpose:string;equipment:string[];setup:string;roles:string;steps:string[];example:string;cue:string;check:string;finish:string;safety:string;suggestedMinutes:number[]};
export function drillGuide(id?:string,name?:string,kind?:string):DrillGuide|null;

export function drillGuideChoices():{id:string;name:string;category:string}[];
