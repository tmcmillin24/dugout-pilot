import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, palette, type IconName } from './app-ui';
const tabs: { name: string; title: string; icon: IconName }[] = [
  { name:'index',title:'Home',icon:'home' },
  { name:'lineups',title:'Lineups',icon:'ball' },
  { name:'practice',title:'Practice',icon:'clock' },
  { name:'integrations',title:'Imports',icon:'upload' },
  { name:'teams',title:'Teams',icon:'teams' },
];
export default function MainTabs() {
  const insets=useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown:false,sceneStyle:{backgroundColor:palette.canvas},
    tabBarStyle:{backgroundColor:palette.panel,borderTopColor:palette.line,borderTopWidth:1,height:66+Math.max(insets.bottom,10),paddingTop:10,paddingBottom:Math.max(insets.bottom,10)},
    tabBarActiveTintColor:palette.ink,tabBarInactiveTintColor:palette.muted,
    tabBarLabelStyle:{fontSize:10,fontWeight:'800',marginTop:4},tabBarHideOnKeyboard:true,
  }}>
    {tabs.map(tab=><Tabs.Screen key={tab.name} name={tab.name} options={{title:tab.title,tabBarIcon:({color,focused})=><View style={{alignItems:'center',gap:5}}><View style={{width:20,height:3,backgroundColor:focused?palette.accent:'transparent'}}/><Icon name={tab.icon} color={color}/></View>}}/>)}
    <Tabs.Screen name="account" options={{href:null,title:'Account'}}/>
  </Tabs>;
}
