const drills={
  hitting:{
    indoor:[
      {name:'Machine reads',where:'Machine cage',how:'Adult operates machine. Track the ball, call the pitch, then take 5 controlled swings. Rotate hitter after each set.'},
      {name:'Front toss / contact',where:'Cage 2',how:'Short front toss into net. Aim hard line drives through the middle; 5 swings, then switch.'},
      {name:'Tee to opposite field',where:'Cage 3',how:'Two tee positions. Load early, stay balanced, and drive 5 balls to the far side of the net.'},
      {name:'Field + run',where:'Turf',how:'Field a rolled grounder, make a short controlled throw, then sprint a 20 ft first-step lane.'}
    ],
    outdoor:[
      {name:'Live contact',where:'Home plate',how:'Coach toss or soft pitch. Five quality swings, then rotate; waiting hitters stay behind the screen.'},
      {name:'Tee + target',where:'Foul territory',how:'Tee swings into net or toward a safe open lane. Hit hard ground balls and line drives.'},
      {name:'Ground ball transfer',where:'Infield',how:'Field through the ball, get feet set, and throw to a target. Reset quickly.'},
      {name:'First-step reads',where:'Outfield edge',how:'React to a coach cue, take a decisive first step, then sprint to a cone.'}
    ]
  },
  throwing:{
    indoor:[
      {name:'Grip + quick transfer',where:'Turf lane A',how:'Partner catch at a safe short distance; four-seam grip, quick feet, throw to chest.'},
      {name:'Receiving and blocks',where:'Turf lane B',how:'Short underhand tosses. Catch in front, frame quietly, and practice controlled blocks.'},
      {name:'Target throws',where:'Open cage',how:'Throw only into a fixed net target with an adult watching; accuracy before speed.'}
    ],
    outdoor:[
      {name:'Partner progression',where:'Outfield',how:'Start close, step behind the throw, and increase distance only while accuracy stays strong.'},
      {name:'Quick transfer',where:'Infield edge',how:'Catch, exchange, shuffle, and throw to a chest-high target.'},
      {name:'Receiving + relay',where:'Cutoff lane',how:'Get behind the ball, turn toward the target, and send an accurate relay.'}
    ]
  },
  defense:{
    indoor:[
      {name:'Ground ball feet',where:'Turf lane A',how:'Coach rolls balls; move around the ball, field out front, and throw into a safe net.'},
      {name:'Short-hop hands',where:'Turf lane B',how:'Partner underhand short hops. Quiet glove, eyes through catch, quick exchange.'},
      {name:'Throwing target',where:'Open cage',how:'Field a rolled ball at cage entrance and throw into net. Keep all throws inside the cage.'}
    ],
    outdoor:[
      {name:'Infield outs',where:'Infield',how:'Coach hits ground balls. Field, set feet, and finish the throw to first.'},
      {name:'Outfield approach',where:'Outfield',how:'Take an angle, field through the ball, and hit the cutoff.'},
      {name:'Force-play footwork',where:'Second-base area',how:'Practice receiving at the bag, finding it with feet, and making a safe turn.'}
    ]
  },
  running:{
    indoor:[
      {name:'Lead + first step',where:'Turf lane A',how:'Use cones as bases. Athletic lead, freeze on line drive, and return or break on cue.'},
      {name:'Turns + touch',where:'Turf lane B',how:'Run through a cone base, then rehearse a compact turn with head up.'},
      {name:'Bat-to-first burst',where:'Open cage / turf edge',how:'Dry swings only; drop the bat safely and accelerate over a short lane.'}
    ],
    outdoor:[
      {name:'Lead + read',where:'First-base line',how:'Lead off, read the pitcher or contact cue, and take an aggressive first step.'},
      {name:'First-to-third turns',where:'Basepaths',how:'Round the bag under control and look to the coach for the next decision.'},
      {name:'Tag-up decisions',where:'Outfield edge',how:'Read catch versus drop, tag on coach cue, and finish through the next base.'}
    ]
  }
};
const focusLabel={hitting:'Hitting',throwing:'Throwing & catching',defense:'Team defense',running:'Baserunning'};
// Automatic titles are regenerated for the next session; custom titles stay editable.
function practiceNameDraft(name='',focus='hitting'){
  const automatic=Object.values(focusLabel).map(label=>`${label} practice`.toLowerCase());
  return automatic.includes(name.trim().toLowerCase())||
    /^batting(?: practice)?$/i.test(name.trim())?'':name;
}
function practiceName(name,focus){return name.trim()||`${focusLabel[focus]} practice`}
function formatClock(start,offset){if(!start)return `+${offset}m`;let [h,m]=start.split(':').map(Number);let t=(h*60+m+offset)%(24*60);let hr=Math.floor(t/60);return `${hr%12||12}:${String(t%60).padStart(2,'0')}${hr<12?' am':' pm'}`}
function availableStations(s){let pool=drills[s.focus][s.environment].map(x=>({...x}));
  if(s.environment==='indoor'){
    const cages=s.cages, turf=s.turf;
    if(s.focus==='hitting'){
      pool=[];
      if(cages>0&&s.machine)pool.push({...drills.hitting.indoor[0]});
      if(cages>0&&!s.machine)pool.push({name:'Tee + barrel control',where:'Cage 1',how:'Five focused tee swings into the net. Switch hitters; everyone else waits behind the line.'});
      if(cages>1)pool.push({...drills.hitting.indoor[1]});
      if(cages>2)pool.push({...drills.hitting.indoor[2]});
      if(turf!=='none')pool.push({...drills.hitting.indoor[3]});
    }else pool=pool.filter(x=>{
      if(x.where==='Machine cage')return cages>0&&s.machine;
      if(x.where==='Cage 2')return cages>(s.machine?1:0);
      if(x.where==='Cage 3')return cages>(s.machine?2:1);
      if(x.where==='Open cage'||x.where==='Open cage / turf edge')return cages>0;
      if(x.where.includes('Turf'))return turf!=='none';
      return true;
    });
    if(s.focus!=='hitting')pool=pool.map(x=>x.where==='Open cage'||x.where==='Open cage / turf edge'?{...x,where:s.machine?'Cage 1 (machine off)':'Cage 1'}:x);
    if(s.focus==='hitting'&&turf==='half')pool=pool.map(x=>x.where==='Turf'?{...x,how:'Short ground-ball rolls into a net, then a 10 ft first-step burst. Keep lanes clear.'}:x);
    if(turf==='half'&&s.focus!=='hitting')pool=pool.filter(x=>x.where!=='Turf lane B');
    if(turf==='none'&&cages===0)pool=[{name:'Small-space fundamentals',where:'Available safe space',how:'Stay together for dry reps, grip, footwork, and short partner work with no live balls.'}];
    if(s.focus==='hitting'&&cages===0&&turf!=='none')pool=[{name:'Dry swing + balance',where:'Turf',how:'No live balls. Rehearse load, stride, and finish, then move through a short footwork lane.'},{name:'Ground ball + sprint',where:'Turf',how:'Coach rolls short grounders; field cleanly and accelerate to a cone.'}];
  } else {
    if(s.field==='infield')pool=pool.filter(x=>!x.where.includes('Outfield')&&!x.where.includes('Cutoff'));
    if(s.field==='small')pool=pool.slice(0,2).map((x,i)=>({...x,where:`Short lane ${['A','B'][i]}`,how:x.how.replace(/increase distance only while accuracy stays strong|increase distance/gi,'stay at a short distance')}));
  }
  return pool.slice(0,Math.min(s.coaches,s.minutes<=60?3:4,Math.max(1,Math.floor(s.players/2))));
}
function build(s){const stations=availableStations(s), groups=stations.length, total=s.minutes;
  const warm=total<=45?6:total<=60?7:8, intro=total<=45?4:total<=60?5:7, wrap=total<=60?3:5;
  const team=Math.max(10,Math.round((total-warm-intro-wrap)*(s.focus==='defense'?.34:.29)));
  const stationTime=total-warm-intro-wrap-team;
  let phases=[];const add=(title,duration,detail,extra={})=>phases.push({title,duration,detail,...extra});
  add('Warm-up + bands',warm,s.environment==='indoor'?(s.turf==='none'?'5 minutes of band work and movement in an available safe area; skip live throws until space is clear.':'5 minutes of band work and dynamic movement on the turf; finish with short partner catches if safe space allows.'):'5 minutes of bands and dynamic movement, then short partner catch.');
  add('Explain the skill + groups',intro,`Show one ${focusLabel[s.focus].toLowerCase()} cue, name the station leaders, and split into ${groups} ${groups===1?'group':'balanced groups'}.`);
  if(groups===1){
    const a=Math.ceil(stationTime/2),b=stationTime-a;
    add(stations[0].name,a,stations[0].how,{where:stations[0].where,stationIndex:0});
    add(s.focus==='hitting'?'Second round · quality swings':s.focus==='running'?'Second round · game reads':'Second round · game speed',b,`Keep one coached group. Repeat with a new cue or add a controlled decision. ${stations[0].how}`,{where:stations[0].where,stationIndex:0});
  } else {
    let used=0;
    for(let i=0;i<groups;i++){
      let duration=i===groups-1?stationTime-used:Math.floor(stationTime/groups);used+=duration;
      add(`Station rotation ${i+1} of ${groups}`,duration,`Use the rotation board below for each group’s station. Allow about 1 minute to move at the horn; use the remaining time for reps.`,{rotation:i,stations});
    }
  }
  let teamDetail={
    hitting:s.environment==='indoor'?'Situational at-bats: coach calls runner/outs, hitter states the plan, takes a controlled toss in a cage, and team on turf reads the ball and runs the play.':'Situational at-bats: call inning, outs, and runners; hitter chooses an approach while fielders play a live ball.',
    throwing:s.environment==='indoor'?'Relay decision game on turf: short throws only, teammates call the target before receiving; use a net for the finish.':'Relay race with decisions: field, call the cutoff, and throw to the correct base.',
    defense:s.environment==='indoor'?'Team defense walk-through on the available turf: use cones as bases, roll one ball, call first play and backup. Short tosses only.':'Team defense: rotate positions, call the situation before each batted ball, then execute first play and backup.',
    running:s.environment==='indoor'?'Game reads with cone bases on turf: coach calls ball in air, ground ball, or passed ball; players choose hold, return, or advance.':'Live baserunning reads: set outs and runners, put a ball in play, and coach the decision at each base.'
  }[s.focus];
  if(s.environment==='indoor'&&s.turf==='none')teamDetail='Dry team walk-through in available safe space: use imaginary bases and game situation calls. No live throws or swings.';
  if(s.environment==='outdoor'&&s.field==='small')teamDetail='Small-area game reads with cone bases; use short rolled balls and controlled throws only.';
  add('Team work · game situation',team,teamDetail);
  add('Reset + one takeaway',wrap,'Each player shares one useful cue. Collect balls, count equipment, and preview the next practice.');
  let offset=0;phases.forEach(p=>{p.start=offset;offset+=p.duration;p.end=offset});
  let sizes=Array.from({length:groups},(_,i)=>Math.floor(s.players/groups)+(i<s.players%groups?1:0));
  return {settings:s,stations,phases,sizes,created:new Date().toISOString()};
}

export {build, formatClock, focusLabel, practiceNameDraft, practiceName};
