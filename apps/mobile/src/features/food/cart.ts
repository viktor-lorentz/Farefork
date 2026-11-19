import type { MenuItem } from '@repo/shared';

export type CartItem = {
  itemId: string;
  name: string;
  priceCents: number;
  quantity: number;
};

export type Cart = {
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
};

export type CartRestaurant = {
  id: string;
  name: string;
};

export const MAX_ITEM_QUANTITY = 20;

export function cartCount(cart: Cart | null): number {
  return cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export function cartInStoreCents(cart: Cart | null): number {
  return cart?.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0) ?? 0;
}

export function quantityOf(cart: Cart | null, restaurantId: string, itemId: string): number {
  if (cart?.restaurantId !== restaurantId) {
    return 0;
  }
  return cart.items.find((item) => item.itemId === itemId)?.quantity ?? 0;
}

export type CartUpdate = {
  cart: Cart | null;
  replacedFrom: string | null;
};

export function applyQuantity(
  cart: Cart | null,
  restaurant: CartRestaurant,
  item: MenuItem,
  quantity: number,
): CartUpdate {
  const clamped = Math.max(0, Math.min(MAX_ITEM_QUANTITY, Math.round(quantity)));
  const sameRestaurant = cart?.restaurantId === restaurant.id;
  if (!sameRestaurant && clamped === 0) {
    return { cart, replacedFrom: null };
  }
  const base = sameRestaurant ? cart.items : [];
  const nextItem: CartItem = {
    itemId: item.id,
    name: item.name,
    priceCents: item.priceCents,
    quantity: clamped,
  };
  const exists = base.some((entry) => entry.itemId === item.id);
  const items =
    clamped === 0
      ? base.filter((entry) => entry.itemId !== item.id)
      : exists
        ? base.map((entry) => (entry.itemId === item.id ? nextItem : entry))
        : [...base, nextItem];
  return {
    cart:
      items.length === 0
        ? null
        : { restaurantId: restaurant.id, restaurantName: restaurant.name, items },
    replacedFrom: cart !== null && !sameRestaurant ? cart.restaurantName : null,
  };
}
