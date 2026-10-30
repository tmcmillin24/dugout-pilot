import { plannerBuild } from './practice-planner.js';
const focusLabel={hitting:'Hitting',throwing:'Throwing & catching',defense:'Team defense',running:'Baserunning'};
// Automatic titles are regenerated for the next session; custom titles stay editable.
function practiceNameDraft(name='',focus='hitting'){
  const automatic=Object.values(focusLabel).map(label=>`${label} practice`.toLowerCase());
  return automatic.includes(name.trim().toLowerCase())||
    /^batting(?: practice)?$/i.test(name.trim())?'':name;
}
function practiceName(name,focus){return name.trim()||`${focusLabel[focus]} practice`}
function formatClock(start,offset){if(!start)return `+${offset}m`;let [h,m]=start.split(':').map(Number);let t=(h*60+m+offset)%(24*60);let hr=Math.floor(t/60);return `${hr%12||12}:${String(t%60).padStart(2,'0')}${hr<12?' am':' pm'}`}

const build=(settings,options)=>plannerBuild(settings,options);
export {build, formatClock, focusLabel, practiceNameDraft, practiceName};
