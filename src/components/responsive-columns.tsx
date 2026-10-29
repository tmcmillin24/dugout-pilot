import { Children, type ReactNode, useState } from 'react';
import { View } from 'react-native';

/** Measure available space, including split-screen and modal widths. */
export function ResponsiveColumns({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const wide = width >= 740;
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'stretch', gap: 22 }}>
    {Children.toArray(children).map((child, index) => <View key={index} style={{ flex: wide ? 1 : undefined, minWidth: 0, gap: 22 }}>{child}</View>)}
  </View>;
}
