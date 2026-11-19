import { haversineMeters, type LatLng, type Place } from '@repo/shared';
import { z } from 'zod';
import { cached, TtlCache } from '../lib/ttlCache';

export const MAX_BIAS_DISTANCE_METERS = 200_000;

export type GeocodeQuery = {
  text: string;
  near?: LatLng;
  limit: number;
};

export type Geocoder = {
  search(query: GeocodeQuery): Promise<Place[]>;
};

export class UpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UpstreamError';
  }
}

const photonFeatureSchema = z.object({
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    osm_type: z.string().optional(),
    osm_id: z.number().optional(),
    name: z.string().optional(),
    housenumber: z.string().optional(),
    street: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    countrycode: z.string().optional(),
  }),
});

const photonResponseSchema = z.object({
  features: z.array(z.unknown()),
});

type PhotonFeature = z.infer<typeof photonFeatureSchema>;

function streetLine(properties: PhotonFeature['properties']): string | undefined {
  if (properties.street === undefined) {
    return undefined;
  }
  return properties.housenumber !== undefined
    ? `${properties.housenumber} ${properties.street}`
    : properties.street;
}

export function placeFromPhoton(feature: PhotonFeature): Place | null {
  const { properties } = feature;
  const [longitude, latitude] = feature.geometry.coordinates;
  const street = streetLine(properties);
  const name = properties.name ?? street ?? properties.city;
  if (name === undefined) {
    return null;
  }
  const parts = [street, properties.district ?? undefined, properties.city, properties.state];
  const address = parts
    .filter((part): part is string => part !== undefined && part !== name)
    .filter((part, index, all) => all.indexOf(part) === index)
    .join(', ');
  const id =
    properties.osm_type !== undefined && properties.osm_id !== undefined
      ? `osm:${properties.osm_type}${properties.osm_id}`
      : `pt:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  return { id, name, address, latitude, longitude };
}

function dedupe(places: Place[]): Place[] {
  const seen = new Set<string>();
  return places.filter((place) => {
    const keys = [place.id, `${place.name}|${place.address}`];
    if (keys.some((key) => seen.has(key))) {
      return false;
    }
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

export type PhotonOptions = {
  baseUrl: string;
  userAgent: string;
  timeoutMs: number;
  fetch?: typeof fetch;
};

export function createPhotonGeocoder(options: PhotonOptions): Geocoder {
  const doFetch = options.fetch ?? fetch;
  const cache = new TtlCache<Place[]>(10 * 60 * 1000, 1000);
  return {
    search(query) {
      const near =
        query.near !== undefined
          ? `${query.near.latitude.toFixed(2)},${query.near.longitude.toFixed(2)}`
          : '';
      const key = `${query.text.toLowerCase()}|${near}|${query.limit}`;
      return cached(cache, key, async () => {
        const url = new URL('/api/', options.baseUrl);
        url.searchParams.set('q', query.text);
        url.searchParams.set('limit', String(query.limit + 12));
        url.searchParams.set('lang', 'en');
        if (query.near !== undefined) {
          url.searchParams.set('lat', query.near.latitude.toFixed(4));
          url.searchParams.set('lon', query.near.longitude.toFixed(4));
        }
        let response: Response;
        try {
          response = await doFetch(url, {
            headers: { 'User-Agent': options.userAgent, Accept: 'application/json' },
            signal: AbortSignal.timeout(options.timeoutMs),
          });
        } catch {
          throw new UpstreamError('Geocoder unreachable');
        }
        if (!response.ok) {
          throw new UpstreamError(`Geocoder returned ${response.status}`);
        }
        const body = photonResponseSchema.safeParse(await response.json());
        if (!body.success) {
          throw new UpstreamError('Geocoder sent an unexpected response');
        }
        const places = body.data.features
          .map((raw) => photonFeatureSchema.safeParse(raw))
          .flatMap((parsed) => (parsed.success ? [placeFromPhoton(parsed.data)] : []))
          .filter((place): place is Place => place !== null);
        const near = query.near;
        const local =
          near === undefined
            ? places
            : places.filter((place) => haversineMeters(near, place) <= MAX_BIAS_DISTANCE_METERS);
        return dedupe(local).slice(0, query.limit);
      });
    },
  };
}

const mockPlaces: Place[] = [
  {
    id: 'mock:sfo',
    name: 'San Francisco International Airport',
    address: 'San Francisco, CA',
    latitude: 37.6213,
    longitude: -122.379,
  },
  {
    id: 'mock:ferry',
    name: 'Ferry Building',
    address: '1 Ferry Building, San Francisco, CA',
    latitude: 37.7955,
    longitude: -122.3937,
  },
  {
    id: 'mock:dolores',
    name: 'Mission Dolores Park',
    address: 'Dolores St & 19th St, San Francisco, CA',
    latitude: 37.7596,
    longitude: -122.427,
  },
  {
    id: 'mock:chase',
    name: 'Chase Center',
    address: '1 Warriors Way, San Francisco, CA',
    latitude: 37.768,
    longitude: -122.3877,
  },
  {
    id: 'mock:ggpark',
    name: 'Golden Gate Park',
    address: 'San Francisco, CA',
    latitude: 37.7694,
    longitude: -122.4862,
  },
  {
    id: 'mock:oak',
    name: 'Oakland International Airport',
    address: 'Oakland, CA',
    latitude: 37.7126,
    longitude: -122.2197,
  },
  {
    id: 'mock:lax',
    name: 'Los Angeles International Airport',
    address: 'Los Angeles, CA',
    latitude: 33.9416,
    longitude: -118.4085,
  },
  {
    id: 'mock:santamonica',
    name: 'Santa Monica Pier',
    address: '200 Santa Monica Pier, Santa Monica, CA',
    latitude: 34.0101,
    longitude: -118.4961,
  },
  {
    id: 'mock:phx',
    name: 'Phoenix Sky Harbor International Airport',
    address: 'Phoenix, AZ',
    latitude: 33.4342,
    longitude: -112.0116,
  },
  {
    id: 'mock:tempe',
    name: 'Arizona State University',
    address: 'Tempe, AZ',
    latitude: 33.4242,
    longitude: -111.9281,
  },
  {
    id: 'mock:austin',
    name: 'Texas State Capitol',
    address: '1100 Congress Ave, Austin, TX',
    latitude: 30.2747,
    longitude: -97.7404,
  },
  {
    id: 'mock:zilker',
    name: 'Zilker Park',
    address: '2100 Barton Springs Rd, Austin, TX',
    latitude: 30.267,
    longitude: -97.7729,
  },
  {
    id: 'mock:atl-park',
    name: 'Piedmont Park',
    address: 'Atlanta, GA',
    latitude: 33.7851,
    longitude: -84.3738,
  },
  {
    id: 'mock:atl-mercedes',
    name: 'Mercedes-Benz Stadium',
    address: '1 AMB Dr NW, Atlanta, GA',
    latitude: 33.7554,
    longitude: -84.4008,
  },
  {
    id: 'mock:jfk',
    name: 'John F. Kennedy International Airport',
    address: 'Queens, NY',
    latitude: 40.6413,
    longitude: -73.7781,
  },
  {
    id: 'mock:times',
    name: 'Times Square',
    address: 'Manhattan, NY',
    latitude: 40.758,
    longitude: -73.9855,
  },
];

export function createMockGeocoder(): Geocoder {
  return {
    search(query) {
      const terms = query.text.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = mockPlaces.filter((place) => {
        const haystack = `${place.name} ${place.address}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      });
      const near = query.near;
      const sorted =
        near === undefined
          ? matches
          : [...matches].sort((a, b) => haversineMeters(near, a) - haversineMeters(near, b));
      return Promise.resolve(sorted.slice(0, query.limit));
    },
  };
}
