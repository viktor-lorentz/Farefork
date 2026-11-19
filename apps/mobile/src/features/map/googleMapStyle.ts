import type { MapStyleElement } from 'react-native-maps';
import type { MapPalette } from './palette';

export function googleMapStyle(palette: MapPalette): MapStyleElement[] {
  return [
    { elementType: 'geometry', stylers: [{ color: palette.land }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: palette.labelSecondary }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: palette.labelHalo }] },
    {
      featureType: 'administrative',
      elementType: 'geometry.stroke',
      stylers: [{ color: palette.boundary }],
    },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.labelPrimary }],
    },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }, { color: palette.park }],
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry',
      stylers: [{ color: palette.building }],
    },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: palette.roadMinor }] },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: palette.roadCasing }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry.fill',
      stylers: [{ color: palette.roadMajor }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.fill',
      stylers: [{ color: palette.roadHighway }],
    },
    { featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    {
      featureType: 'transit.line',
      elementType: 'geometry',
      stylers: [{ visibility: 'on' }, { color: palette.rail }],
    },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: palette.water }] },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: palette.labelSecondary }],
    },
  ];
}
