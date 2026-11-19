import { membershipCatalogSchema } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('api', () => {
  const app = createApp();

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
