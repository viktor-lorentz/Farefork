import { providerIds } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { createMockDealsSource, weekStart } from './mock';

const now = new Date('2026-11-19T18:00:00Z');

describe('mock deals', () => {
  it('starts weeks on Monday', () => {
    expect(weekStart(now).toISOString()).toBe('2026-11-16T00:00:00.000Z');
  });

  it('returns live deals, eligible ones first, sorted by savings', async () => {
    const deals = await createMockDealsSource().list({ membershipIds: [], now });
    expect(deals.length).toBeGreaterThan(3);
    for (const deal of deals) {
      expect(new Date(deal.startsAt).getTime()).toBeLessThanOrEqual(now.getTime());
      expect(new Date(deal.expiresAt).getTime()).toBeGreaterThan(now.getTime());
    }
    const eligible = deals.filter((deal) => deal.eligible);
    expect(deals.slice(0, eligible.length)).toEqual(eligible);
    const savings = eligible.map((deal) => deal.estimatedSavingsCents);
    expect(savings).toEqual([...savings].sort((a, b) => b - a));
  });

  it('marks member deals eligible only for members, and filters by kind', async () => {
    const source = createMockDealsSource();
    const later = new Date('2026-11-20T12:00:00Z');
    const without = await source.list({ membershipIds: [], now: later });
    const withAll = await source.list({
      membershipIds: ['uber_one', 'dashpass', 'grubhub_plus', 'lyft_pink'],
      now: later,
    });
    expect(
      without.filter((deal) => deal.membershipProgramId !== null).every((d) => !d.eligible),
    ).toBe(true);
    expect(withAll.every((deal) => deal.eligible)).toBe(true);
    const food = await source.list({ membershipIds: [], now: later, kind: 'food' });
    expect(food.every((deal) => deal.kind === 'food')).toBe(true);
  });

  it('is stable within a week', async () => {
    const source = createMockDealsSource();
    const a = await source.list({ membershipIds: [], now });
    const b = await source.list({ membershipIds: [], now: new Date(now.getTime() + 60_000) });
    expect(b.map((deal) => deal.id)).toEqual(a.map((deal) => deal.id));
  });

  it('keeps at least one live deal per provider on every day of the week', async () => {
    const source = createMockDealsSource();
    const monday = new Date('2026-11-23T00:30:00Z');
    for (let day = 0; day < 7; day += 1) {
      const at = new Date(monday.getTime() + day * 24 * 60 * 60 * 1000);
      const deals = await source.list({ membershipIds: [], now: at });
      const providers = new Set(deals.map((deal) => deal.providerId));
      expect(providers.size).toBe(providerIds.length);
      expect(new Set(deals.map((deal) => deal.id)).size).toBe(deals.length);
    }
  });
});
