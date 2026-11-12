module.exports = ({ config }) => {
  const preview = process.env.APP_VARIANT === 'preview';
  if (preview) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url !== 'https://rlxscbutvxvsijgtcrbq.supabase.co' || !key) {
      throw new Error('Preview requires Dugout Pilot Supabase URL and publishable key in the Expo preview environment.');
    }
  }
  return {
    ...config,
    name: preview ? 'Dugout Pilot Preview' : config.name,
    scheme: preview ? 'dugoutpilotpreview' : config.scheme,
    ios: {
      ...config.ios,
      bundleIdentifier: preview ? 'com.dugoutpilot.preview' : config.ios.bundleIdentifier,
    },
  };
};
