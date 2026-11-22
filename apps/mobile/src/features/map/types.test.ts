import { describe, expect, it } from 'vitest';
import { fitPadding, framePadding } from './types';

const none = { top: 0, right: 0, bottom: 0, left: 0 };

describe('framePadding', () => {
  it('adds the fit margin to each inset', () => {
    expect(framePadding({ ...none, bottom: 300 }, { width: 400, height: 800 })).toEqual({
      top: fitPadding,
      right: fitPadding,
      bottom: 300 + fitPadding,
      left: fitPadding,
    });
  });

  it('shrinks proportionally when the insets leave no room', () => {
    const padding = framePadding({ ...none, top: 100, bottom: 700 }, { width: 400, height: 800 });
    expect(padding.top + padding.bottom).toBeLessThanOrEqual(720);
    expect(padding.bottom).toBeGreaterThan(padding.top);
  });

  it('never returns negative padding for a collapsed map', () => {
    const padding = framePadding(none, { width: 0, height: 0 });
    expect(Object.values(padding).every((value) => value >= 0)).toBe(true);
  });
});
