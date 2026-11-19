import { readGeoConfig } from '../config';
import { createEstimateRouter, createOsrmRouter, withFallback } from '../geo/router';
import { createMockRideProviders } from '../rides/providers/mock';
import { getRideQuotes } from '../rides/quoteService';
import { runAlertCheck } from './check';
import { createExpoPushSender } from './expoPush';
import { createSupabaseAlertStore } from './supabaseStore';

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.log('Price alerts: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set, skipping.');
    return;
  }
  const config = readGeoConfig();
  const upstream = { userAgent: config.userAgent, timeoutMs: config.upstreamTimeoutMs };
  const router = withFallback(
    createOsrmRouter({ ...upstream, baseUrl: config.osrmUrl }),
    createEstimateRouter(),
    () => undefined,
  );
  const providers = createMockRideProviders();
  const summary = await runAlertCheck({
    store: createSupabaseAlertStore({ url, serviceKey }),
    quote: (request) => getRideQuotes(request, { router, providers }),
    push: createExpoPushSender({ accessToken: process.env.EXPO_ACCESS_TOKEN }),
    now: () => new Date(),
  });
  console.log(
    `Price alerts: checked ${summary.checked}, hit target ${summary.triggered}, failed ${summary.failed}, notifications sent ${summary.pushed}.`,
  );
}

main().catch((error: unknown) => {
  console.error('Price alerts failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
