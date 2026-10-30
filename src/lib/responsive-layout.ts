/** Column geometry uses the actual parent width, including iPad window resizing. */
export function columnLayout(width: number, count: number, gap = 22, minimum = 350) {
  const columns = Math.max(1, count);
  const wide = columns > 1 && width >= columns * minimum + (columns - 1) * gap;
  return { wide, columnWidth: wide ? Math.max(0, (width - gap * (columns - 1)) / columns) : Math.max(0, width) };
}
