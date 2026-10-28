import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette, ui } from './app-ui';
import { DisplayText } from './sports-type';
import { useRulesAssistant } from '@/providers/rules-assistant-provider';
import { useCoaching } from '@/providers/coaching-provider';
import { useTeams } from '@/providers/team-provider';
import { answerRulesQuestion, contextLabel, getRulesContext, hasReferencePack, type RulesAnswer } from '@/lib/coaching/rules-context';
export function RulesChat() {
  const assistant = useRulesAssistant(); const { board } = useCoaching(); const { active } = useTeams();
  if (!assistant) return null;
  return <RulesConversation key={`${active?.id ?? 'none'}:${JSON.stringify(getRulesContext(board ?? {}))}`} board={board} assistant={assistant} />;
}
type Assistant = NonNullable<ReturnType<typeof useRulesAssistant>>;
function RulesConversation({ board, assistant }: { board: ReturnType<typeof useCoaching>['board']; assistant: Assistant }) {
  const context = getRulesContext(board ?? {}); const insets = useSafeAreaInsets();
  const question = assistant.prompt; const setQuestion = assistant.setPrompt; const [error, setError] = useState('');
  const [messages, setMessages] = useState<{ question: string; response: RulesAnswer }[]>([]);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  function send(text: string) {
    const q = text.trim(); if (!q || !board) return;
    setMessages(history => [...history.slice(-19), { question: q, response: answerRulesQuestion(q, context) }]); setQuestion(''); setError('');
  }
  function openSource(url: string) { void Linking.openURL(url).catch(() => setError('Could not open the source.')); }
  return <Modal visible={assistant.open} transparent animationType="slide" onRequestClose={assistant.close}>
    <View style={s.scrim}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.drawer, { marginTop: Math.max(insets.top,20) }]}>
      <View accessibilityViewIsModal style={s.inner}>
        <View style={s.handle} /><View style={s.header}><View style={s.avatar}><Icon name="chat" color={palette.white} size={24} /></View><View style={ui.flex}><DisplayText accessibilityRole="header" style={s.title}>RULES ASSISTANT</DisplayText><Text numberOfLines={2} style={s.context}>{board ? contextLabel(context) : 'Choose a team to get started'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close rules assistant" onPress={assistant.close} style={ui.headerButton}><Icon name="close" color={palette.ink} size={20} /></Pressable></View>
        <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled" contentContainerStyle={s.conversation}>
          <View style={s.bot}><Text style={s.message}>{hasReferencePack(context) ? 'What’s the play? Ask about pitching, lineups, runners, or equipment. I’ll point you to the saved rule reference.' : 'Set your sport, age group, and season in Rules Desk. USSSA is the rules authority. I can point you to official sources; answer packs are available only for reviewed profiles.'}</Text><Text style={s.meta}>Saved reference · confirm event-specific rules</Text></View>
          {!messages.length && hasReferencePack(context) && <View style={s.suggestions}>{['What is the daily pitching limit?', 'Can we use a courtesy runner?', 'What bats are legal?'].map(q => <Pressable accessibilityRole="button" key={q} onPress={() => send(q)} style={s.suggestion}><Text style={s.suggestionText}>{q}</Text><Icon name="arrow" color={palette.accent} size={14} /></Pressable>)}</View>}
          {messages.map((m,i) => <View key={i} style={s.exchange}><View style={s.user}><Text style={s.userText}>{m.question}</Text></View><View style={s.bot}><Text style={s.message}>{m.response.answer}</Text>{m.response.url ? <Pressable accessibilityRole="link" onPress={() => openSource(m.response.url!)} style={s.source}><Icon name="link" color={palette.accent} size={15} /><Text style={s.sourceText}>{m.response.reference} ↗</Text></Pressable> : <Text style={s.meta}>{m.response.reference}</Text>}</View></View>)}
          {!!board?.eventRules && <View style={s.notes}><Text style={s.notesLabel}>YOUR EVENT NOTES</Text><Text style={s.message}>{board.eventRules}</Text><Text style={s.meta}>Coach-entered · not an official ruling</Text></View>}
          {!!error && <Text accessibilityLiveRegion="polite" style={ui.error}>{error}</Text>}
        </ScrollView>
        <View style={[s.composerArea, { paddingBottom: Math.max(insets.bottom,14) }]}><View style={s.composer}><TextInput accessibilityLabel="Message the rules assistant" placeholder="Ask about a play…" placeholderTextColor={palette.muted} value={question} onChangeText={setQuestion} multiline maxLength={800} style={s.input} /><Pressable accessibilityRole="button" accessibilityLabel="Send rules question" disabled={!question.trim() || !board} onPress={() => send(question)} style={[s.send, (!question.trim() || !board) && ui.dim]}><Icon name="send" color={palette.white} size={21} /></Pressable></View><Text style={s.footnote}>Reference help, not an umpire’s ruling.</Text></View>
      </View>
    </KeyboardAvoidingView></View>
  </Modal>;
}
const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: '#001426A8', justifyContent: 'flex-end' }, drawer: { flex: 1, width: '100%', maxWidth: 720, maxHeight: '94%', alignSelf: 'center' }, inner: { flex: 1, backgroundColor: palette.canvas, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' }, handle: { width: 34, height: 4, borderRadius: 2, backgroundColor: palette.line, alignSelf: 'center', marginTop: 10 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderBottomColor: palette.line, borderBottomWidth: 1, backgroundColor: palette.panel }, avatar: { width: 44, height: 44, backgroundColor: palette.navy, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, title: { color: palette.ink, fontSize: 26 }, context: { color: palette.muted, fontSize: 11, lineHeight: 16 }, conversation: { padding: 18, gap: 20, paddingBottom: 26 }, bot: { backgroundColor: palette.panel, borderRadius: 14, borderTopLeftRadius: 3, borderWidth: 1, borderColor: palette.line, padding: 16, gap: 12, alignSelf: 'flex-start', maxWidth: '95%' }, message: { color: palette.ink, fontSize: 15, lineHeight: 23 }, meta: { color: palette.muted, fontSize: 10, lineHeight: 16 }, suggestions: { gap: 8 }, suggestion: { borderWidth: 1, borderColor: '#D5DEE5', padding: 14, borderRadius: 10, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 10 }, suggestionText: { color: palette.ink, fontSize: 13, fontWeight: '600', flex: 1 }, exchange: { gap: 12 }, user: { alignSelf: 'flex-end', maxWidth: '85%', padding: 14, borderRadius: 14, borderBottomRightRadius: 3, backgroundColor: palette.navy }, userText: { color: palette.white, fontSize: 15, lineHeight: 22 }, source: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44 }, sourceText: { color: '#A43F14', fontSize: 11, fontWeight: '700', flex: 1, lineHeight: 17 }, notes: { borderLeftWidth: 3, borderColor: palette.accent, padding: 14, gap: 8, backgroundColor: '#FFF4ED' }, notesLabel: { color: '#9A3A12', fontSize: 10, fontWeight: '800', letterSpacing: 1 }, composerArea: { padding: 14, backgroundColor: palette.panel, borderTopWidth: 1, borderColor: palette.line, gap: 8 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 7, backgroundColor: palette.canvas }, input: { flex: 1, color: palette.ink, minHeight: 42, maxHeight: 110, paddingHorizontal: 8, paddingVertical: 10, fontSize: 15 }, send: { width: 42, height: 42, borderRadius: 21, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' }, footnote: { color: palette.muted, fontSize: 10, textAlign: 'center' },
});
