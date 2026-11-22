import type { ColorScheme } from '@/design/tokens';

export type MapPalette = {
  land: string;
  park: string;
  water: string;
  building: string;
  roadMinor: string;
  roadMajor: string;
  roadHighway: string;
  roadCasing: string;
  rail: string;
  boundary: string;
  labelPrimary: string;
  labelSecondary: string;
  labelHalo: string;
  route: string;
  routeCasing: string;
};

export const mapPalettes: Record<ColorScheme, MapPalette> = {
  light: {
    land: '#F1F2F0',
    park: '#E3E8E1',
    water: '#9FB0C6',
    building: '#E6E7E4',
    roadMinor: '#FFFFFF',
    roadMajor: '#FFFFFF',
    roadHighway: '#FFFFFF',
    roadCasing: '#D8DADB',
    rail: '#CFD2D5',
    boundary: '#B4B9C2',
    labelPrimary: '#2E3445',
    labelSecondary: '#5F6578',
    labelHalo: '#F1F2F0',
    route: '#FFB443',
    routeCasing: '#0E1424',
  },
  dark: {
    land: '#111726',
    park: '#131C27',
    water: '#0A0E19',
    building: '#1A2133',
    roadMinor: '#1C2436',
    roadMajor: '#26304A',
    roadHighway: '#323D5C',
    roadCasing: '#111726',
    rail: '#222B40',
    boundary: '#3A4560',
    labelPrimary: '#AEB6C8',
    labelSecondary: '#7C85A0',
    labelHalo: '#111726',
    route: '#FFB443',
    routeCasing: '#0A0E19',
  },
};
