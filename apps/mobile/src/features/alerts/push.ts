import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsSupported } from '@/lib/permissions';
import { supabase } from '@/lib/supabase';

export type PushRegistration = 'registered' | 'unsupported' | 'unconfigured' | 'denied' | 'failed';

export const ALERT_CHANNEL_ID = 'price-alerts';

export function easProjectId(): string | null {
  const extra: unknown = Constants.expoConfig?.extra;
  if (typeof extra !== 'object' || extra === null || !('eas' in extra)) {
    return null;
  }
  const eas: unknown = extra.eas;
  if (typeof eas !== 'object' || eas === null || !('projectId' in eas)) {
    return null;
  }
  return typeof eas.projectId === 'string' && eas.projectId.length > 0 ? eas.projectId : null;
}

export async function registerForPushNotifications(): Promise<PushRegistration> {
  if (!notificationsSupported || !supabase) {
    return 'unsupported';
  }
  const projectId = easProjectId();
  if (!projectId) {
    return 'unconfigured';
  }
  try {
    const Notifications = await import('expo-notifications');
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALERT_CHANNEL_ID, {
        name: 'Price alerts',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const permission = await Notifications.getPermissionsAsync();
    const granted = permission.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) {
      return 'denied';
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', {
      push_token: token.data,
      device_platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    return error ? 'failed' : 'registered';
  } catch {
    return 'failed';
  }
}

export async function listenForAlertTaps(open: (url: string) => void): Promise<() => void> {
  if (!notificationsSupported) {
    return () => undefined;
  }
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
  });
  const handle = (data: Record<string, unknown> | undefined) => {
    const url = data?.url;
    if (typeof url === 'string' && url.startsWith('/alerts')) {
      open(url);
    }
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) {
    handle(last.notification.request.content.data);
  }
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handle(response.notification.request.content.data);
  });
  return () => {
    subscription.remove();
  };
}

export async function unregisterPushNotifications(): Promise<void> {
  const projectId = easProjectId();
  if (!notificationsSupported || !supabase || !projectId) {
    return;
  }
  try {
    const Notifications = await import('expo-notifications');
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').delete().eq('token', token.data);
  } catch {
    return;
  }
}
