import { describe, expect, it } from 'vitest';
import { dayPartForHour, phaseForHour, phaseForSunAltitude, skyPhaseAt } from './skyPhase';

describe('phaseForSunAltitude', () => {
  it('maps altitude bands to phases', () => {
    expect(phaseForSunAltitude(40)).toBe('day');
    expect(phaseForSunAltitude(4)).toBe('golden');
    expect(phaseForSunAltitude(-6)).toBe('dusk');
    expect(phaseForSunAltitude(-30)).toBe('night');
  });
});

describe('phaseForHour', () => {
  it('falls back to the clock', () => {
    expect(phaseForHour(12)).toBe('day');
    expect(phaseForHour(17)).toBe('golden');
    expect(phaseForHour(19)).toBe('dusk');
    expect(phaseForHour(23)).toBe('night');
    expect(phaseForHour(3)).toBe('night');
  });
});

describe('skyPhaseAt', () => {
  const sanFrancisco = { latitude: 37.7793, longitude: -122.4193 };

  it('uses the sun when a location is known', () => {
    expect(skyPhaseAt(new Date('2026-06-21T20:00:00Z'), sanFrancisco)).toBe('day');
    expect(skyPhaseAt(new Date('2026-06-21T09:00:00Z'), sanFrancisco)).toBe('night');
  });
});

describe('dayPartForHour', () => {
  it('names the part of the day', () => {
    expect(dayPartForHour(9)).toBe('morning');
    expect(dayPartForHour(14)).toBe('afternoon');
    expect(dayPartForHour(19)).toBe('evening');
    expect(dayPartForHour(1)).toBe('night');
  });
});
