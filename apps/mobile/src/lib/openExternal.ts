import { Linking, Platform } from 'react-native';

async function tryOpen(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function openExternal(webUrl: string, appUrl: string | null = null): Promise<boolean> {
  if (appUrl !== null && Platform.OS !== 'web' && (await tryOpen(appUrl))) {
    return true;
  }
  return tryOpen(webUrl);
}
