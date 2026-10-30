import { Pressable, Text } from 'react-native';
import { palette, ui } from './app-ui';
export function LineupAction({label,onPress,disabled=false,elite=false}:{label:string;onPress:()=>void;disabled?:boolean;elite?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={`${label}${elite?' · Elite access required':''}`} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[{minHeight:60,height:60,paddingHorizontal:5,paddingVertical:6,borderRadius:7,borderWidth:1,borderColor:palette.line,backgroundColor:palette.raised,alignItems:'center',justifyContent:'center'},(pressed||disabled)&&ui.dim]}><Text accessible={elite} accessibilityElementsHidden={!elite} style={{fontSize:8,lineHeight:10,fontWeight:'800',letterSpacing:1,color:palette.accent,marginBottom:1,opacity:elite?1:0}}>ELITE</Text><Text numberOfLines={2} style={{fontSize:12,lineHeight:16,fontWeight:'800',color:palette.ink,textAlign:'center'}}>{label}</Text></Pressable>;
}
