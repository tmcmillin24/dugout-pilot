import { createContext, useContext, type ReactNode } from 'react';
import { Text, type TextProps } from 'react-native';
export const SportsTypeContext = createContext(false);
export function SportsTypeProvider({ ready, children }: { ready: boolean; children: ReactNode }) { return <SportsTypeContext.Provider value={ready}>{children}</SportsTypeContext.Provider>; }
export function DisplayText({ italic = false, style, ...props }: TextProps & { italic?: boolean }) {
  const ready = useContext(SportsTypeContext);
  return <Text {...props} style={[style, ready ? { fontFamily: italic ? 'DugoutDisplayItalic' : 'DugoutDisplay', fontWeight: '400' } : { fontWeight: '800' }]} />;
}
