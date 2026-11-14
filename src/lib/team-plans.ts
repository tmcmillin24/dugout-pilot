import type { Team } from './teams';
export type Plan='starter'|'pro'|'elite';
export const PLANS={
 starter:{name:'Starter',price:'$7.99',features:['Roster, batting order and defensive field','3 saved defensive lineups','Last-batter marker and dugout display']},
 pro:{name:'Pro',price:'$14.99',features:['Everything in Starter','10 saved defensive lineups','Defensive innings and pitching logs','Practice planner and season history']},
 elite:{name:'Elite',price:'$24.99',features:['Everything in Pro','Season and game CSV imports','Suggested batting order and pitching plan','Player reports and practice recommendations']},
} as const;
export function teamPlan(team:Team|null,now=Date.now()):Plan|null {
 if(!team)return null;
 if(team.test_access&&team.access_status!=='suspended')return 'elite';
 if(team.access_status==='trial')return team.trial_ends_at&&Date.parse(team.trial_ends_at)>now?'pro':null;
 if(team.access_status!=='active')return null;
 return team.subscription_tier==='elite'?'elite':team.subscription_tier==='pro'||team.subscription_tier==='standard'?'pro':team.subscription_tier==='starter'?'starter':null;
}
export function hasPlan(team:Team|null,required:Plan,now=Date.now()):boolean {
 const current=teamPlan(team,now);return !!current&&(['starter','pro','elite'].indexOf(current)>=['starter','pro','elite'].indexOf(required));
}
export function defenseLimit(team:Team|null){return hasPlan(team,'pro')?10:3;}
