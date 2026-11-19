import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NewHandoff } from '@repo/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const PENDING_TTL_MS = 12 * 60 * 60 * 1000;

export type PendingHandoff = {
  handoff: NewHandoff;
  appName: string;
  openedAt: string;
};

type PendingState = {
  pending: PendingHandoff | null;
  setPending: (pending: PendingHandoff) => void;
  clearPending: () => void;
};

export const usePendingHandoff = create<PendingState>()(
  persist(
    (set) => ({
      pending: null,
      setPending: (pending) => {
        set({ pending });
      },
      clearPending: () => {
        set({ pending: null });
      },
    }),
    {
      name: 'app.pendingHandoff',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pending: state.pending }),
    },
  ),
);

export function isPendingFresh(pending: PendingHandoff | null, now: Date): boolean {
  return pending !== null && now.getTime() - Date.parse(pending.openedAt) < PENDING_TTL_MS;
}
