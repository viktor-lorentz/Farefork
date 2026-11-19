import type { Place } from '@repo/shared';
import { z } from 'zod';
import { cached, TtlCache } from '../lib/ttlCache';
import { type Geocoder, UpstreamError } from './geocoder';

const SPACING_MS = 1100;
const MIN_TEXT_LENGTH = 3;
const BIAS_BOX_DEGREES = 0.5;

const nominatimResultSchema = z.object({
  osm_type: z.string().optional(),
  osm_id: z.number().optional(),
  lat: z.string(),
  lon: z.string(),
  name: z.string().optional(),
  display_name: z.string(),
  address: z.record(z.string(), z.string()).optional(),
});

export type NominatimOptions = {
  baseUrl: string;
  userAgent: string;
  timeoutMs: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
};

export function placeFromNominatim(raw: unknown): Place | null {
  const parsed = nominatimResultSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const result = parsed.data;
  const address = result.address ?? {};
  const street =
    address.road !== undefined
      ? [address.house_number, address.road].filter(Boolean).join(' ')
      : undefined;
  const city = address.city ?? address.town ?? address.village;
  const ownName = result.name?.trim();
  const name =
    (ownName !== undefined && ownName.length > 0 ? ownName : undefined) ??
    street ??
    result.display_name.split(',')[0]?.trim();
  if (!name) {
    return null;
  }
  const rest = [street, address.neighbourhood ?? address.suburb, city, address.state]
    .filter((part): part is string => part !== undefined && part !== name)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const id =
    result.osm_type !== undefined && result.osm_id !== undefined
      ? `osm:${result.osm_type.slice(0, 1).toUpperCase()}${result.osm_id}`
      : `pt:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  return { id, name, address: rest, latitude, longitude };
}

export function createNominatimGeocoder(options: NominatimOptions): Geocoder {
  const doFetch = options.fetch ?? fetch;
  const sleep =
    options.sleep ??
    ((ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      }));
  const cache = new TtlCache<Place[]>(10 * 60 * 1000, 1000);
  let queue: Promise<unknown> = Promise.resolve();
  let latest = 0;

  return {
    search(query) {
      const text = query.text.trim();
      if (text.length < MIN_TEXT_LENGTH) {
        return Promise.resolve([]);
      }
      const key = `${text.toLowerCase()}|${query.near?.latitude.toFixed(2) ?? ''},${query.near?.longitude.toFixed(2) ?? ''}|${query.limit}`;
      return cached(cache, key, () => {
        latest += 1;
        const ticket = latest;
        const run = queue.then(async () => {
          if (ticket !== latest) {
            return [];
          }
          const url = new URL('/search', options.baseUrl);
          url.searchParams.set('q', text);
          url.searchParams.set('format', 'jsonv2');
          url.searchParams.set('addressdetails', '1');
          url.searchParams.set('limit', String(Math.min(query.limit, 10)));
          if (query.near) {
            const { latitude, longitude } = query.near;
            url.searchParams.set(
              'viewbox',
              [
                longitude - BIAS_BOX_DEGREES,
                latitude + BIAS_BOX_DEGREES,
                longitude + BIAS_BOX_DEGREES,
                latitude - BIAS_BOX_DEGREES,
              ].join(','),
            );
          }
          const response = await doFetch(url, {
            headers: { 'User-Agent': options.userAgent, Accept: 'application/json' },
            signal: AbortSignal.timeout(options.timeoutMs),
          });
          if (!response.ok) {
            throw new UpstreamError(`Nominatim responded ${response.status}`);
          }
          const body: unknown = await response.json();
          if (!Array.isArray(body)) {
            throw new UpstreamError('Nominatim returned an unexpected response');
          }
          return body.map(placeFromNominatim).filter((place): place is Place => place !== null);
        });
        queue = run.then(
          () => sleep(SPACING_MS),
          () => sleep(SPACING_MS),
        );
        return run;
      });
    },
  };
}

export function withGeocoderFallback(
  primary: Geocoder,
  secondary: Geocoder,
  restMs = 5 * 60 * 1000,
): Geocoder {
  let primaryDownUntil = 0;
  return {
    async search(query) {
      if (Date.now() >= primaryDownUntil) {
        try {
          return await primary.search(query);
        } catch {
          primaryDownUntil = Date.now() + restMs;
        }
      }
      return secondary.search(query);
    },
  };
}
