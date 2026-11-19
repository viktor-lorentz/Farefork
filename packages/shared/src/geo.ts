import { z } from 'zod';

export const latLngSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type LatLng = z.infer<typeof latLngSchema>;

export const placeSchema = latLngSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string(),
});

export type Place = z.infer<typeof placeSchema>;

export const placeSearchResponseSchema = z.object({
  places: z.array(placeSchema),
});

export type PlaceSearchResponse = z.infer<typeof placeSearchResponseSchema>;

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

const EARTH_RADIUS_METERS = 6_371_008.8;
const METERS_PER_MILE = 1609.344;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function boundsOf(points: readonly LatLng[]): Bounds | null {
  const first = points[0];
  if (!first) {
    return null;
  }
  const bounds: Bounds = {
    north: first.latitude,
    south: first.latitude,
    east: first.longitude,
    west: first.longitude,
  };
  for (const point of points) {
    bounds.north = Math.max(bounds.north, point.latitude);
    bounds.south = Math.min(bounds.south, point.latitude);
    bounds.east = Math.max(bounds.east, point.longitude);
    bounds.west = Math.min(bounds.west, point.longitude);
  }
  return bounds;
}

export function encodePolyline(points: readonly LatLng[], precision = 6): string {
  const factor = 10 ** precision;
  let output = '';
  let previousLat = 0;
  let previousLng = 0;
  const encodeValue = (value: number) => {
    let shifted = value < 0 ? ~(value << 1) : value << 1;
    let chunk = '';
    while (shifted >= 0x20) {
      chunk += String.fromCharCode((0x20 | (shifted & 0x1f)) + 63);
      shifted >>= 5;
    }
    chunk += String.fromCharCode(shifted + 63);
    return chunk;
  };
  for (const point of points) {
    const lat = Math.round(point.latitude * factor);
    const lng = Math.round(point.longitude * factor);
    output += encodeValue(lat - previousLat) + encodeValue(lng - previousLng);
    previousLat = lat;
    previousLng = lng;
  }
  return output;
}

export function decodePolyline(encoded: string, precision = 6): LatLng[] {
  const factor = 10 ** precision;
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const readValue = (): number | null => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) {
        return null;
      }
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    const dLat = readValue();
    const dLng = readValue();
    if (dLat === null || dLng === null) {
      break;
    }
    lat += dLat;
    lng += dLng;
    points.push({ latitude: lat / factor, longitude: lng / factor });
  }
  return points;
}

export function formatMiles(meters: number): string {
  const miles = meters / METERS_PER_MILE;
  if (miles < 0.1) {
    return '0.1 mi';
  }
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles).toString()} mi`;
}

export function formatMinutes(minutes: number): string {
  const whole = Math.max(1, Math.round(minutes));
  if (whole < 60) {
    return `${whole} min`;
  }
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}
