import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';

/** Let the native scroll view handle momentum and its own indicator, without
 * React state updates on every scroll event. */
export function ScrollRoster({ children, maxHeight = 300 }: { children: ReactNode; maxHeight?:number }) {
  return <ScrollView
    nestedScrollEnabled
    directionalLockEnabled
    showsVerticalScrollIndicator
    indicatorStyle="black"
    decelerationRate="normal"
    style={{ maxHeight }}
  >{children}</ScrollView>;
}
