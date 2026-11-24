import {
  type DeliveryProviderId,
  type FeeLine,
  type FoodQuote,
  type LatLng,
  type MenuItem,
  providerName,
  type RestaurantDetail,
} from '@repo/shared';
import { seededRandom } from '../rides/random';

export const ESTIMATED_TAX_RATE = 0.0875;

export type DeliveryLine = {
  item: MenuItem;
  quantity: number;
};

export type DeliveryContext = {
  restaurant: RestaurantDetail;
  deliverTo: LatLng;
  distanceMeters: number;
  lines: readonly DeliveryLine[];
  now: Date;
};

export type DeliveryProviderResult =
  { status: 'ok'; quote: FoodQuote } | { status: 'unavailable'; reason: string };

export type DeliveryProvider = {
  id: DeliveryProviderId;
  getQuote(context: DeliveryContext): Promise<DeliveryProviderResult>;
};

export type DeliverySpec = {
  id: DeliveryProviderId;
  markup: readonly [min: number, max: number];
  inStorePriceChance: number;
  delivery: { baseCents: number; perKmCents: number; maxCents: number };
  service: { rate: number; minCents: number; maxCents: number | null };
  smallOrder: { thresholdCents: number; feeCents: number };
  etaOffset: readonly [min: number, max: number];
  maxDistanceMeters: number;
  orderUrl: (restaurantName: string) => string;
  appUrl: (restaurantName: string) => string;
};

export function priceFeeCents(cents: number): number {
  const stepped = Math.round(cents / 50) * 50 - 1;
  return Math.max(49, stepped);
}

export function markedUpCents(cents: number, markup: number): number {
  return Math.round((cents * (1 + markup)) / 5) * 5;
}

export function createMockDeliveryProvider(spec: DeliverySpec): DeliveryProvider {
  return {
    id: spec.id,
    getQuote(context) {
      const name = providerName(spec.id);
      if (!context.restaurant.providerIds.includes(spec.id)) {
        return Promise.resolve({
          status: 'unavailable',
          reason: `This restaurant isn’t on ${name}.`,
        });
      }
      if (context.distanceMeters > spec.maxDistanceMeters) {
        return Promise.resolve({
          status: 'unavailable',
          reason: `Too far for ${name} to deliver from this restaurant.`,
        });
      }
      const random = seededRandom(`delivery|${spec.id}|${context.restaurant.id}`);
      const markup = random.chance(spec.inStorePriceChance)
        ? 0
        : random.between(spec.markup[0], spec.markup[1]);
      const subtotalCents = context.lines.reduce(
        (sum, line) => sum + markedUpCents(line.item.priceCents, markup) * line.quantity,
        0,
      );
      const km = context.distanceMeters / 1000;
      const fees: FeeLine[] = [
        {
          kind: 'delivery',
          label: 'Delivery fee',
          amountCents: priceFeeCents(
            Math.min(
              spec.delivery.maxCents,
              spec.delivery.baseCents + spec.delivery.perKmCents * km,
            ),
          ),
          standardAmountCents: null,
        },
        {
          kind: 'service',
          label: 'Service fee',
          amountCents: Math.round(
            Math.min(
              spec.service.maxCents ?? Number.POSITIVE_INFINITY,
              Math.max(spec.service.minCents, subtotalCents * spec.service.rate),
            ),
          ),
          standardAmountCents: null,
        },
      ];
      if (subtotalCents < spec.smallOrder.thresholdCents) {
        fees.push({
          kind: 'small_order',
          label: 'Small order fee',
          amountCents: spec.smallOrder.feeCents,
          standardAmountCents: null,
        });
      }
      const taxCents = Math.round(subtotalCents * ESTIMATED_TAX_RATE);
      const feeTotal = fees.reduce((sum, fee) => sum + fee.amountCents, 0);
      const totalBeforeTipCents = subtotalCents + feeTotal + taxCents;
      const travelMinutes = Math.round(km * 2.6);
      return Promise.resolve({
        status: 'ok',
        quote: {
          providerId: spec.id,
          subtotalCents,
          fees,
          taxCents,
          totalBeforeTipCents,
          standardTotalBeforeTipCents: totalBeforeTipCents,
          membership: null,
          membershipNote: null,
          etaMinutes:
            context.restaurant.prepMinutes +
            travelMinutes +
            random.int(spec.etaOffset[0], spec.etaOffset[1]),
          orderUrl: spec.orderUrl(context.restaurant.name),
          appUrl: spec.appUrl(context.restaurant.name),
        },
      });
    },
  };
}

function searchUrl(base: string, param: string, value: string): string {
  const url = new URL(base);
  url.searchParams.set(param, value);
  return url.toString();
}

export const deliverySpecs: readonly DeliverySpec[] = [
  {
    id: 'ubereats',
    markup: [0.1, 0.2],
    inStorePriceChance: 0.15,
    delivery: { baseCents: 49, perKmCents: 90, maxCents: 599 },
    service: { rate: 0.15, minCents: 300, maxCents: null },
    smallOrder: { thresholdCents: 1000, feeCents: 200 },
    etaOffset: [4, 10],
    maxDistanceMeters: 9000,
    orderUrl: (name) => searchUrl('https://www.ubereats.com/search', 'q', name),
    appUrl: (name) => searchUrl('ubereats://search', 'q', name),
  },
  {
    id: 'doordash',
    markup: [0.08, 0.18],
    inStorePriceChance: 0.2,
    delivery: { baseCents: 99, perKmCents: 80, maxCents: 699 },
    service: { rate: 0.15, minCents: 300, maxCents: null },
    smallOrder: { thresholdCents: 1200, feeCents: 250 },
    etaOffset: [3, 9],
    maxDistanceMeters: 10000,
    orderUrl: (name) => `https://www.doordash.com/search/store/${encodeURIComponent(name)}/`,
    appUrl: (name) => `doordash://search/store/${encodeURIComponent(name)}/`,
  },
  {
    id: 'grubhub',
    markup: [0.05, 0.15],
    inStorePriceChance: 0.3,
    delivery: { baseCents: 49, perKmCents: 100, maxCents: 599 },
    service: { rate: 0.12, minCents: 250, maxCents: 1500 },
    smallOrder: { thresholdCents: 1000, feeCents: 200 },
    etaOffset: [6, 14],
    maxDistanceMeters: 8000,
    orderUrl: (name) => searchUrl('https://www.grubhub.com/search', 'queryText', name),
    appUrl: (name) => searchUrl('grubhub://search', 'queryText', name),
  },
  {
    id: 'postmates',
    markup: [0.1, 0.2],
    inStorePriceChance: 0.1,
    delivery: { baseCents: 99, perKmCents: 85, maxCents: 699 },
    service: { rate: 0.15, minCents: 300, maxCents: null },
    smallOrder: { thresholdCents: 1000, feeCents: 200 },
    etaOffset: [5, 12],
    maxDistanceMeters: 9000,
    orderUrl: (name) => searchUrl('https://postmates.com/search', 'q', name),
    appUrl: (name) => searchUrl('postmates://search', 'q', name),
  },
];

export function createMockDeliveryProviders(): DeliveryProvider[] {
  return deliverySpecs.map(createMockDeliveryProvider);
}
