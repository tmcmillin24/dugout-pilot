import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

/** Let the native scroll view handle momentum and its own indicator, without
 * React state updates on every scroll event. */
export function ScrollRoster({ children, fill = false }: { children: ReactNode; fill?: boolean }) {
  return <ScrollView
    nestedScrollEnabled
    directionalLockEnabled
    showsVerticalScrollIndicator
    indicatorStyle="black"
    decelerationRate="normal"
    style={fill ? { flexGrow: 1, flexBasis: 0, minHeight: 300 } : { maxHeight: 300 }}
  >{children}</ScrollView>;
}
