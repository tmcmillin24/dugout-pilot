import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

/** Use the system's browser surface inside Dugout Pilot, with its own Done button. */
export async function openInAppBrowser(url: string) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') throw new Error('Only secure web links can be opened.');
  return openBrowserAsync(parsed.href, {
    presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
    dismissButtonStyle: 'done',
    toolbarColor: '#082E4B',
    controlsColor: '#FFFFFF',
    showTitle: true,
    enableBarCollapsing: false,
  });
}
