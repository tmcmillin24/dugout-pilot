import { Children, type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { columnLayout } from '@/lib/responsive-layout';

/** Explicit widths prevent intrinsic form/list content from enlarging a column. */
export function ResponsiveColumns({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children);
  const { wide, columnWidth } = columnLayout(width, items.length);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ width: '100%', minWidth: 0, flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: 22 }}>
    {items.map((child, index) => <View key={index} style={{ width: width ? columnWidth : '100%', flexGrow: 0, flexShrink: 1, minWidth: 0, maxWidth: '100%', gap: 22 }}>{child}</View>)}
  </View>;
}
