import { describe, expect, it } from 'vitest';
import { layerGeometry, litWindowPaths, starPath } from './skylineGeometry';

describe('layerGeometry', () => {
  it('is deterministic', () => {
    expect(layerGeometry('near')).toEqual(layerGeometry('near'));
  });

  it('only gives windows to the nearer layers', () => {
    expect(layerGeometry('far').windows).toHaveLength(0);
    expect(layerGeometry('mid').windows.length).toBeGreaterThan(0);
    expect(layerGeometry('near').windows.length).toBeGreaterThan(0);
  });
});

describe('litWindowPaths', () => {
  it('lights more windows as the ratio rises and keeps earlier ones lit', () => {
    const { windows } = layerGeometry('near');
    const dusk = litWindowPaths(windows, 0.3);
    const night = litWindowPaths(windows, 0.6);
    expect(night.steady.length).toBeGreaterThan(dusk.steady.length);
    expect(litWindowPaths(windows, 0)).toEqual({ steady: '', flicker: '' });
  });
});

describe('starPath', () => {
  it('draws the requested number of stars', () => {
    expect(starPath(12).match(/M/g)).toHaveLength(12);
  });
});
