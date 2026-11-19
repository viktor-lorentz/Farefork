import { APP_NAME } from '@repo/shared/brand';

export type GeoConfig = {
  geocoder: 'photon' | 'mock';
  photonUrl: string;
  router: 'osrm' | 'estimate';
  osrmUrl: string;
  userAgent: string;
  upstreamTimeoutMs: number;
};

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function readGeoConfig(env: NodeJS.ProcessEnv = process.env): GeoConfig {
  return {
    geocoder: env.GEOCODER === 'mock' ? 'mock' : 'photon',
    photonUrl: trimSlash(env.PHOTON_URL ?? 'https://photon.komoot.io'),
    router: env.ROUTER === 'estimate' ? 'estimate' : 'osrm',
    osrmUrl: trimSlash(env.OSRM_URL ?? 'https://router.project-osrm.org'),
    userAgent: env.GEO_USER_AGENT ?? `${APP_NAME}/0.1 (development build)`,
    upstreamTimeoutMs: Number(env.UPSTREAM_TIMEOUT_MS ?? 5000),
  };
}
