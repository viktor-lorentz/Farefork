import { providerName, type RideQuote } from '@repo/shared';
import { Platform } from 'react-native';
import { haptics } from '@/lib/haptics';
import { openExternal } from '@/lib/openExternal';
import { type InAppBrowserColors, openInApp } from '@/lib/openInApp';

export function opensInApp(quote: RideQuote): boolean {
  return quote.bookVia === 'uber';
}

export async function openBooking(quote: RideQuote, colors: InAppBrowserColors): Promise<boolean> {
  haptics.medium();
  const opened = opensInApp(quote)
    ? await openInApp(quote.bookingUrl, colors)
    : await openExternal(quote.bookingUrl, quote.appUrl);
  if (!opened) {
    haptics.warning();
  }
  return opened;
}

export function bookingLabel(quote: RideQuote): string {
  const provider = providerName(quote.bookVia);
  return opensInApp(quote) ? `Book with ${provider}` : `Open ${provider}`;
}

export function bookingHint(quote: RideQuote): string {
  const provider = providerName(quote.bookVia);
  return opensInApp(quote)
    ? `Opens ${provider} checkout inside Farefork with your pickup and destination filled in. You sign in and pay on ${provider}. Price before tip.`
    : `Opens the ${provider} app with your pickup and destination filled in. Price before tip.`;
}

export function canBookHere(quote: RideQuote): boolean {
  return Platform.OS !== 'web' || opensInApp(quote);
}
