import type { FoodQuote, MembershipCatalog, RideQuote } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import {
  applyFoodMembership,
  applyRideMembership,
  membershipForProvider,
  resolveMemberships,
} from './pricing';
import { catalogFor } from './registry';

const catalog: MembershipCatalog = {
  version: 'test',
  effectiveFrom: '2026-01-01',
  programs: [
    {
      id: 'pink',
      name: 'Pink',
      providerIds: ['lyft'],
      summary: '',
      available: true,
      tiers: [
        { id: 'pink', name: 'Monthly', billing: 'monthly', monthlyPriceCents: 999 },
        { id: 'pink_annual', name: 'Annual', billing: 'annual', monthlyPriceCents: 833 },
      ],
      benefits: [
        { type: 'ride_percent_off', percent: 10, maxCents: 500, rideClasses: ['economy', 'xl'] },
      ],
    },
    {
      id: 'one',
      name: 'One',
      providerIds: ['uber', 'ubereats'],
      summary: '',
      available: true,
      tiers: [{ id: 'one', name: 'Monthly', billing: 'monthly', monthlyPriceCents: 999 }],
      benefits: [
        { type: 'ride_credit_back', percent: 6, creditName: 'One credits', rideClasses: null },
        { type: 'delivery_fee_waived', minSubtotalCents: 1500 },
        { type: 'service_fee_rate', rate: 0.05, minSubtotalCents: 1500 },
      ],
    },
    {
      id: 'gone',
      name: 'Gone',
      providerIds: ['waymo'],
      summary: '',
      available: false,
      tiers: [{ id: 'gone', name: 'Monthly', billing: 'monthly', monthlyPriceCents: 100 }],
      benefits: [{ type: 'ride_percent_off', percent: 50, maxCents: null, rideClasses: null }],
    },
  ],
};

function ride(overrides: Partial<RideQuote>): RideQuote {
  return {
    id: 'lyft:standard',
    providerId: 'lyft',
    productName: 'Lyft',
    rideClass: 'economy',
    seats: 4,
    autonomous: false,
    priceCents: 2000,
    standardPriceCents: 2000,
    membership: null,
    creditBackCents: 0,
    membershipNote: null,
    surgeMultiplier: 1,
    pickupEtaMinutes: 4,
    tripMinutes: 12,
    bookVia: 'lyft',
    bookingUrl: 'https://lyft.com/ride',
    appUrl: null,
    ...overrides,
  };
}

function food(subtotalCents: number): FoodQuote {
  const fees: FoodQuote['fees'] = [
    { kind: 'delivery', label: 'Delivery fee', amountCents: 399, standardAmountCents: null },
    {
      kind: 'service',
      label: 'Service fee',
      amountCents: Math.round(subtotalCents * 0.15),
      standardAmountCents: null,
    },
  ];
  const taxCents = Math.round(subtotalCents * 0.0875);
  const total = subtotalCents + fees.reduce((sum, fee) => sum + fee.amountCents, 0) + taxCents;
  return {
    providerId: 'ubereats',
    subtotalCents,
    fees,
    taxCents,
    totalBeforeTipCents: total,
    standardTotalBeforeTipCents: total,
    membership: null,
    membershipNote: null,
    etaMinutes: 30,
    orderUrl: 'https://www.ubereats.com/search?q=x',
    appUrl: null,
  };
}

describe('resolveMemberships', () => {
  it('matches a tier id or a program id', () => {
    const active = resolveMemberships(catalog, ['pink_annual', 'one']);
    expect(active.map((entry) => entry.tier.id)).toEqual(['pink_annual', 'one']);
  });

  it('ignores unknown ids, unavailable programs and duplicate tiers', () => {
    const active = resolveMemberships(catalog, ['nope', 'gone', 'pink', 'pink_annual']);
    expect(active.map((entry) => entry.tier.id)).toEqual(['pink']);
  });

  it('finds the membership that covers a provider', () => {
    const active = resolveMemberships(catalog, ['one']);
    expect(membershipForProvider(active, 'ubereats')?.program.id).toBe('one');
    expect(membershipForProvider(active, 'lyft')).toBeUndefined();
  });

  it('resolves every tier in the shipped catalog', () => {
    const shipped = catalogFor(new Date('2026-11-18T00:00:00Z'));
    for (const program of shipped.programs.filter((item) => item.available)) {
      for (const tier of program.tiers) {
        expect(resolveMemberships(shipped, [tier.id])[0]?.program.id).toBe(program.id);
      }
    }
  });
});

describe('applyRideMembership', () => {
  it('takes a percentage off eligible ride classes', () => {
    const quote = applyRideMembership(ride({}), resolveMemberships(catalog, ['pink']));
    expect(quote.priceCents).toBe(1800);
    expect(quote.standardPriceCents).toBe(2000);
    expect(quote.membership).toEqual({ programId: 'pink', tierId: 'pink', name: 'Pink' });
    expect(quote.membershipNote).toBe('Pink saves $2.00');
  });

  it('caps the discount', () => {
    const quote = applyRideMembership(
      ride({ priceCents: 9000, standardPriceCents: 9000 }),
      resolveMemberships(catalog, ['pink']),
    );
    expect(quote.priceCents).toBe(8500);
  });

  it('skips ride classes the plan excludes', () => {
    const original = ride({ rideClass: 'premium' });
    expect(applyRideMembership(original, resolveMemberships(catalog, ['pink']))).toBe(original);
  });

  it('records credit back without lowering the price', () => {
    const quote = applyRideMembership(
      ride({ providerId: 'uber', bookVia: 'uber' }),
      resolveMemberships(catalog, ['one']),
    );
    expect(quote.priceCents).toBe(2000);
    expect(quote.creditBackCents).toBe(120);
    expect(quote.membershipNote).toBe('Earns $1.20 in One credits');
  });

  it('leaves quotes alone without a matching membership', () => {
    const original = ride({});
    expect(applyRideMembership(original, resolveMemberships(catalog, ['one']))).toBe(original);
    expect(applyRideMembership(original, [])).toBe(original);
  });
});

describe('applyFoodMembership', () => {
  it('waives delivery and lowers the service fee above the minimum', () => {
    const quote = applyFoodMembership(food(2000), resolveMemberships(catalog, ['one']));
    const delivery = quote.fees.find((fee) => fee.kind === 'delivery');
    const service = quote.fees.find((fee) => fee.kind === 'service');
    expect(delivery).toMatchObject({ amountCents: 0, standardAmountCents: 399 });
    expect(service).toMatchObject({ amountCents: 100, standardAmountCents: 300 });
    expect(quote.totalBeforeTipCents).toBe(2000 + 100 + 175);
    expect(quote.standardTotalBeforeTipCents).toBe(2000 + 399 + 300 + 175);
    expect(quote.membership?.programId).toBe('one');
    expect(quote.membershipNote).toBe('One perks applied');
  });

  it('says how much more to add below the minimum', () => {
    const original = food(1200);
    const quote = applyFoodMembership(original, resolveMemberships(catalog, ['one']));
    expect(quote.totalBeforeTipCents).toBe(original.totalBeforeTipCents);
    expect(quote.membership).toBeNull();
    expect(quote.membershipNote).toBe('Add $3.00 more for One perks');
  });

  it('never raises a fee that is already lower than the member rate', () => {
    const base = food(2000);
    const cheap: FoodQuote = {
      ...base,
      fees: base.fees.map((fee) => (fee.kind === 'service' ? { ...fee, amountCents: 50 } : fee)),
    };
    const quote = applyFoodMembership(cheap, resolveMemberships(catalog, ['one']));
    expect(quote.fees.find((fee) => fee.kind === 'service')?.amountCents).toBe(50);
  });

  it('leaves quotes alone without a matching membership', () => {
    const original = food(2000);
    expect(applyFoodMembership(original, resolveMemberships(catalog, ['pink']))).toBe(original);
  });
});
