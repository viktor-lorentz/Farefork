import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MenuItem, Place } from '@repo/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyQuantity, type Cart, type CartRestaurant } from '@/features/food/cart';

type FoodState = {
  deliverTo: Place | null;
  cart: Cart | null;
  replacedCartFrom: string | null;
};

type FoodActions = {
  setDeliverTo: (place: Place) => void;
  setQuantity: (restaurant: CartRestaurant, item: MenuItem, quantity: number) => void;
  clearCart: () => void;
  dismissReplacedNotice: () => void;
};

export const useFood = create<FoodState & FoodActions>()(
  persist(
    (set) => ({
      deliverTo: null,
      cart: null,
      replacedCartFrom: null,
      setDeliverTo: (deliverTo) => {
        set({ deliverTo });
      },
      setQuantity: (restaurant, item, quantity) => {
        set((state) => {
          const update = applyQuantity(state.cart, restaurant, item, quantity);
          return {
            cart: update.cart,
            replacedCartFrom: update.replacedFrom ?? state.replacedCartFrom,
          };
        });
      },
      clearCart: () => {
        set({ cart: null, replacedCartFrom: null });
      },
      dismissReplacedNotice: () => {
        set({ replacedCartFrom: null });
      },
    }),
    {
      name: 'app.food',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ deliverTo: state.deliverTo, cart: state.cart }),
    },
  ),
);
