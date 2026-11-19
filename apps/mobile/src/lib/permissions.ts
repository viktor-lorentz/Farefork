import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { PermissionState } from '@/stores/preferences';

export async function requestLocationPermission(): Promise<PermissionState> {
  try {
    const response = await Location.requestForegroundPermissionsAsync();
    return response.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}

export const notificationsSupported =
  Platform.OS !== 'web' &&
  !(
    Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );

export async function requestNotificationPermission(): Promise<PermissionState> {
  if (!notificationsSupported) {
    return 'denied';
  }
  try {
    const Notifications = await import('expo-notifications');
    const response = await Notifications.requestPermissionsAsync();
    return response.granted ? 'granted' : 'denied';
  } catch {
    return 'denied';
  }
}
