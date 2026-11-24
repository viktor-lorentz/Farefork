import { providerName, type RideQuote } from '@repo/shared';
import { Platform } from 'react-native';
import { haptics } from '@/lib/haptics';
import type { InAppBrowserColors } from '@/lib/openInApp';
import { openProviderApp } from '@/lib/openProviderApp';

export function opensInApp(quote: RideQuote): boolean {
  return quote.bookVia === 'uber';
}

export async function openBooking(quote: RideQuote, colors: InAppBrowserColors): Promise<boolean> {
  haptics.medium();
  const opened = await openProviderApp(quote.bookVia, quote.bookingUrl, quote.appUrl, colors);
  if (!opened) {
    haptics.warning();
  }
  return opened;
}

export function bookingLabel(quote: RideQuote): string {
  return `Open ${providerName(quote.bookVia)}`;
}

export function bookingHint(quote: RideQuote): string {
  const provider = providerName(quote.bookVia);
  return quote.appUrl !== null
    ? `Opens the ${provider} app with your pickup and destination filled in, or the ${provider} site if the app isn't installed. Price before tip.`
    : `Opens the ${provider} app, or the ${provider} site if the app isn't installed. Price before tip.`;
}

export function canBookHere(quote: RideQuote): boolean {
  return Platform.OS !== 'web' || opensInApp(quote);
}
