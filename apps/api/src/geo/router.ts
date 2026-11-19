import { encodePolyline, haversineMeters, type LatLng, type Route } from '@repo/shared';
import { z } from 'zod';
import { cached, TtlCache } from '../lib/ttlCache';
import { UpstreamError } from './geocoder';

export type Router = {
  route(from: LatLng, to: LatLng): Promise<Route>;
};

const ROAD_FACTOR = 1.35;
const ESTIMATE_SPEED_METERS_PER_SECOND = 8.5;

export function createEstimateRouter(): Router {
  return {
    route(from, to) {
      const distanceMeters = haversineMeters(from, to) * ROAD_FACTOR;
      return Promise.resolve({
        distanceMeters: Math.round(distanceMeters),
        durationSeconds: Math.round(distanceMeters / ESTIMATE_SPEED_METERS_PER_SECOND),
        polyline: encodePolyline([from, to]),
        source: 'estimate',
      });
    },
  };
}

const osrmResponseSchema = z.object({
  code: z.string(),
  routes: z
    .array(
      z.object({
        distance: z.number().nonnegative(),
        duration: z.number().nonnegative(),
        geometry: z.string(),
      }),
    )
    .optional(),
});

export type OsrmOptions = {
  baseUrl: string;
  userAgent: string;
  timeoutMs: number;
  fetch?: typeof fetch;
};

function coordinate(point: LatLng): string {
  return `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`;
}

export function createOsrmRouter(options: OsrmOptions): Router {
  const doFetch = options.fetch ?? fetch;
  return {
    async route(from, to) {
      const url = new URL(
        `/route/v1/driving/${coordinate(from)};${coordinate(to)}`,
        options.baseUrl,
      );
      url.searchParams.set('overview', 'full');
      url.searchParams.set('geometries', 'polyline6');
      url.searchParams.set('alternatives', 'false');
      url.searchParams.set('steps', 'false');
      let response: Response;
      try {
        response = await doFetch(url, {
          headers: { 'User-Agent': options.userAgent, Accept: 'application/json' },
          signal: AbortSignal.timeout(options.timeoutMs),
        });
      } catch {
        throw new UpstreamError('Router unreachable');
      }
      if (!response.ok) {
        throw new UpstreamError(`Router returned ${response.status}`);
      }
      const body = osrmResponseSchema.safeParse(await response.json());
      const best = body.success && body.data.code === 'Ok' ? body.data.routes?.[0] : undefined;
      if (!best) {
        throw new UpstreamError('Router found no route');
      }
      return {
        distanceMeters: Math.round(best.distance),
        durationSeconds: Math.round(best.duration),
        polyline: best.geometry,
        source: 'osrm',
      };
    },
  };
}

export function withFallback(
  primary: Router,
  fallback: Router,
  onFallback?: (error: unknown) => void,
): Router {
  return {
    async route(from, to) {
      try {
        return await primary.route(from, to);
      } catch (error) {
        onFallback?.(error);
        return fallback.route(from, to);
      }
    },
  };
}

export function withRouteCache(router: Router, ttlMs = 10 * 60 * 1000): Router {
  const cache = new TtlCache<Route>(ttlMs, 500);
  return {
    route(from, to) {
      const key = `${coordinate(from)};${coordinate(to)}`;
      return cached(cache, key, () => router.route(from, to));
    },
  };
}
