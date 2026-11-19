import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Place } from '@repo/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const CURRENT_LOCATION_ID = 'current-location';
const MAX_RECENTS = 8;

type TripState = {
  pickup: Place | null;
  dropoff: Place | null;
  recents: Place[];
};

type TripActions = {
  setTrip: (pickup: Place, dropoff: Place) => void;
  clearTrip: () => void;
  addRecent: (place: Place) => void;
  removeRecent: (placeId: string) => void;
};

export function isCurrentLocation(place: Place | null): boolean {
  return place?.id === CURRENT_LOCATION_ID;
}

export const useTrip = create<TripState & TripActions>()(
  persist(
    (set) => ({
      pickup: null,
      dropoff: null,
      recents: [],
      setTrip: (pickup, dropoff) => {
        set({ pickup, dropoff });
      },
      clearTrip: () => {
        set({ pickup: null, dropoff: null });
      },
      addRecent: (place) => {
        if (place.id === CURRENT_LOCATION_ID) {
          return;
        }
        set((state) => ({
          recents: [place, ...state.recents.filter((item) => item.id !== place.id)].slice(
            0,
            MAX_RECENTS,
          ),
        }));
      },
      removeRecent: (placeId) => {
        set((state) => ({ recents: state.recents.filter((item) => item.id !== placeId) }));
      },
    }),
    {
      name: 'app.rides',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ recents: state.recents }),
    },
  ),
);
