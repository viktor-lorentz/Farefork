import type { ProviderId } from '@repo/shared';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { type InAppBrowserColors, openInApp } from './openInApp';

const providerAndroidPackages: Record<ProviderId, string> = {
  uber: 'com.ubercab',
  lyft: 'me.lyft.android',
  waymo: 'com.waymo.carapp',
  ubereats: 'com.ubercab.eats',
  doordash: 'com.dd.doordash',
  grubhub: 'com.grubhub.android',
  postmates: 'com.postmates.android',
};

async function tryUrl(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

function tryLaunchAndroidApp(providerId: ProviderId): boolean {
  try {
    IntentLauncher.openApplication(providerAndroidPackages[providerId]);
    return true;
  } catch {
    return false;
  }
}

export async function openProviderApp(
  providerId: ProviderId,
  webUrl: string,
  appUrl: string | null,
  colors: InAppBrowserColors,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return openInApp(webUrl, colors);
  }
  if (appUrl !== null && (await tryUrl(appUrl))) {
    return true;
  }
  if (Platform.OS === 'android' && tryLaunchAndroidApp(providerId)) {
    return true;
  }
  return openInApp(webUrl, colors);
}
