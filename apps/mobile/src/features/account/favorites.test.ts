import type { Place } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { restaurantFavorite, routeFavorite } from './favorites';

const home: Place = { id: 'a', name: 'Home', address: '1 Main', latitude: 37.1, longitude: -122.2 };
const work: Place = { id: 'b', name: 'Work', address: '2 Main', latitude: 37.3, longitude: -122.4 };
const here: Place = { ...home, id: 'current-location', name: 'Current location' };

describe('favorites', () => {
  it('keys a route by both ends', () => {
    expect(routeFavorite(home, work, false)).toMatchObject({
      kind: 'route',
      key: '37.1000,-122.2000>37.3000,-122.4000',
      title: 'Home to Work',
      subtitle: null,
    });
  });

  it('saves a route from the current location without storing where you are', () => {
    const favorite = routeFavorite(here, work, true);
    expect(favorite.key).toBe('here>37.3000,-122.4000');
    expect(favorite.payload).toEqual({ pickup: null, dropoff: work });
    expect(favorite.subtitle).toBe('From where you are');
  });

  it('keys a restaurant by id', () => {
    expect(restaurantFavorite({ id: 'r_1_2_0', name: 'Cedar' }, 'Mediterranean').key).toBe(
      'r_1_2_0',
    );
  });
});
