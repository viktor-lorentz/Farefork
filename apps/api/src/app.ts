import {
  cuisineSchema,
  foodQuotesRequestSchema,
  rideErrorCodes,
  rideQuotesRequestSchema,
} from '@repo/shared';
import { APP_NAME } from '@repo/shared/brand';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { readGeoConfig } from './config';
import {
  createMockGeocoder,
  createPhotonGeocoder,
  type Geocoder,
  UpstreamError,
} from './geo/geocoder';
import {
  createEstimateRouter,
  createOsrmRouter,
  type Router,
  withFallback,
  withRouteCache,
} from './geo/router';
import { type RestaurantSource, sampleRestaurants } from './food/catalog';
import { createOsmRestaurantSource } from './food/osm';
import { createMockDeliveryProviders, type DeliveryProvider } from './food/providers';
import { FoodRequestError, getFoodQuotes } from './food/quoteService';
import { catalogFor } from './memberships/registry';
import { createMockRideProviders } from './rides/providers/mock';
import type { RideProvider } from './rides/providers/types';
import { getRideQuotes, TripRejectedError } from './rides/quoteService';

export type AppDeps = {
  geocoder: Geocoder;
  router: Router;
  rideProviders: readonly RideProvider[];
  deliveryProviders: readonly DeliveryProvider[];
  restaurants: RestaurantSource;
  now?: () => Date;
  log?: boolean;
};

export function defaultDeps(): AppDeps {
  const config = readGeoConfig();
  const upstream = { userAgent: config.userAgent, timeoutMs: config.upstreamTimeoutMs };
  const geocoder =
    config.geocoder === 'mock'
      ? createMockGeocoder()
      : createPhotonGeocoder({ ...upstream, baseUrl: config.photonUrl });
  const estimate = createEstimateRouter();
  const router =
    config.router === 'estimate'
      ? estimate
      : withRouteCache(
          withFallback(createOsrmRouter({ ...upstream, baseUrl: config.osrmUrl }), estimate, () => {
            console.warn('Routing service unavailable, using a straight-line estimate');
          }),
        );
  return {
    geocoder,
    router,
    rideProviders: createMockRideProviders(),
    deliveryProviders: createMockDeliveryProviders(),
    restaurants:
      config.restaurants === 'sample'
        ? sampleRestaurants
        : createOsmRestaurantSource(
            {
              photonUrl: config.photonUrl,
              nominatimUrl: config.nominatimUrl,
              userAgent: config.userAgent,
              timeoutMs: Math.max(config.upstreamTimeoutMs, 8000),
            },
            sampleRestaurants,
          ),
    log: true,
  };
}

const placeSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(120),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(8),
});

const restaurantSearchQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  q: z.string().trim().max(80).optional(),
  cuisine: cuisineSchema.optional(),
});

const restaurantDetailQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

export function createApp(deps: AppDeps = defaultDeps()) {
  const app = new Hono();

  if (deps.log === true) {
    app.use('*', logger());
  }
  app.use('*', cors());

  app.get('/health', (c) => c.json({ ok: true, service: `${APP_NAME} API` }));

  app.get('/v1/memberships', (c) => {
    c.header('Cache-Control', 'public, max-age=300');
    return c.json(catalogFor());
  });

  app.get('/v1/places/search', async (c) => {
    const parsed = placeSearchQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: rideErrorCodes.invalidRequest }, 400);
    }
    const { q, lat, lng, limit } = parsed.data;
    const near =
      lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : undefined;
    try {
      const places = await deps.geocoder.search({ text: q, near, limit });
      c.header('Cache-Control', 'private, max-age=600');
      return c.json({ places });
    } catch (error) {
      if (error instanceof UpstreamError) {
        return c.json(
          { error: rideErrorCodes.geocoderUnavailable, message: 'Address search is unavailable.' },
          502,
        );
      }
      throw error;
    }
  });

  app.post('/v1/rides/quotes', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = rideQuotesRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: rideErrorCodes.invalidRequest }, 400);
    }
    try {
      const response = await getRideQuotes(parsed.data, {
        router: deps.router,
        providers: deps.rideProviders,
        now: deps.now,
      });
      c.header('Cache-Control', 'no-store');
      return c.json(response);
    } catch (error) {
      if (error instanceof TripRejectedError) {
        return c.json({ error: error.code, message: error.message }, 422);
      }
      throw error;
    }
  });

  app.get('/v1/food/restaurants', async (c) => {
    const parsed = restaurantSearchQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: rideErrorCodes.invalidRequest }, 400);
    }
    const { lat, lng, q, cuisine } = parsed.data;
    const restaurants = await deps.restaurants.search({
      near: { latitude: lat, longitude: lng },
      text: q,
      cuisine,
    });
    return c.json({ simulated: true, restaurants });
  });

  app.get('/v1/food/restaurants/:id', async (c) => {
    const parsed = restaurantDetailQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return c.json({ error: rideErrorCodes.invalidRequest }, 400);
    }
    const { lat, lng } = parsed.data;
    const from =
      lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : undefined;
    const restaurant = await deps.restaurants.find(c.req.param('id'), from);
    if (!restaurant) {
      return c.json({ error: 'restaurant_not_found' }, 404);
    }
    return c.json({ simulated: true, restaurant });
  });

  app.post('/v1/food/quotes', async (c) => {
    const body: unknown = await c.req.json().catch(() => null);
    const parsed = foodQuotesRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: rideErrorCodes.invalidRequest }, 400);
    }
    try {
      const response = await getFoodQuotes(parsed.data, {
        providers: deps.deliveryProviders,
        restaurants: deps.restaurants,
        now: deps.now,
      });
      c.header('Cache-Control', 'no-store');
      return c.json(response);
    } catch (error) {
      if (error instanceof FoodRequestError) {
        return c.json({ error: error.code, message: error.message }, error.status);
      }
      throw error;
    }
  });

  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'internal_error' }, 500);
  });

  return app;
}
