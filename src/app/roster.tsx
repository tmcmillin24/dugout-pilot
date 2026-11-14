import { CoachingScreen } from '@/components/coaching-ui';
import { Roster } from '@/components/roster-manager';
import { useCoaching } from '@/providers/coaching-provider';
export default function RosterScreen() { const { board } = useCoaching(); return <CoachingScreen back title="Roster">{board && <Roster board={board} />}</CoachingScreen>; }
