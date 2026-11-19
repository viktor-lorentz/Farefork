import { describe, expect, it } from 'vitest';
import { dollarsToCents, formatUsd } from './money';

describe('formatUsd', () => {
  it('formats cents with two decimals', () => {
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(5)).toBe('$0.05');
    expect(formatUsd(1840)).toBe('$18.40');
  });

  it('groups thousands', () => {
    expect(formatUsd(123456)).toBe('$1,234.56');
    expect(formatUsd(100000000)).toBe('$1,000,000.00');
  });

  it('rounds fractional cents', () => {
    expect(formatUsd(1840.4)).toBe('$18.40');
    expect(formatUsd(1840.5)).toBe('$18.41');
  });

  it('uses a true minus sign for negative amounts', () => {
    expect(formatUsd(-500)).toBe('−$5.00');
  });

  it('can drop zero cents and show a plus sign', () => {
    expect(formatUsd(4200, { dropZeroCents: true })).toBe('$42');
    expect(formatUsd(4250, { dropZeroCents: true })).toBe('$42.50');
    expect(formatUsd(300, { signed: true })).toBe('+$3.00');
    expect(formatUsd(0, { signed: true })).toBe('$0.00');
  });
});

describe('dollarsToCents', () => {
  it('avoids floating point drift', () => {
    expect(dollarsToCents(19.99)).toBe(1999);
    expect(dollarsToCents(0.1 + 0.2)).toBe(30);
  });
});
