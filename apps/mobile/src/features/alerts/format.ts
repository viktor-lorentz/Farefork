import { alertStatus, formatUsd, type PriceAlertRow, providers, type Place } from '@repo/shared';

export function relativeTime(iso: string, now: Date): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  const days = Math.round(hours / 24);
  return `${days} d ago`;
}

function providerName(id: string | null): string | null {
  return id !== null && id in providers ? providers[id as keyof typeof providers].name : null;
}

export function alertSubtitle(alert: PriceAlertRow, now: Date): string {
  const target = `Target ${formatUsd(alert.target_cents)}`;
  const status = alertStatus(alert, now);
  if (status === 'triggered' && alert.triggered_price_cents !== null && alert.triggered_at) {
    const name = providerName(alert.triggered_provider_id);
    return `${formatUsd(alert.triggered_price_cents)}${name ? ` on ${name}` : ''}, ${relativeTime(alert.triggered_at, now)} · ${target}`;
  }
  if (status === 'expired') {
    return `${target} · Ended after 7 days`;
  }
  if (status === 'paused') {
    return `${target} · Paused`;
  }
  if (alert.last_checked_at === null || alert.last_price_cents === null) {
    return `${target} · First check within 15 min`;
  }
  const name = providerName(alert.last_provider_id);
  return `${target} · Now ${formatUsd(alert.last_price_cents)}${name ? ` on ${name}` : ''}, checked ${relativeTime(alert.last_checked_at, now)}`;
}

export function alertPlace(place: PriceAlertRow['pickup'], role: 'pickup' | 'dropoff'): Place {
  return {
    id: `alert-${role}:${place.latitude.toFixed(5)},${place.longitude.toFixed(5)}`,
    name: place.name,
    address: '',
    latitude: place.latitude,
    longitude: place.longitude,
  };
}
