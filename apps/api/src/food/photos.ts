import {
  type Cuisine,
  cuisineIds,
  type RestaurantPhoto,
  restaurantPhotoSchema,
} from '@repo/shared';
import { z } from 'zod';
import photoData from './photos.json' with { type: 'json' };
import { seededRandom } from '../rides/random';

const photoLibrary = z
  .record(z.enum(cuisineIds), z.array(restaurantPhotoSchema).min(1))
  .parse(photoData);

export function photoFor(restaurantId: string, cuisine: Cuisine): RestaurantPhoto {
  const options = photoLibrary[cuisine];
  const index = seededRandom(`photo|${restaurantId}`).int(0, options.length - 1);
  const photo = options[index] ?? options[0];
  if (!photo) {
    throw new Error(`No photos for ${cuisine}`);
  }
  return photo;
}
