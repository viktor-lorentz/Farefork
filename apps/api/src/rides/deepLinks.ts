import type { LatLng } from '@repo/shared';

export type BookingTarget = {
  pickup: LatLng;
  dropoff: LatLng;
  pickupName?: string;
  dropoffName?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
};

function coordinate(value: number): string {
  return value.toFixed(6);
}

function present(value: string | undefined): value is string {
  return value !== undefined && value.trim().length > 0;
}

function uberWebPlace(
  point: LatLng,
  name: string | undefined,
  address: string | undefined,
  fallback: string,
): string {
  const title = present(name) ? name : present(address) ? address : fallback;
  return JSON.stringify({
    addressLine1: title,
    ...(present(address) && address !== title ? { addressLine2: address } : {}),
    latitude: Number(coordinate(point.latitude)),
    longitude: Number(coordinate(point.longitude)),
  });
}

export function uberBookingUrl(target: BookingTarget): string {
  const url = new URL('https://m.uber.com/go/product-selection');
  url.searchParams.set(
    'pickup',
    uberWebPlace(target.pickup, target.pickupName, target.pickupAddress, 'Pickup'),
  );
  url.searchParams.set(
    'drop[0]',
    uberWebPlace(target.dropoff, target.dropoffName, target.dropoffAddress, 'Destination'),
  );
  return url.toString();
}

function setLyftPlaces(params: URLSearchParams, target: BookingTarget): void {
  params.set('pickup[latitude]', coordinate(target.pickup.latitude));
  params.set('pickup[longitude]', coordinate(target.pickup.longitude));
  if (present(target.pickupAddress)) {
    params.set('pickup[address]', target.pickupAddress);
  }
  params.set('destination[latitude]', coordinate(target.dropoff.latitude));
  params.set('destination[longitude]', coordinate(target.dropoff.longitude));
  const destination = present(target.dropoffAddress)
    ? present(target.dropoffName) && !target.dropoffAddress.startsWith(target.dropoffName)
      ? `${target.dropoffName}, ${target.dropoffAddress}`
      : target.dropoffAddress
    : target.dropoffName;
  if (present(destination)) {
    params.set('destination[address]', destination);
  }
}

export function lyftBookingUrl(target: BookingTarget, rideTypeId: string): string {
  const url = new URL('https://lyft.com/ride');
  url.searchParams.set('id', rideTypeId);
  setLyftPlaces(url.searchParams, target);
  return url.toString();
}

export function waymoAppUrl(target: BookingTarget): string {
  const params = new URLSearchParams({
    pickup: 'my_location',
    dropoff_latitude: coordinate(target.dropoff.latitude),
    dropoff_longitude: coordinate(target.dropoff.longitude),
  });
  return `https://app.waymo.com/route/trip/create?${params.toString()}`;
}

export function uberAppUrl(target: BookingTarget): string {
  const params = new URLSearchParams({
    action: 'setPickup',
    'pickup[latitude]': coordinate(target.pickup.latitude),
    'pickup[longitude]': coordinate(target.pickup.longitude),
  });
  if (present(target.pickupName)) {
    params.set('pickup[nickname]', target.pickupName);
  }
  if (present(target.pickupAddress)) {
    params.set('pickup[formatted_address]', target.pickupAddress);
  }
  params.set('dropoff[latitude]', coordinate(target.dropoff.latitude));
  params.set('dropoff[longitude]', coordinate(target.dropoff.longitude));
  if (present(target.dropoffName)) {
    params.set('dropoff[nickname]', target.dropoffName);
  }
  if (present(target.dropoffAddress)) {
    params.set('dropoff[formatted_address]', target.dropoffAddress);
  }
  return `uber://?${params.toString()}`;
}

export function lyftAppUrl(target: BookingTarget, rideTypeId: string): string {
  const params = new URLSearchParams({ id: rideTypeId });
  setLyftPlaces(params, target);
  return `lyft://ridetype?${params.toString()}`;
}
