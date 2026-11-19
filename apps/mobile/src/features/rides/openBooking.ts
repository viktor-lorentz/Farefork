import { providerName, type RideQuote } from '@repo/shared';
import { Linking } from 'react-native';
import { haptics } from '@/lib/haptics';

export async function openBooking(quote: RideQuote): Promise<boolean> {
  haptics.medium();
  try {
    await Linking.openURL(quote.bookingUrl);
    return true;
  } catch {
    haptics.warning();
    return false;
  }
}

export function bookingLabel(quote: RideQuote): string {
  return `Open ${providerName(quote.bookVia)}`;
}
