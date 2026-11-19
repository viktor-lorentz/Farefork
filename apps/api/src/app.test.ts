import {
  membershipCatalogSchema,
  placeSearchResponseSchema,
  rideQuotesResponseSchema,
} from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { UpstreamError } from './geo/geocoder';
import { places, testDeps } from './testDeps';

function postQuotes(app: ReturnType<typeof createApp>, body: unknown) {
  return app.request('/v1/rides/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('api', () => {
  const app = createApp(testDeps());

  it('reports health', async () => {
    const response = await app.request('/health');
    expect(response.status).toBe(200);
  });

  it('serves a valid membership catalog', async () => {
    const response = await app.request('/v1/memberships');
    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    expect(membershipCatalogSchema.safeParse(body).success).toBe(true);
  });

  it('returns JSON for unknown routes', async () => {
    const response = await app.request('/nope');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'not_found' });
  });
});

describe('GET /v1/places/search', () => {
  const app = createApp(testDeps());

  it('returns places sorted by distance from the bias point', async () => {
    const response = await app.request('/v1/places/search?q=airport&lat=37.77&lng=-122.42');
    expect(response.status).toBe(200);
    const body = placeSearchResponseSchema.parse(await response.json());
    expect(body.places[0]?.name).toBe('San Francisco International Airport');
    expect(body.places.length).toBeGreaterThan(2);
  });

  it('rejects a query that is too short', async () => {
    const response = await app.request('/v1/places/search?q=a');
    expect(response.status).toBe(400);
  });

  it('maps upstream failures to 502', async () => {
    const failing = createApp(
      testDeps({
        geocoder: { search: () => Promise.reject(new UpstreamError('down')) },
      }),
    );
    const response = await failing.request('/v1/places/search?q=ferry');
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ error: 'geocoder_unavailable' });
  });
});

describe('POST /v1/rides/quotes', () => {
  const app = createApp(testDeps());

  it('returns simulated quotes from every provider in San Francisco', async () => {
    const response = await postQuotes(app, {
      pickup: places.ferryBuilding,
      dropoff: places.doloresPark,
      dropoffName: 'Mission Dolores Park',
    });
    expect(response.status).toBe(200);
    const body = rideQuotesResponseSchema.parse(await response.json());
    expect(body.simulated).toBe(true);
    expect(new Set(body.quotes.map((quote) => quote.providerId))).toEqual(
      new Set(['uber', 'lyft', 'waymo']),
    );
    expect(body.unavailable).toEqual([]);
    const prices = body.quotes.map((quote) => quote.priceCents);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('marks Waymo unavailable outside its service areas', async () => {
    const response = await postQuotes(app, { pickup: places.timesSquare, dropoff: places.jfk });
    const body = rideQuotesResponseSchema.parse(await response.json());
    expect(body.quotes.some((quote) => quote.providerId === 'waymo')).toBe(false);
    expect(body.unavailable.map((entry) => entry.providerId)).toEqual(['waymo']);
  });

  it('rejects malformed bodies', async () => {
    const response = await postQuotes(app, { pickup: { latitude: 200, longitude: 0 } });
    expect(response.status).toBe(400);
    const notJson = await app.request('/v1/rides/quotes', { method: 'POST', body: 'nope' });
    expect(notJson.status).toBe(400);
  });

  it('rejects trips that are too short or too long', async () => {
    const short = await postQuotes(app, {
      pickup: places.ferryBuilding,
      dropoff: { latitude: 37.7956, longitude: -122.3938 },
    });
    expect(short.status).toBe(422);
    expect(await short.json()).toMatchObject({ error: 'trip_too_short' });

    const long = await postQuotes(app, { pickup: places.ferryBuilding, dropoff: places.jfk });
    expect(long.status).toBe(422);
    expect(await long.json()).toMatchObject({ error: 'trip_too_long' });
  });
});
