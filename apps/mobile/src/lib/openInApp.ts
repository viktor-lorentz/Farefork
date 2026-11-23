import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { openExternal } from './openExternal';

export type InAppBrowserColors = {
  toolbar: string;
  controls: string;
};

export async function openInApp(url: string, colors: InAppBrowserColors): Promise<boolean> {
  if (Platform.OS === 'web') {
    return openExternal(url);
  }
  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: colors.controls,
      toolbarColor: colors.toolbar,
      dismissButtonStyle: 'close',
      showTitle: true,
      enableBarCollapsing: true,
    });
    return true;
  } catch {
    return openExternal(url);
  }
}
