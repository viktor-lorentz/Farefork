import type { StyleSpecification } from 'maplibre-gl';
import type { MapPalette } from './palette';

const SOURCE = 'openmaptiles';

export function webMapStyle(palette: MapPalette): StyleSpecification {
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      [SOURCE]: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
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
    ],
  };
}
