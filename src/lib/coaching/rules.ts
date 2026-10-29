import { isDimensionQuestion } from './boundary-rules';
// Adapted from the user-provided Thundercats rules hub. This is an edition-specific reference, not live rule retrieval.
export const rulesSource = 'https://www.usssabaseball.org/images/2026_USSSA_National_By-Laws.pdf';
export const rulesEdition = 'USSSA · 11U · 2026 national rules';
export const rules: { keys: string[]; answer: string; ref: string }[] = [
      {keys:['pitch tomorrow','next day','pitching tomorrow','rest'],answer:'An 11U pitcher may throw up to 3 innings in one day and still pitch the next day. Once the pitcher records an out beyond 3 innings (3⅓ or more), the pitcher must rest the next day. Also rest after 8 innings over 2 days or after pitching on 3 straight days.',ref:'Rules 7.05.B.1 and 7.05.B.4'},
      {keys:['daily pitching','day maximum','innings pitch','pitching limit','maximum pitch'],answer:'For 11U, the one-day maximum is 6 innings and the three-consecutive-day maximum is 8 innings. Each out counts as one-third inning. A pitcher recording no outs is charged no innings.',ref:'Rules 7.05.B.2–5; Chart 7.05.B-1'},
      {keys:['return to pitch','re-enter pitcher','pitch again'],answer:'No. Once a player is removed from the pitching position, that player cannot return to pitch during the same game, even though the player may remain at another defensive position.',ref:'Rule 7.05.A'},
      {keys:['lead off','leadoff','steal','stealing'],answer:'The national by-laws add no special 11U restriction on leading off or stealing, so standard baseball rules apply. The restrictions printed in Rule 11 are specifically for 7U and 8U. Always check the event rules for a local modification.',ref:'Foreword and Rule 11.00'},
      {keys:['bat','drop','usssa stamp','usa bat'],answer:'At 11U, legal choices include a bat permanently marked USSSA 1.15 BPF, BBCOR .50, legal wood from a licensed USSSA manufacturer, or a bat permanently marked with the USA Baseball logo where BBCOR is not required. The national by-laws do not state a drop limit for 11U. Event rules can be stricter.',ref:'Rules 7.01.C and 7.01.D'},
      {keys:['lineup','bat whole','continuous','eh','designated hitter','dh'],answer:'You may use 9; 9 plus a DH; 10 with an EH; 10 with both DH and EH; or a continuous lineup of every present, eligible, uniformed player. Declare the option before the game and keep it all game.',ref:'Rule 7.02.D'},
      {keys:['8 players','eight players','minimum players','short player'],answer:'A team may start or continue with 8 eligible players. The ninth batting position is an out each time it comes up. Later arrivals may be added to the bottom.',ref:'Rules 7.02.G–H'},
      {keys:['mercy','run rule'],answer:'For an 11U six-inning game, the national mercy rule is 15 runs beginning in the 3rd inning or 8 runs beginning in the 4th inning.',ref:'Rule 7.03.B; Chart 7.03.B-1'},
      {keys:['inning','game length','how long'],answer:'A regulation 11U game is 6 innings, but it may be shortened by a time limit, mercy rule, weather, or because the home team has already won. The event sets any approved time limit.',ref:'Rules 7.02.B and 7.03.A'},
      {keys:['field dimensions','base path','mound','pitching distance','fence distance','how far'],answer:'The recommended 11U dimensions are 70-foot base paths and a 50-foot pitching distance. Recommended fence distances are 230 feet at the foul lines and 275 feet to center.',ref:'Rule 7.01.A; Chart 7.01.A-1'},
      {keys:['fake bunt','slash','bunt swing'],answer:'Yes. Feinting or faking a bunt and then swinging is allowed for ages 9 and older under the national by-laws. A tournament may publish a stricter event rule, so confirm it.',ref:'Rule 7.04.F'},
      {keys:['courtesy runner','runner for catcher','runner for pitcher'],answer:'A courtesy runner may be used for the pitcher or catcher of record from the previous defensive inning. Use someone not currently in the lineup; if none is available, use the last batted out, subject to the special first-inning procedure.',ref:'Rule 7.04.B'},
      {keys:['slide','contact','jump over','collision'],answer:'When a tag play is evident, the runner must slide or seek to avoid contact. Malicious contact can result in an out and ejection. A runner who jumps over a defensive player is out whether contact occurs or not.',ref:'Rules 7.04.C–D'},
      {keys:['age','birthday','grade','eligible'],answer:'For 11U, a player who turns 12 before May 1 is ineligible unless in 5th grade. Anyone turning 13 before August 1 is ineligible. An age-eligible 11U player qualifies regardless of grade.',ref:'Rule 3.01 — 11U Division'},
      {keys:['birth certificate','document','paperwork','proof'],answer:'The manager must have a paper or digital copy of each player’s birth certificate available. Grade-exception players also need approved proof of grade. Roster names and dates of birth must exactly match official records.',ref:'Rules 3.01.A–C and 3.03'},
      {keys:['guest player','pickup player'],answer:'From the season start through December 31, teams may use unlimited guest players per event or weekend. From January 1 through season end, the limit is 3. Guest-player classification and roster rules still apply.',ref:'Rules 3.06.H–K'},
      {keys:['protest','appeal call','wrong rule'],answer:'National protests are limited to age, pitching violations, or rule interpretations. Declare the protest to the umpire-in-chief and tournament director before the next pitch. The national fee is $100 cash, returned only if upheld.',ref:'Rules 16.01–16.02'},
      {keys:['balk'],answer:'The 11U national by-laws do not create a balk exception. The no-balk rule is specifically written for 7U and 8U, so standard baseball rules apply at 11U unless the event modifies them.',ref:'Foreword and Rule 11.02'},
      {keys:['dropped third','dropped 3rd','third strike'],answer:'The automatic-out rule on a dropped third strike is specifically for 7U and 8U. At 11U, standard baseball rules apply unless your event publishes a modification.',ref:'Foreword and Rule 11.03'},
      {keys:['cleat','metal spike'],answer:'11U players must wear non-metal cleats. Traditional metal spikes begin at 13U under the national rule.',ref:'Rule 7.01.F'},
      {keys:['helmet','catcher gear','throat guard'],answer:'Batters and runners need double-ear-flap helmets. Catchers need a helmet/mask, built-in or attached throat guard, chest protector, leg guards and protective cup. At 11U, the catcher’s helmet must cover both ears.',ref:'Rules 7.01.G–H'},
      {keys:['concussion','hit in head','head injury'],answer:'Remove anyone with a suspected concussion or significant blow to the head. They may not return to a USSSA field without written medical clearance from a licensed medical doctor.',ref:'Rule 13.01'},
      {keys:['time limit','minutes'],answer:'The national by-laws do not set one universal 11U game time. League, qualifier and state events may use an approved time limit, so use the tournament’s supplemental rules.',ref:'Rule 7.02.B'},
      {keys:['tie breaker','seeding'],answer:'National pool tiebreakers proceed in order and do not return to an earlier step: winning percentage, wins, losses, head-to-head for two teams, average runs allowed, capped average run differential, USSSA points, database entry date, then coin flip.',ref:'Rule 4.11'},
      {keys:['coach visit','mound visit'],answer:'Two coach visits are allowed per inning. The second visit to the same pitcher in that inning requires a pitching change.',ref:'Rule 7.05.C'}
];
export const rulesChart = [
  {
    "topic": "Age eligibility",
    "summary": "A player turning 12 before May 1 is ineligible unless in 5th grade. A player turning 13 before August 1 is ineligible. Age-eligible 11U players qualify regardless of grade.",
    "reference": "3.01"
  },
  {
    "topic": "Documents",
    "summary": "Manager must have a paper or digital copy of each birth certificate. A grade exception also requires an approved school or government document showing grade.",
    "reference": "3.01.A–C"
  },
  {
    "topic": "Roster size",
    "summary": "Maximum 25 players for 4U–14U. Players generally appear on one official online roster and physically play for only one team per day/event/weekend.",
    "reference": "3.05; 3.08.C"
  },
  {
    "topic": "Playing up",
    "summary": "For 4U–14U, a player may participate on a team no more than two years older.",
    "reference": "3.08"
  },
  {
    "topic": "Guest players",
    "summary": "Unlimited from season start through December 31; January 1 onward, maximum 3 per weekend or event. Additional eligibility rules apply.",
    "reference": "3.06"
  },
  {
    "topic": "Field",
    "summary": "70-foot base paths; 50-foot pitching distance. Recommended fences: 230 feet at foul lines and 275 feet to center.",
    "reference": "7.01.A chart"
  },
  {
    "topic": "Bats",
    "summary": "USSSA 1.15 BPF, BBCOR .50, licensed-manufacturer wood, or permanently marked USA Baseball bat where BBCOR is not required. No national 11U drop limit is stated.",
    "reference": "7.01.C–D"
  },
  {
    "topic": "Cleats",
    "summary": "Non-metal cleats only for 4U–12U.",
    "reference": "7.01.F"
  },
  {
    "topic": "Lineup options",
    "summary": "9; 9 + DH; 10 with EH; 10 with DH + EH; or continuous lineup of all present, eligible, uniformed players.",
    "reference": "7.02.D"
  },
  {
    "topic": "Minimum players",
    "summary": "Game may start or continue with 8. The ninth lineup position is an out each time through until another player is added.",
    "reference": "7.02.G–H"
  },
  {
    "topic": "Game length",
    "summary": "6 innings, unless extended, shortened by time limit, mercy rule, weather, or the home team winning before completion.",
    "reference": "7.03.A"
  },
  {
    "topic": "Mercy rule",
    "summary": "15 runs beginning in the 3rd inning; 8 runs beginning in the 4th inning.",
    "reference": "7.03.B chart"
  },
  {
    "topic": "Pitching: next day",
    "summary": "Maximum 3 innings in one day and still eligible to pitch the next day. At 3⅓ innings or more, no pitching the next day.",
    "reference": "7.05.B.1"
  },
  {
    "topic": "Pitching: maximums",
    "summary": "6 innings in one day; 8 innings over 3 consecutive days.",
    "reference": "7.05.B.2–3 chart"
  },
  {
    "topic": "Mandatory rest",
    "summary": "Rest next day after more than 3 innings in a day; 8 innings over 2 consecutive days; or pitching on 3 consecutive days.",
    "reference": "7.05.B.4"
  },
  {
    "topic": "Pitcher re-entry",
    "summary": "Once removed from the pitching position, the player may not return to pitch in that game.",
    "reference": "7.05.A"
  },
  {
    "topic": "Mound visits",
    "summary": "Two coach visits per inning; a second visit to the same pitcher in that inning requires a pitching change.",
    "reference": "7.05.C"
  },
  {
    "topic": "Courtesy runner",
    "summary": "May run for the prior inning’s pitcher and catcher. Use an eligible substitute; if none exists, use the last batted out, with a special first-inning method before an out.",
    "reference": "7.04.B"
  },
  {
    "topic": "Slide / avoid",
    "summary": "On an evident tag play, the runner must slide or seek to avoid contact. Malicious contact overrides obstruction. Jumping over a player is an out.",
    "reference": "7.04.C–D"
  },
  {
    "topic": "Fake bunt",
    "summary": "Showing bunt and then swinging is permitted for ages 9 and older under the national rules.",
    "reference": "7.04.F"
  },
  {
    "topic": "Lead-offs / stealing",
    "summary": "No special 11U restriction appears in the national by-laws; standard MLB rules apply unless event or local rules modify them.",
    "reference": "Foreword; Rule 11 applies only to 7U–8U"
  },
  {
    "topic": "Balks / dropped 3rd",
    "summary": "No special 11U exception appears. Standard MLB rules apply unless the event publishes a modification.",
    "reference": "Foreword; Rule 11 applies only to 7U–8U"
  },
  {
    "topic": "Protests",
    "summary": "Only age, pitching violations, or rule interpretations. Declare before the next pitch. National protest fee is $100 cash and is returned only if upheld.",
    "reference": "16.01–16.02"
  },
  {
    "topic": "Concussion",
    "summary": "Remove a person after a suspected concussion or significant blow to the head. Written medical clearance is required before return to a USSSA field.",
    "reference": "13.01"
  }
];
export function findRule(question: string) {
  const normalized = ' ' + question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
  const ranked = rules.filter(rule => rule.ref !== 'Rule 7.01.A; Chart 7.01.A-1' || isDimensionQuestion(question)).map(rule => ({ ...rule, score: rule.keys.reduce((n,key) => n + (normalized.includes(' '+key.replace(/[^a-z0-9]+/g,' ')+' ') ? key.split(' ').length + 1 : 0), 0) })).sort((a,b) => b.score-a.score);
  return ranked[0]?.score ? ranked[0] : null;
}
