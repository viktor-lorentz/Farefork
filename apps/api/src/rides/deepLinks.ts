import type { LatLng } from '@repo/shared';

export type BookingTarget = {
  pickup: LatLng;
  dropoff: LatLng;
  pickupName?: string;
  dropoffName?: string;
};

function coordinate(value: number): string {
  return value.toFixed(6);
}

function uberWebPlace(point: LatLng, name: string | undefined, fallback: string): string {
  return JSON.stringify({
    addressLine1: name !== undefined && name.length > 0 ? name : fallback,
    latitude: Number(coordinate(point.latitude)),
    longitude: Number(coordinate(point.longitude)),
  });
}

export function uberBookingUrl(target: BookingTarget): string {
  const url = new URL('https://m.uber.com/go/product-selection');
  url.searchParams.set('pickup', uberWebPlace(target.pickup, target.pickupName, 'Pickup'));
  url.searchParams.set('drop[0]', uberWebPlace(target.dropoff, target.dropoffName, 'Destination'));
  return url.toString();
}

export function lyftBookingUrl(target: BookingTarget, rideTypeId: string): string {
  const url = new URL('https://lyft.com/ride');
  url.searchParams.set('id', rideTypeId);
  url.searchParams.set('pickup[latitude]', coordinate(target.pickup.latitude));
  url.searchParams.set('pickup[longitude]', coordinate(target.pickup.longitude));
  url.searchParams.set('destination[latitude]', coordinate(target.dropoff.latitude));
  url.searchParams.set('destination[longitude]', coordinate(target.dropoff.longitude));
  return url.toString();
}

export function waymoBookingUrl(): string {
  return 'https://waymo.com/';
}

export function uberAppUrl(target: BookingTarget): string {
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': coordinate(target.pickup.latitude),
    'pickup[longitude]': coordinate(target.pickup.longitude),
    'dropoff[latitude]': coordinate(target.dropoff.latitude),
    'dropoff[longitude]': coordinate(target.dropoff.longitude),
  });
  if (target.dropoffName !== undefined && target.dropoffName.length > 0) {
    params.set('dropoff[nickname]', target.dropoffName);
  }
  return `uber://?${params.toString()}`;
}

export function lyftAppUrl(target: BookingTarget, rideTypeId: string): string {
  const params = new URLSearchParams({
    id: rideTypeId,
    'pickup[latitude]': coordinate(target.pickup.latitude),
    'pickup[longitude]': coordinate(target.pickup.longitude),
    'destination[latitude]': coordinate(target.dropoff.latitude),
    'destination[longitude]': coordinate(target.dropoff.longitude),
  });
  return `lyft://ridetype?${params.toString()}`;
}
