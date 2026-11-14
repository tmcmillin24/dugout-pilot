import sizes from '../../config/launch-layout.json';
/** Use the shorter side so rotating a full-screen iPad never changes logo size. */
export function launchLogoWidth(width:number,height:number,isPad:boolean) {
  const shortSide=Math.min(width,height);
  return isPad&&shortSide>=600 ? Math.min(sizes.tabletMaxWidth,shortSide*sizes.tabletFraction) : sizes.phoneWidth;
}
