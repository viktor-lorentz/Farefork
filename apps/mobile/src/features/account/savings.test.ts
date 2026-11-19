import type { FoodQuote, RideQuote } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { foodBaselineCents, foodHandoff, rideBaselineCents, rideHandoff } from './savings';

function ride(overrides: Partial<RideQuote> & Pick<RideQuote, 'id'>): RideQuote {
  return {
    providerId: 'uber',
    productName: 'UberX',
    rideClass: 'economy',
    seats: 4,
    autonomous: false,
    priceCents: 1500,
    standardPriceCents: overrides.priceCents ?? 1500,
    membership: null,
    creditBackCents: 0,
    membershipNote: null,
    surgeMultiplier: 1,
    pickupEtaMinutes: 5,
    tripMinutes: 20,
    bookVia: 'uber',
    bookingUrl: 'https://m.uber.com/ul/',
    appUrl: null,
    ...overrides,
  };
}

function food(providerId: FoodQuote['providerId'], total: number, standard = total): FoodQuote {
  return {
    providerId,
    subtotalCents: 2000,
    fees: [],
    taxCents: 0,
    totalBeforeTipCents: total,
    standardTotalBeforeTipCents: standard,
    membership: null,
    membershipNote: null,
    etaMinutes: 30,
    orderUrl: 'https://example.com',
    appUrl: null,
  };
}

const rides = [
  ride({ id: 'uber:x', priceCents: 1500 }),
  ride({ id: 'uber:comfort', rideClass: 'comfort', priceCents: 2200 }),
  ride({ id: 'lyft:standard', providerId: 'lyft', priceCents: 1900 }),
  ride({ id: 'lyft:wait', providerId: 'lyft', priceCents: 1700 }),
  ride({ id: 'waymo:one', providerId: 'waymo', priceCents: 2100 }),
];

describe('ride savings', () => {
  it('averages the cheapest same-class ride from each other app', () => {
    expect(rideBaselineCents(rides[0]!, rides)).toBe(1900);
  });

  it('has no baseline when no other app offers the class', () => {
    expect(rideBaselineCents(rides[1]!, rides)).toBeNull();
    expect(rideHandoff(rides[1]!, rides, { from: 'A', to: 'B' }).saved_cents).toBe(0);
  });

  it('never records negative savings', () => {
    const pricey = ride({ id: 'waymo:one', providerId: 'waymo', priceCents: 2100 });
    expect(rideHandoff(pricey, rides, { from: 'A', to: 'B' }).saved_cents).toBe(0);
  });

  it('records membership savings separately', () => {
    const member = ride({ id: 'lyft:standard', providerId: 'lyft', priceCents: 1800 });
    const handoff = rideHandoff({ ...member, standardPriceCents: 1900 }, rides, {
      from: 'Home',
      to: 'Work',
    });
    expect(handoff).toMatchObject({
      kind: 'ride',
      provider_id: 'lyft',
      subtitle: 'Home → Work',
      price_cents: 1800,
      standard_price_cents: 1900,
      membership_saved_cents: 100,
    });
  });
});

describe('food savings', () => {
  const quotes = [food('grubhub', 3500), food('doordash', 4000), food('ubereats', 4400, 4800)];

  it('averages the other apps', () => {
    expect(foodBaselineCents(quotes[0]!, quotes)).toBe(4200);
    expect(
      foodHandoff(quotes[0]!, quotes, { restaurantName: 'Cedar', itemCount: 2 }),
    ).toMatchObject({ saved_cents: 700, subtitle: '2 items', membership_saved_cents: 0 });
  });

  it('counts membership savings on the chosen app', () => {
    const handoff = foodHandoff(quotes[2]!, quotes, { restaurantName: 'Cedar', itemCount: 1 });
    expect(handoff.membership_saved_cents).toBe(400);
    expect(handoff.saved_cents).toBe(0);
    expect(handoff.subtitle).toBe('1 item');
  });
});
