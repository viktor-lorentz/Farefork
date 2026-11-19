import { z } from 'zod';

export const rideProviderIds = ['uber', 'lyft', 'waymo'] as const;
export const deliveryProviderIds = ['ubereats', 'doordash', 'grubhub', 'postmates'] as const;
export const providerIds = [...rideProviderIds, ...deliveryProviderIds] as const;

export const providerIdSchema = z.enum(providerIds);
export const rideProviderIdSchema = z.enum(rideProviderIds);

export type ProviderId = z.infer<typeof providerIdSchema>;
export type RideProviderId = (typeof rideProviderIds)[number];
export type DeliveryProviderId = (typeof deliveryProviderIds)[number];
export type Vertical = 'rides' | 'food';

export type ProviderInfo = {
  id: ProviderId;
  name: string;
  vertical: Vertical;
};

export const providers: Record<ProviderId, ProviderInfo> = {
  uber: { id: 'uber', name: 'Uber', vertical: 'rides' },
  lyft: { id: 'lyft', name: 'Lyft', vertical: 'rides' },
  waymo: { id: 'waymo', name: 'Waymo', vertical: 'rides' },
  ubereats: { id: 'ubereats', name: 'Uber Eats', vertical: 'food' },
  doordash: { id: 'doordash', name: 'DoorDash', vertical: 'food' },
  grubhub: { id: 'grubhub', name: 'Grubhub', vertical: 'food' },
  postmates: { id: 'postmates', name: 'Postmates', vertical: 'food' },
};

export function providerName(id: ProviderId): string {
  return providers[id].name;
}
