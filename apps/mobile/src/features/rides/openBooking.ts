import { providerName, type RideQuote } from '@repo/shared';
import { haptics } from '@/lib/haptics';
import { openExternal } from '@/lib/openExternal';

export async function openBooking(quote: RideQuote): Promise<boolean> {
  haptics.medium();
  const opened = await openExternal(quote.bookingUrl, quote.appUrl);
  if (!opened) {
    haptics.warning();
  }
  return opened;
}

export function bookingLabel(quote: RideQuote): string {
  return `Open ${providerName(quote.bookVia)}`;
}
