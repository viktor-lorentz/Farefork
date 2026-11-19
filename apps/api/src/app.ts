import { APP_NAME } from '@repo/shared/brand';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { catalogFor } from './memberships/registry';

export function createApp() {
  const app = new Hono();

  app.use('*', logger());
  app.use('*', cors());

  app.get('/health', (c) => c.json({ ok: true, service: `${APP_NAME} API` }));

  app.get('/v1/memberships', (c) => {
    c.header('Cache-Control', 'public, max-age=300');
    return c.json(catalogFor());
  });

  app.notFound((c) => c.json({ error: 'not_found' }, 404));

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'internal_error' }, 500);
  });

  return app;
}
