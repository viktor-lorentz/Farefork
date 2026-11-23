export type SkyPhase = 'day' | 'golden' | 'dusk' | 'night';

export type SkyPalette = {
  top: string;
  bottom: string;
  far: string;
  mid: string;
  near: string;
  window: string;
  windowsLit: number;
  ink: 'dark' | 'light';
};

export const skyPalettes: Record<SkyPhase, SkyPalette> = {
  day: {
    top: '#BFD3EA',
    bottom: '#E7EEF5',
    far: '#A9BCD3',
    mid: '#8397B2',
    near: '#0E1424',
    window: '#FFE3B0',
    windowsLit: 0.05,
    ink: 'dark',
  },
  golden: {
    top: '#9DB3D6',
    bottom: '#F3B57C',
    far: '#C9A08E',
    mid: '#8C6F7B',
    near: '#0E1424',
    window: '#FFC870',
    windowsLit: 0.22,
    ink: 'dark',
  },
  dusk: {
    top: '#3D3F72',
    bottom: '#6E6FA8',
    far: '#55558A',
    mid: '#2E2F55',
    near: '#0E1424',
    window: '#FFB443',
    windowsLit: 0.45,
    ink: 'light',
  },
  night: {
    top: '#0A0E19',
    bottom: '#151B36',
    far: '#1D2445',
    mid: '#141A31',
    near: '#05070D',
    window: '#FFB443',
    windowsLit: 0.6,
    ink: 'light',
  },
};

export const skyInk: Record<SkyPalette['ink'], { primary: string; secondary: string }> = {
  dark: { primary: '#0E1424', secondary: 'rgba(14, 20, 36, 0.72)' },
  light: { primary: '#F7F7F5', secondary: 'rgba(247, 247, 245, 0.78)' },
};
