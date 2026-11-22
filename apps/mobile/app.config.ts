import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';
import {
  APP_NAME,
  APP_SCHEME,
  APP_SLUG,
  BUNDLE_IDENTIFIER,
} from '../../packages/shared/src/brand.ts';

const easProjectId = process.env.EAS_PROJECT_ID ?? '61ed259b-e4a5-45ad-8313-5ec10f14d9f0';
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ??
  (existsSync('./google-services.json') ? './google-services.json' : undefined);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_IDENTIFIER,
    config: { usesNonExemptEncryption: false },
  },
  android: {
    package: BUNDLE_IDENTIFIER,
    adaptiveIcon: {
      backgroundColor: '#000000',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon-light.png',
        imageWidth: 112,
        backgroundColor: '#FFFFFF',
        dark: {
          image: './assets/images/splash-icon-dark.png',
          backgroundColor: '#000000',
        },
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: `${APP_NAME} uses your location to set your pickup point and sort nearby deals.`,
      },
    ],
    ['expo-notifications', { color: '#FFD400', defaultChannel: 'price-alerts' }],
  ],
  extra: {
    ...config.extra,
    ...(easProjectId ? { eas: { projectId: easProjectId } } : {}),
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
