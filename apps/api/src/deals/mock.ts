import type { Deal, DealKind, ProviderId } from '@repo/shared';
import { resolveMemberships } from '../memberships/pricing';
import { catalogFor } from '../memberships/registry';
import { seededRandom } from '../rides/random';

export type DealsQuery = {
  kind?: DealKind;
  membershipIds: readonly string[];
  now: Date;
};

export type DealsSource = {
  list(query: DealsQuery): Promise<Deal[]>;
};

type DealTemplate = {
  key: string;
  title: string;
  detail: string;
  estimatedSavingsCents: number;
  minSubtotalCents?: number;
  newCustomersOnly?: boolean;
  membershipProgramId?: string;
  days: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const templates: Record<ProviderId, { kind: DealKind; offers: DealTemplate[] }> = {
  uber: {
    kind: 'ride',
    offers: [
      {
        key: 'two_rides',
        title: '20% off your next 2 rides',
        detail: 'Up to $5 off each UberX or Comfort ride.',
        estimatedSavingsCents: 1000,
        days: 7,
      },
      {
        key: 'airport',
        title: '$8 off an airport ride',
        detail: 'One ride to or from a major airport.',
        estimatedSavingsCents: 800,
        days: 5,
      },
      {
        key: 'one_credit',
        title: '10% back in Uber One credits',
        detail: 'Extra credits on rides this week for members.',
        estimatedSavingsCents: 400,
        membershipProgramId: 'uber_one',
        days: 7,
      },
    ],
  },
  lyft: {
    kind: 'ride',
    offers: [
      {
        key: 'three_rides',
        title: '15% off 3 rides',
        detail: 'Up to $4 off each standard ride.',
        estimatedSavingsCents: 1200,
        days: 7,
      },
      {
        key: 'pink_priority',
        title: 'Lyft Pink: 10% off XL',
        detail: 'For members, on XL rides this week.',
        estimatedSavingsCents: 600,
        membershipProgramId: 'lyft_pink',
        days: 6,
      },
      {
        key: 'night',
        title: '$5 off late-night rides',
        detail: 'One ride between 10 PM and 4 AM.',
        estimatedSavingsCents: 500,
        days: 4,
      },
    ],
  },
  waymo: {
    kind: 'ride',
    offers: [
      {
        key: 'first',
        title: '$10 off your first Waymo ride',
        detail: 'For new riders in Waymo service areas.',
        estimatedSavingsCents: 1000,
        newCustomersOnly: true,
        days: 14,
      },
    ],
  },
  ubereats: {
    kind: 'food',
    offers: [
      {
        key: 'spend_save',
        title: 'Spend $30, save $8',
        detail: 'At participating restaurants.',
        estimatedSavingsCents: 800,
        minSubtotalCents: 3000,
        days: 5,
      },
      {
        key: 'free_delivery',
        title: '$0 delivery fee on orders over $20',
        detail: 'Service fee and tax still apply.',
        estimatedSavingsCents: 399,
        minSubtotalCents: 2000,
        days: 7,
      },
    ],
  },
  doordash: {
    kind: 'food',
    offers: [
      {
        key: 'dashpass_20',
        title: 'DashPass: 20% off, up to $10',
        detail: 'One order from a participating restaurant.',
        estimatedSavingsCents: 1000,
        minSubtotalCents: 2000,
        membershipProgramId: 'dashpass',
        days: 7,
      },
      {
        key: 'off_25',
        title: '$6 off orders of $25 or more',
        detail: 'At participating restaurants.',
        estimatedSavingsCents: 600,
        minSubtotalCents: 2500,
        days: 4,
      },
    ],
  },
  grubhub: {
    kind: 'food',
    offers: [
      {
        key: 'off_25',
        title: '$7 off $25 or more',
        detail: 'At participating restaurants.',
        estimatedSavingsCents: 700,
        minSubtotalCents: 2500,
        days: 6,
      },
      {
        key: 'plus_free',
        title: 'Grubhub+: an extra $5 off',
        detail: 'One order over $30 for members.',
        estimatedSavingsCents: 500,
        minSubtotalCents: 3000,
        membershipProgramId: 'grubhub_plus',
        days: 7,
      },
    ],
  },
  postmates: {
    kind: 'food',
    offers: [
      {
        key: 'first',
        title: '40% off your first order',
        detail: 'Up to $15 off, for new customers.',
        estimatedSavingsCents: 1500,
        minSubtotalCents: 1500,
        newCustomersOnly: true,
        days: 14,
      },
      {
        key: 'off_20',
        title: '$5 off $20 or more',
        detail: 'At participating restaurants.',
        estimatedSavingsCents: 500,
        minSubtotalCents: 2000,
        days: 5,
      },
    ],
  },
};

export function weekStart(now: Date): Date {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - weekday * DAY_MS);
}

export function createMockDealsSource(): DealsSource {
  return {
    list({ kind, membershipIds, now }) {
      const start = weekStart(now);
      const week = Math.floor(start.getTime() / WEEK_MS);
      const catalog = catalogFor(now);
      const memberPrograms = new Set(
        resolveMemberships(catalog, membershipIds).map((entry) => entry.program.id),
      );
      const deals: Deal[] = [];
      for (const [providerId, group] of Object.entries(templates) as [
        ProviderId,
        (typeof templates)[ProviderId],
      ][]) {
        if (kind !== undefined && group.kind !== kind) {
          continue;
        }
        const live = new Map<string, Deal>();
        for (const cycle of [week - 1, week]) {
          const cycleStart = start.getTime() - (week - cycle) * WEEK_MS;
          const random = seededRandom(`deals|${cycle}|${providerId}`);
          const featured = cycle % group.offers.length;
          group.offers.forEach((offer, index) => {
            const isFeatured = index === featured;
            if (!isFeatured && !random.chance(0.6)) {
              return;
            }
            const startsAt = new Date(cycleStart + (isFeatured ? 0 : random.int(0, 3)) * DAY_MS);
            const days = isFeatured ? Math.max(offer.days, 7) : offer.days;
            const expiresAt = new Date(startsAt.getTime() + days * DAY_MS);
            if (expiresAt.getTime() <= now.getTime() || startsAt.getTime() > now.getTime()) {
              return;
            }
            const program = catalog.programs.find(
              (entry) => entry.id === offer.membershipProgramId,
            );
            live.set(offer.key, {
              id: `${providerId}.${offer.key}.${cycle}`,
              providerId,
              kind: group.kind,
              title: offer.title,
              detail: offer.detail,
              code: null,
              estimatedSavingsCents: offer.estimatedSavingsCents,
              minSubtotalCents: offer.minSubtotalCents ?? null,
              newCustomersOnly: offer.newCustomersOnly ?? false,
              membershipProgramId: offer.membershipProgramId ?? null,
              membershipName: program?.name ?? null,
              eligible:
                offer.membershipProgramId === undefined ||
                memberPrograms.has(offer.membershipProgramId),
              startsAt: startsAt.toISOString(),
              expiresAt: expiresAt.toISOString(),
            });
          });
        }
        deals.push(...live.values());
      }
      deals.sort(
        (a, b) =>
          Number(b.eligible) - Number(a.eligible) ||
          b.estimatedSavingsCents - a.estimatedSavingsCents,
      );
      return Promise.resolve(deals);
    },
  };
}
