import { serve } from '@hono/node-server';
import { createApp } from './app';

const port = Number(process.env.PORT ?? 8787);
const hostname = process.env.HOST ?? '0.0.0.0';

serve({ fetch: createApp().fetch, port, hostname }, (info) => {
  console.log(`API listening on http://${hostname}:${info.port}`);
});
