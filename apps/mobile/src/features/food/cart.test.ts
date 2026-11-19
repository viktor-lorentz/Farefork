import type { MenuItem } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { applyQuantity, cartCount, cartInStoreCents, MAX_ITEM_QUANTITY, quantityOf } from './cart';

const tacos: MenuItem = {
  id: 'mains.tacos',
  name: 'Tacos',
  description: '',
  priceCents: 1150,
  popular: false,
};
const chips: MenuItem = {
  id: 'sides.chips',
  name: 'Chips',
  description: '',
  priceCents: 795,
  popular: false,
};
const casa = { id: 'r_1_1_0', name: 'Casa Cilantro' };
const slice = { id: 'r_1_1_1', name: 'Slice Theory' };

describe('applyQuantity', () => {
  it('adds, updates and removes items', () => {
    let cart = applyQuantity(null, casa, tacos, 1).cart;
    cart = applyQuantity(cart, casa, chips, 2).cart;
    cart = applyQuantity(cart, casa, tacos, 3).cart;
    expect(cartCount(cart)).toBe(5);
    expect(cartInStoreCents(cart)).toBe(1150 * 3 + 795 * 2);
    expect(quantityOf(cart, casa.id, tacos.id)).toBe(3);
    cart = applyQuantity(cart, casa, tacos, 0).cart;
    cart = applyQuantity(cart, casa, chips, 0).cart;
    expect(cart).toBeNull();
  });

  it('clamps quantities', () => {
    const cart = applyQuantity(null, casa, tacos, 99).cart;
    expect(quantityOf(cart, casa.id, tacos.id)).toBe(MAX_ITEM_QUANTITY);
  });

  it('starts a new cart for another restaurant and reports the old one', () => {
    const first = applyQuantity(null, casa, tacos, 1).cart;
    const update = applyQuantity(first, slice, chips, 1);
    expect(update.cart?.restaurantId).toBe(slice.id);
    expect(update.cart?.items).toHaveLength(1);
    expect(update.replacedFrom).toBe('Casa Cilantro');
    expect(quantityOf(update.cart, casa.id, tacos.id)).toBe(0);
  });

  it('ignores removing an item from a restaurant that is not in the cart', () => {
    const first = applyQuantity(null, casa, tacos, 1).cart;
    expect(applyQuantity(first, slice, chips, 0)).toEqual({ cart: first, replacedFrom: null });
  });
});
