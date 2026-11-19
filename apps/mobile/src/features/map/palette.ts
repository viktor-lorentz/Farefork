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
};

export const mapPalettes: Record<ColorScheme, MapPalette> = {
  light: {
    land: '#F4F4F2',
    park: '#E6EBE4',
    water: '#D4DCE2',
    building: '#E7E7E4',
    roadMinor: '#FFFFFF',
    roadMajor: '#FFFFFF',
    roadHighway: '#FFFFFF',
    roadCasing: '#DCDCDA',
    rail: '#D2D2CF',
    boundary: '#BDBDBA',
    labelPrimary: '#3A3A3A',
    labelSecondary: '#7A7A78',
    labelHalo: '#F4F4F2',
  },
  dark: {
    land: '#0E0E0E',
    park: '#121613',
    water: '#05080B',
    building: '#191919',
    roadMinor: '#1E1E1E',
    roadMajor: '#2A2A2A',
    roadHighway: '#363636',
    roadCasing: '#0E0E0E',
    rail: '#232323',
    boundary: '#3A3A3A',
    labelPrimary: '#B5B5B5',
    labelSecondary: '#6E6E6E',
    labelHalo: '#0E0E0E',
  },
};
