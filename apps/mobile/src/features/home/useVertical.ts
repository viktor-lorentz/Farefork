import { create } from 'zustand';
import type { Vertical } from '@repo/shared';

type VerticalState = {
  vertical: Vertical;
  setVertical: (vertical: Vertical) => void;
};

export const useVertical = create<VerticalState>()((set) => ({
  vertical: 'rides',
  setVertical: (vertical) => {
    set({ vertical });
  },
}));
