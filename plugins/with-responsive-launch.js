const { withMod } = require('expo/config-plugins');
const sizes = require('../config/launch-layout.json');
const prefix = 'DP-Launch-';

function applyResponsiveLaunch(document) {
  const view = document.document.scenes[0].scene[0].objects[0].viewController[0].view[0];
  const image = view.subviews[0].imageView.find(item => item.$.id === 'EXPO-SplashScreen');
  if (!image) throw new Error('Responsive launch: Expo splash image was not generated. Check plugin order.');
  const id = image.$.id; const parent = view.$.id;
  const constraint = attributes => ({ $: attributes });
  const tablet = [
    constraint({id:prefix+'TabletPreferred',firstItem:id,firstAttribute:'width',constant:String(sizes.tabletMaxWidth),priority:'999'}),
    constraint({id:prefix+'TabletCap',firstItem:id,firstAttribute:'width',relation:'lessThanOrEqual',constant:String(sizes.tabletMaxWidth)}),
    ...['width','height'].map(axis=>constraint({id:prefix+'Tablet-'+axis,firstItem:id,firstAttribute:'width',relation:'lessThanOrEqual',secondItem:parent,secondAttribute:axis,multiplier:String(sizes.tabletFraction)})),
  ];
  const constraints = view.constraints[0];
  constraints.constraint = constraints.constraint.filter(item=>!item.$.id.startsWith(prefix));
  constraints.constraint.push(
    constraint({id:prefix+'Phone',firstItem:id,firstAttribute:'width',constant:String(sizes.phoneWidth)}),
    constraint({id:prefix+'Square',firstItem:id,firstAttribute:'height',secondItem:id,secondAttribute:'width'}),
    ...tablet,
  );
  // iPhones remain compact in at least one dimension, including landscape.
  view.variation = [
    { $:{key:'default'},mask:[{$:{key:'constraints'},exclude:tablet.map(item=>({$:{reference:item.$.id}}))}] },
    { $:{key:'heightClass=regular-widthClass=regular'},mask:[{$:{key:'constraints'},exclude:[{$:{reference:prefix+'Phone'}}],include:tablet.map(item=>({$:{reference:item.$.id}}))}] },
  ];
  return document;
}
// Register BEFORE expo-splash-screen: mod actions execute in reverse order, so
// Expo supplies the image/centering first and this mod then adds responsive sizing.
module.exports = config => withMod(config, {platform:'ios',mod:'splashScreenStoryboard',action:config=>{
  config.modResults = applyResponsiveLaunch(config.modResults);
  return config;
}});
module.exports.applyResponsiveLaunch = applyResponsiveLaunch;
