import { boundarySource } from './boundary-rules';
// Reviewed against MLB 2026 Definitions and 6.01(a), (c), (h).
// General baseball fallback only; USSSA/event exceptions take priority.
export const contactReferences = [
  {
    id: 'mlb-2026-obstruction', title: 'Obstruction: a fielder impeding a runner',
    text: 'Obstruction is a fielder impeding a runner without possessing or legally fielding the ball. Contact is not required. Blocking a runner while waiting for a distant throw can qualify; handling an imminent throw can justify positioning. When a play is being made on the obstructed runner, or the batter-runner is obstructed before first, the ball is dead and that runner receives at least the next base. Otherwise play continues, then the umpire removes the obstruction’s effects; advancing beyond protection risks an out.',
    keywords: ['obstruction', 'obstructed', 'blocking', 'runner', 'basepath'],
    sources: [{ title: 'MLB 2026 · Definitions; 6.01(h) · general baseball fallback', url: boundarySource }],
  },
  {
    id: 'mlb-2026-interference', title: 'Interference: offense, defense, umpire and spectator',
    text: 'Offensive interference means the batting team hindering a fielder’s play. A runner must avoid the protected fielder handling a batted ball; interference with a thrown ball requires intent. Offensive interference generally causes a dead ball and an out, subject to exceptions. Defensive interference hinders a batter hitting a pitch, such as catcher’s glove contact with the swing. Umpire and spectator interference are separate categories. The penalty depends on the type and circumstances; interference is not automatically the same ruling as obstruction.',
    keywords: ['interference', 'interfered', 'fielder', 'catcher', 'spectator'],
    sources: [{ title: 'MLB 2026 · Definitions; 6.01(a), (c), (e), (f) · general baseball fallback', url: boundarySource }],
  },
];
