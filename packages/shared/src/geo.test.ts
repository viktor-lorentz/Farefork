import { describe, expect, it } from 'vitest';
import {
  boundsOf,
  decodePolyline,
  encodePolyline,
  formatMiles,
  formatMinutes,
  haversineMeters,
} from './geo';

describe('polyline', () => {
  it('decodes the reference example at precision 5', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  it('round-trips at precision 6', () => {
    const points = [
      { latitude: 37.795493, longitude: -122.393401 },
      { latitude: 37.759616, longitude: -122.426959 },
      { latitude: -33.86882, longitude: 151.209295 },
    ];
    expect(decodePolyline(encodePolyline(points))).toEqual(points);
  });

  it('ignores a truncated tail', () => {
    const encoded = encodePolyline([
      { latitude: 1, longitude: 2 },
      { latitude: 3, longitude: 4 },
    ]);
    expect(decodePolyline(encoded.slice(0, -1))).toHaveLength(1);
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('haversineMeters', () => {
  it('measures the Ferry Building to Dolores Park at about 4.5 km', () => {
    const meters = haversineMeters(
      { latitude: 37.7955, longitude: -122.3937 },
      { latitude: 37.7596, longitude: -122.427 },
    );
    expect(meters).toBeGreaterThan(4800);
    expect(meters).toBeLessThan(5000);
  });

  it('is zero for the same point', () => {
    expect(haversineMeters({ latitude: 10, longitude: 10 }, { latitude: 10, longitude: 10 })).toBe(
      0,
    );
  });
});

describe('boundsOf', () => {
  it('returns null for no points and the box otherwise', () => {
    expect(boundsOf([])).toBeNull();
    expect(
      boundsOf([
        { latitude: 1, longitude: -3 },
        { latitude: -2, longitude: 4 },
      ]),
    ).toEqual({ north: 1, south: -2, east: 4, west: -3 });
  });
});

describe('formatting', () => {
  it('formats miles', () => {
    expect(formatMiles(20)).toBe('0.1 mi');
    expect(formatMiles(4828)).toBe('3.0 mi');
    expect(formatMiles(40_000)).toBe('25 mi');
  });

  it('formats minutes', () => {
    expect(formatMinutes(0.2)).toBe('1 min');
    expect(formatMinutes(14.4)).toBe('14 min');
    expect(formatMinutes(60)).toBe('1 hr');
    expect(formatMinutes(95)).toBe('1 hr 35 min');
  });
});
