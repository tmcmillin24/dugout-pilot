import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Icon, Panel, Section, StatusMessage, palette, ui } from './app-ui';
import { c } from './coaching-ui';
import { answerRulesQuestion, type RulesContext } from '@/lib/coaching/rules-context';
import { openInAppBrowser } from '@/lib/in-app-browser';
const baseballQuestions = ['Can a pitcher throw tomorrow?', 'What bats are legal?', 'What is obstruction?', 'What is interference?', 'What is the infield fly rule?', 'What if a fair ball bounces over the fence?'];
export function RulesQuickFaq({ context, onAsk }: { context: RulesContext; onAsk: (question: string) => void }) {
  const [expanded, setExpanded] = useState(''); const [all, setAll] = useState(false); const [error, setError] = useState('');
  const questions = context.sport === 'baseball' ? baseballQuestions : baseballQuestions.slice(0,2);
  return <Section title="Quick rules FAQ"><Text style={c.small}>{context.age || 'Choose division'} · {context.season || 'Choose season'} · Saved answers</Text><Panel>{questions.slice(0, all ? questions.length : 4).map(question => {
    const answer = answerRulesQuestion(question, context); const open = expanded === question;
    return <View key={question}><Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? '' : question)} style={[c.item,c.row]}><Text style={[ui.rowTitle,c.grow]}>{question}</Text><Icon name={open ? 'close' : 'plus'} size={18} /></Pressable>{open && <View style={{ padding: 18, gap: 12 }}><Text style={ui.body}>{answer.answer}</Text><Text style={c.small}>{answer.reference}</Text>{answer.url && <Pressable accessibilityRole="link" onPress={() => { void openInAppBrowser(answer.url!).catch(() => setError('Could not open the official rulebook.')); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{color:palette.ink,fontWeight:'700'}}>VIEW OFFICIAL SOURCE →</Text></Pressable>}<Button secondary onPress={() => onAsk(question)}>ASK A FOLLOW-UP</Button></View>}</View>;
  })}</Panel>{questions.length > 4 && <Button secondary onPress={() => setAll(value => !value)}>{all ? 'SHOW LESS' : 'MORE QUICK RULES'}</Button>}<StatusMessage text={error} error /></Section>;
}
