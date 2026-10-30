import { ResponsiveColumns } from '@/components/responsive-columns';
import { TeamLogo } from '@/components/team-logo';
import { Image } from 'expo-image';
import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Icon, Loading, MenuRow, Panel, Screen, Section, StatusMessage, palette, ui } from '@/components/app-ui';
import { DisplayText } from '@/components/sports-type';
import { useCoaching } from '@/providers/coaching-provider';
import { nextTeamEvent } from '@/lib/coaching/team-stats';
import { timeLabel } from '@/lib/coaching/practice-time';
import { SeasonSnapshot } from '@/components/season-snapshot';
import { useTeams } from '@/providers/team-provider';

export default function HomeScreen() {
  const { active, loading, error, refresh } = useTeams();
  const coaching = useCoaching();
  const board = coaching.board;
  const upcoming = board ? nextTeamEvent(board) : null;
  const upcomingGame=upcoming?.kind==='game'?board?.games.find(g=>g.id===upcoming.id):undefined;
  const upcomingPractice=upcoming?.kind==='practice'?board?.practicePlans?.find(p=>p.id===upcoming.id):undefined;
  const eventDate=upcoming?new Date(upcoming.date+'T12:00:00'):null;
  const [heroWidth, setHeroWidth] = useState(0);
  return <Screen title="Clubhouse" hideTitle onRefresh={async () => { await refresh(); await coaching.reload(); }}>
    <StatusMessage text={error || coaching.error} error />
    {active && upcoming && eventDate && <Pressable accessibilityRole="button" accessibilityLabel={`Open ${upcoming.kind==='game'?'lineups':'practice'}: ${upcoming.title}`} onPress={()=>router.navigate(upcoming.kind==='game'?'/lineups':'/practice')} style={({pressed})=>[s.nextEvent,pressed&&ui.dim]}><View style={s.nextTop}><Text style={s.nextLabel}>UP NEXT · {upcoming.kind.toUpperCase()}</Text><Text style={s.nextGameName}>{upcomingGame?.label??'TEAM SESSION'}</Text></View><View style={{flexDirection:'row',alignItems:'center',gap:12}}><DisplayText style={s.nextOpponent}>{upcomingGame?`VS ${upcomingGame.opponent.toUpperCase()}`:`${upcomingPractice?.settings.focus.toUpperCase()??'TEAM'} PRACTICE`}</DisplayText><Icon name="arrow" color={palette.ink} size={18}/></View><View style={s.nextWhen}><Text style={s.nextDateText}>{eventDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</Text>{!!upcoming.time&&<><View style={s.nextDot}/><Text style={s.nextTime}>{/^([01]\d|2[0-3]):[0-5]\d$/.test(upcoming.time)?timeLabel(upcoming.time):upcoming.time}</Text></>}</View></Pressable>}

    {loading ? <Loading /> : active ? <View>
      <View onLayout={event => setHeroWidth(event.nativeEvent.layout.width)} style={[s.hero, heroWidth >= 700 && { minHeight: 280, padding: 28 }]}> 
        <Image source={require('@/assets/images/defensive-field.svg')} contentFit="contain" transition={0} accessible={false} style={[s.field, heroWidth >= 700 && { width: 420, height: 460, right: -30, bottom: -95 }]} pointerEvents="none" />
        <View style={s.heroTop}><Text style={s.heroKicker}>THE CLUBHOUSE</Text></View>
        <View style={s.heroIdentity}><TeamLogo team={active} size={heroWidth>=700?100:80} fallback="none" /><DisplayText italic style={[s.teamTitle, heroWidth >= 700 && { fontSize: 48, lineHeight: 50, maxWidth: '70%' }]}>{active.name.toUpperCase()}</DisplayText></View>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/lineups')} style={({ pressed }) => [s.heroCta, pressed && ui.dim]}><Text style={s.heroCtaLabel}>OPEN LINEUPS</Text><Icon name="arrow" color={palette.white} size={16} /></Pressable>
      </View>
    </View> : !error ? <View style={s.empty}><Icon name="ball" size={40} color={palette.accent} /><DisplayText italic style={s.emptyTitle}>MAKE IT YOUR DUGOUT.</DisplayText><Text style={s.emptyCopy}>Create your team or join your coaching staff.</Text><Button onPress={() => router.push('/team-create')}>CREATE A TEAM</Button><Button secondary onPress={() => router.push('/team-join')}>JOIN A TEAM</Button></View> : <Button secondary onPress={() => { void refresh(); }}>Try again</Button>}
    {active && <>
      <ResponsiveColumns><Section title="Coach's corner"><Panel>
        <MenuRow icon="teams" title="Coaching staff" description={active.role === 'owner' ? 'Manage team access' : 'Your coaching access'} onPress={() => { if (active.role === 'owner') router.push({ pathname: '/team-coaches', params: { id: active.id } }); else router.navigate('/teams'); }} />
        <MenuRow icon="link" title="Practice" description="Build your next session" onPress={() => router.navigate('/practice')} />
        <MenuRow icon="ball" title="Lineups" description="Set your game-day order" onPress={() => router.navigate('/lineups')} last />
      </Panel></Section>
      <Section title="Team tools"><Panel><MenuRow icon="teams" title="Roster" description="Players & jersey numbers" onPress={() => router.push('/roster')} /><MenuRow icon="shield" title="Rules desk" description="League rules & quick answers" onPress={() => router.push('/rules')} /><MenuRow icon="link" title="Imports" description="Bring in exported game stats" onPress={() => router.navigate('/integrations')} last /></Panel></Section></ResponsiveColumns>
      <SeasonSnapshot board={board} loading={coaching.loading} />
    </>}
  </Screen>;
}
const s = StyleSheet.create({
  nextEvent:{paddingVertical:15,paddingHorizontal:18,gap:10,borderRadius:10,backgroundColor:palette.panel,borderWidth:1,borderColor:'#CAD9E3',borderLeftWidth:4,borderLeftColor:palette.accent,boxShadow:'0px 4px 12px rgba(0,35,55,0.10)'},nextTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},nextLabel:{fontSize:10,fontWeight:'800',letterSpacing:1.1,color:palette.accent},nextGameName:{fontSize:11,fontWeight:'700',color:palette.muted,flexShrink:1,textAlign:'right'},nextOpponent:{flex:1,fontSize:29,lineHeight:32,color:palette.ink},nextWhen:{flexDirection:'row',alignItems:'center',gap:10,flexWrap:'wrap'},nextDateText:{fontSize:12,fontWeight:'700',color:palette.ink},nextTime:{fontSize:12,fontWeight:'600',color:palette.muted},nextDot:{width:3,height:3,borderRadius:2,backgroundColor:palette.accent},

  hero: { backgroundColor: palette.navy, borderRadius: 4, borderBottomWidth: 4, borderBottomColor: palette.accent, padding: 22, minHeight: 240, overflow: 'hidden', justifyContent: 'space-between', gap: 20 }, field: { position: 'absolute', right: -60, bottom: -24, width: 300, height: 329, opacity: 0.65 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }, heroKicker: { color: '#ADC3D2', fontSize: 10, fontWeight: '800', letterSpacing: 2 }, heroIdentity: { flexDirection: 'row', alignItems: 'center', gap: 16 }, teamTitle: { color: palette.white, fontSize: 40, lineHeight: 43, letterSpacing: 0.3, flex: 1 }, heroCta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 14, paddingVertical: 10, minHeight: 44 }, heroCtaLabel: { color: palette.white, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  empty: { gap: 20, backgroundColor: palette.navy, padding: 24, borderBottomWidth: 4, borderBottomColor: palette.accent }, emptyTitle: { color: palette.white, fontSize: 38, lineHeight: 41 }, emptyCopy: { color: '#C5D4DE', fontSize: 14, lineHeight: 22 },
});
