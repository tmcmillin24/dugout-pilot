import { Children, type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { columnLayout } from '@/lib/responsive-layout';

/** Explicit widths prevent intrinsic form/list content from enlarging a column. */
export function ResponsiveColumns({ children, minimum = 350, stretch = false, gap = 22 }: { children: ReactNode; minimum?: number; stretch?: boolean; gap?: number }) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children);
  const { wide, columnWidth } = columnLayout(width, items.length, gap, minimum);
  return <View onLayout={event => { const next = event.nativeEvent.layout.width; if (next > 0) setWidth(next); }} style={{ width: '100%', minWidth: 0, flexDirection: wide ? 'row' : 'column', alignItems: wide && stretch ? 'stretch' : 'flex-start', gap }}>
    {items.map((child, index) => <View key={index} style={{ width: width ? columnWidth : '100%', flexGrow: 0, flexShrink: 1, minWidth: 0, maxWidth: '100%', gap }}>{child}</View>)}
  </View>;
}
