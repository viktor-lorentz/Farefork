import type { LatLng } from '@repo/shared';
import type { GeoJSONSourceSpecification, StyleSpecification } from 'maplibre-gl';
import type { MapTrip } from './types';
import type { MapPalette } from './palette';

const SOURCE = 'openmaptiles';
export const TRIP_SOURCE = 'trip';

type TripGeoJSON = Exclude<GeoJSONSourceSpecification['data'], string>;

function position(point: LatLng): [number, number] {
  return [point.longitude, point.latitude];
}

export function tripGeoJSON(
  trip: MapTrip | null | undefined,
  user: LatLng | null = null,
): TripGeoJSON {
  const userFeatures = user
    ? [
        {
          type: 'Feature' as const,
          properties: { kind: 'user' },
          geometry: { type: 'Point' as const, coordinates: position(user) },
        },
      ]
    : [];
  if (!trip) {
    return { type: 'FeatureCollection', features: userFeatures };
  }
  return {
    type: 'FeatureCollection',
    features: [
      ...userFeatures,
      {
        type: 'Feature',
        properties: { kind: 'route' },
        geometry: { type: 'LineString', coordinates: trip.path.map(position) },
      },
      {
        type: 'Feature',
        properties: { kind: 'pickup' },
        geometry: { type: 'Point', coordinates: position(trip.pickup) },
      },
      {
        type: 'Feature',
        properties: { kind: 'dropoff' },
        geometry: { type: 'Point', coordinates: position(trip.dropoff) },
      },
    ],
  };
}

export function webMapStyle(
  palette: MapPalette,
  trip?: MapTrip | null,
  user: LatLng | null = null,
): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      [SOURCE]: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
      [TRIP_SOURCE]: { type: 'geojson', data: tripGeoJSON(trip, user) },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': palette.land } },
      {
        id: 'park',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'park',
        paint: { 'fill-color': palette.park },
      },
      {
        id: 'landcover-green',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'landcover',
        filter: ['match', ['get', 'class'], ['grass', 'wood', 'forest'], true, false],
        paint: { 'fill-color': palette.park, 'fill-opacity': 0.7 },
      },
      {
        id: 'water',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'water',
        paint: { 'fill-color': palette.water },
      },
      {
        id: 'building',
        type: 'fill',
        source: SOURCE,
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': palette.building,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0, 15, 1],
        },
      },
      {
        id: 'rail',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'],
        paint: { 'line-color': palette.rail, 'line-width': 1 },
      },
      {
        id: 'road-casing',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: [
          'match',
          ['get', 'class'],
          ['motorway', 'trunk', 'primary', 'secondary'],
          true,
          false,
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.roadCasing,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 1.5, 18, 26],
        },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: [
          'match',
          ['get', 'class'],
          ['minor', 'service', 'tertiary', 'street'],
          true,
          false,
        ],
        minzoom: 12,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.roadMinor,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.5, 18, 14],
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['primary', 'secondary'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.roadMajor,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 10, 0.8, 18, 22],
        },
      },
      {
        id: 'road-highway',
        type: 'line',
        source: SOURCE,
        'source-layer': 'transportation',
        filter: ['match', ['get', 'class'], ['motorway', 'trunk'], true, false],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.roadHighway,
          'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 8, 1, 18, 24],
        },
      },
      {
        id: 'trip-route-casing',
        type: 'line',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'route'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': palette.routeCasing, 'line-width': 8 },
      },
      {
        id: 'trip-route',
        type: 'line',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'route'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': palette.route, 'line-width': 4 },
      },
      {
        id: 'water-label',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'water_name',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Italic'],
          'text-size': 12,
        },
        paint: {
          'text-color': palette.labelSecondary,
          'text-halo-color': palette.labelHalo,
          'text-halo-width': 1,
        },
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'transportation_name',
        minzoom: 14,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 11,
        },
        paint: {
          'text-color': palette.labelSecondary,
          'text-halo-color': palette.labelHalo,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'place-label-minor',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        filter: ['match', ['get', 'class'], ['neighbourhood', 'suburb', 'quarter'], true, false],
        minzoom: 12,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
        },
        paint: {
          'text-color': palette.labelSecondary,
          'text-halo-color': palette.labelHalo,
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'place-label-major',
        type: 'symbol',
        source: SOURCE,
        'source-layer': 'place',
        filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 13, 14, 18],
        },
        paint: {
          'text-color': palette.labelPrimary,
          'text-halo-color': palette.labelHalo,
          'text-halo-width': 1.5,
        },
      },
      {
        id: 'user-halo',
        type: 'circle',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'user'],
        paint: { 'circle-radius': 14, 'circle-color': palette.route, 'circle-opacity': 0.15 },
      },
      {
        id: 'user-dot',
        type: 'circle',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'user'],
        paint: {
          'circle-radius': 6,
          'circle-color': palette.route,
          'circle-stroke-color': palette.routeCasing,
          'circle-stroke-width': 2,
        },
      },
      {
        id: 'trip-pickup',
        type: 'circle',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'pickup'],
        paint: {
          'circle-radius': 6,
          'circle-color': palette.routeCasing,
          'circle-stroke-color': palette.route,
          'circle-stroke-width': 5,
        },
      },
      {
        id: 'trip-dropoff',
        type: 'circle',
        source: TRIP_SOURCE,
        filter: ['==', ['get', 'kind'], 'dropoff'],
        paint: {
          'circle-radius': 8,
          'circle-color': palette.route,
          'circle-stroke-color': palette.routeCasing,
          'circle-stroke-width': 2,
        },
      },
    ],
  };
}
