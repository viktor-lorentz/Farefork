import {
  type AppliedMembership,
  type FoodQuote,
  formatUsd,
  type MembershipCatalog,
  type MembershipProgram,
  type MembershipTier,
  type ProviderId,
  type RideQuote,
} from '@repo/shared';

export type ActiveMembership = {
  program: MembershipProgram;
  tier: MembershipTier;
};

export function resolveMemberships(
  catalog: MembershipCatalog,
  membershipIds: readonly string[],
): ActiveMembership[] {
  const active: ActiveMembership[] = [];
  for (const id of membershipIds) {
    for (const program of catalog.programs) {
      if (!program.available || active.some((entry) => entry.program.id === program.id)) {
        continue;
      }
      const tier =
        program.tiers.find((candidate) => candidate.id === id) ??
        (program.id === id ? program.tiers[0] : undefined);
      if (tier) {
        active.push({ program, tier });
      }
    }
  }
  return active;
}

export function membershipForProvider(
  active: readonly ActiveMembership[],
  providerId: ProviderId,
): ActiveMembership | undefined {
  return active.find((entry) => entry.program.providerIds.includes(providerId));
}

function applied(entry: ActiveMembership): AppliedMembership {
  return { programId: entry.program.id, tierId: entry.tier.id, name: entry.program.name };
}

function percentOf(cents: number, percent: number): number {
  return Math.round((cents * percent) / 100);
}

export function applyRideMembership(
  quote: RideQuote,
  active: readonly ActiveMembership[],
): RideQuote {
  const entry = membershipForProvider(active, quote.providerId);
  if (!entry) {
    return quote;
  }
  let priceCents = quote.priceCents;
  let creditBackCents = 0;
  const notes: string[] = [];
  for (const benefit of entry.program.benefits) {
    if (benefit.type !== 'ride_percent_off' && benefit.type !== 'ride_credit_back') {
      continue;
    }
    if (benefit.rideClasses !== null && !benefit.rideClasses.includes(quote.rideClass)) {
      continue;
    }
    if (benefit.type === 'ride_percent_off') {
      const raw = percentOf(priceCents, benefit.percent);
      const discount = benefit.maxCents === null ? raw : Math.min(raw, benefit.maxCents);
      priceCents -= discount;
      notes.push(`${entry.program.name} saves ${formatUsd(discount)}`);
    } else {
      creditBackCents += percentOf(priceCents, benefit.percent);
      notes.push(`Earns ${formatUsd(creditBackCents)} in ${benefit.creditName}`);
    }
  }
  if (notes.length === 0) {
    return quote;
  }
  return {
    ...quote,
    priceCents,
    creditBackCents,
    membership: applied(entry),
    membershipNote: notes.join(' · '),
  };
}

export function applyFoodMembership(
  quote: FoodQuote,
  active: readonly ActiveMembership[],
): FoodQuote {
  const entry = membershipForProvider(active, quote.providerId);
  if (!entry) {
    return quote;
  }
  let fees = quote.fees;
  const shortfalls: number[] = [];
  for (const benefit of entry.program.benefits) {
    if (benefit.type !== 'delivery_fee_waived' && benefit.type !== 'service_fee_rate') {
      continue;
    }
    if (quote.subtotalCents < benefit.minSubtotalCents) {
      shortfalls.push(benefit.minSubtotalCents - quote.subtotalCents);
      continue;
    }
    fees = fees.map((fee) => {
      const base = fee.standardAmountCents ?? fee.amountCents;
      if (
        benefit.type === 'delivery_fee_waived' &&
        fee.kind === 'delivery' &&
        fee.amountCents > 0
      ) {
        return { ...fee, amountCents: 0, standardAmountCents: base };
      }
      if (benefit.type === 'service_fee_rate' && fee.kind === 'service') {
        const reduced = Math.round(quote.subtotalCents * benefit.rate);
        if (reduced < fee.amountCents) {
          return { ...fee, amountCents: reduced, standardAmountCents: base };
        }
      }
      return fee;
    });
  }
  const feeTotal = fees.reduce((sum, fee) => sum + fee.amountCents, 0);
  const changed = fees.some((fee) => fee.standardAmountCents !== null);
  const shortfall = shortfalls.length > 0 ? Math.max(...shortfalls) : 0;
  const membershipNote = changed
    ? `${entry.program.name} perks applied`
    : shortfall > 0
      ? `Add ${formatUsd(shortfall)} more for ${entry.program.name} perks`
      : null;
  return {
    ...quote,
    fees,
    totalBeforeTipCents: quote.subtotalCents + feeTotal + quote.taxCents,
    membership: changed ? applied(entry) : null,
    membershipNote,
  };
}
