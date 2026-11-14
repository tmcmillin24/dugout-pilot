import { Pressable, Text } from 'react-native';
import { palette, ui } from './app-ui';

export function ActionLabel({label,badge,color=palette.ink,badgeColor=palette.accent}:{label:string;badge?:string;color?:string;badgeColor?:string}){
 return <>{badge&&<Text numberOfLines={1} style={{position:'absolute',top:5,left:5,right:5,fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:1,color:badgeColor,textAlign:'center'}}>{badge}</Text>}<Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} style={{width:'100%',fontSize:12,lineHeight:16,fontWeight:'800',color,textAlign:'center'}}>{label}</Text></>;
}
export function LineupAction({label,onPress,disabled=false,elite=false}:{label:string;onPress:()=>void;disabled?:boolean;elite?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={`${label}${elite?' · Elite access required':''}`} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[{minHeight:60,height:60,paddingHorizontal:8,borderRadius:7,borderWidth:1,borderColor:palette.line,backgroundColor:palette.raised,alignItems:'center',justifyContent:'center'},(pressed||disabled)&&ui.dim]}><ActionLabel label={label} badge={elite?'ELITE':undefined}/></Pressable>;
}
