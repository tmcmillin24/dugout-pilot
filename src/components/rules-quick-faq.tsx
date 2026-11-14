import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Icon, Panel, Section, StatusMessage, palette, ui } from './app-ui';
import { c } from './coaching-ui';
import { type RulesContext } from '@/lib/coaching/rules-context';
import { quickFaq } from '@/lib/coaching/quick-faq';
import { openInAppBrowser } from '@/lib/in-app-browser';
export function RulesQuickFaq({ context, onAsk }: { context: RulesContext; onAsk: (question: string) => void }) {
  const [expanded, setExpanded] = useState(''); const [all, setAll] = useState(false); const [error, setError] = useState('');
  const questions = quickFaq(context);
  return <Section title="Quick rules FAQ"><Text style={c.small}>{context.age || 'Choose division'} · {context.season || 'Choose season'} · Available offline</Text>{!questions.length&&<Text style={ui.body}>No reviewed FAQ is available for this team profile yet. Check the sport, division and season in Team rules.</Text>}<Panel>{questions.slice(0, all ? questions.length : 4).map(({id,question,answer}) => {
    const open = expanded === id;
    return <View key={id}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? '' : id)} style={[c.item,c.row]}><Text style={[ui.rowTitle,c.grow]}>{question}</Text><Icon name={open ? 'close' : 'plus'} size={18} /></Pressable>{open && <View style={{ padding: 18, gap: 12 }}><Text style={ui.body}>{answer.answer}</Text><Text style={c.small}>{answer.reference}</Text>{answer.url && <Pressable accessibilityRole="link" onPress={() => { void openInAppBrowser(answer.url!).catch(() => setError('Could not open the official rulebook.')); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{color:palette.ink,fontWeight:'700'}}>VIEW OFFICIAL SOURCE →</Text></Pressable>}<Button secondary onPress={() => onAsk(question)}>ASK DUGOUT A FOLLOW-UP</Button></View>}</View>;
  })}</Panel>{questions.length > 4 && <Button secondary onPress={() => setAll(value => !value)}>{all ? 'SHOW LESS' : 'MORE QUICK RULES'}</Button>}<StatusMessage text={error} error /></Section>;
}
