import type { Place } from '@repo/shared';
import { currentLocationPlace } from '@/features/rides/location';
import { useFood } from '@/stores/food';
import { useDeviceLocation } from '@/stores/location';

export function useDeliveryAddress(): Place | null {
  const deliverTo = useFood((state) => state.deliverTo);
  const lastKnown = useDeviceLocation((state) => state.lastKnown);
  if (deliverTo) {
    return deliverTo;
  }
  return lastKnown ? currentLocationPlace(lastKnown) : null;
}
