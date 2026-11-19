import { z } from 'zod';
import { latLngSchema } from './geo';
import { appliedMembershipSchema, membershipIdsSchema } from './memberships';
import { deliveryProviderIds } from './providers';

export const deliveryProviderIdSchema = z.enum(deliveryProviderIds);

export const cuisineIds = [
  'pizza',
  'burgers',
  'mexican',
  'sushi',
  'thai',
  'indian',
  'chinese',
  'mediterranean',
  'salads',
  'breakfast',
  'italian',
  'american',
  'vietnamese',
  'korean',
  'cafe',
] as const;

export const cuisineSchema = z.enum(cuisineIds);
export type Cuisine = z.infer<typeof cuisineSchema>;

export const cuisineLabels: Record<Cuisine, string> = {
  pizza: 'Pizza',
  burgers: 'Burgers',
  mexican: 'Mexican',
  sushi: 'Sushi',
  thai: 'Thai',
  indian: 'Indian',
  chinese: 'Chinese',
  mediterranean: 'Mediterranean',
  salads: 'Salads',
  breakfast: 'Breakfast',
  italian: 'Italian',
  american: 'American',
  vietnamese: 'Vietnamese',
  korean: 'Korean',
  cafe: 'Café',
};

export const restaurantSourceSchema = z.enum(['openstreetmap', 'sample']);
export type RestaurantSource = z.infer<typeof restaurantSourceSchema>;

export const restaurantPhotoSchema = z.object({
  url: z.url(),
  path: z
    .string()
    .regex(/^\/v1\/photos\/[a-z]+-\d{1,3}\.jpg$/)
    .nullable(),
  author: z.string().min(1),
  license: z.string().min(1),
  sourceUrl: z.url().nullable(),
});

export type RestaurantPhoto = z.infer<typeof restaurantPhotoSchema>;

export const restaurantSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cuisine: cuisineSchema,
  latitude: z.number(),
  longitude: z.number(),
  distanceMeters: z.number().nonnegative(),
  priceLevel: z.number().int().min(1).max(3),
  prepMinutes: z.number().int().positive(),
  providerIds: z.array(deliveryProviderIdSchema).min(1),
  address: z.string().nullable(),
  photo: restaurantPhotoSchema.nullable(),
  source: restaurantSourceSchema,
});

export type RestaurantSummary = z.infer<typeof restaurantSummarySchema>;

export const menuItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  priceCents: z.number().int().positive(),
  popular: z.boolean(),
});

export type MenuItem = z.infer<typeof menuItemSchema>;

export const menuCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  items: z.array(menuItemSchema),
});

export type MenuCategory = z.infer<typeof menuCategorySchema>;

export const restaurantDetailSchema = restaurantSummarySchema.extend({
  categories: z.array(menuCategorySchema),
});

export type RestaurantDetail = z.infer<typeof restaurantDetailSchema>;

export const restaurantSearchResponseSchema = z.object({
  simulated: z.literal(true),
  restaurants: z.array(restaurantSummarySchema),
});

export type RestaurantSearchResponse = z.infer<typeof restaurantSearchResponseSchema>;

export const restaurantDetailResponseSchema = z.object({
  simulated: z.literal(true),
  restaurant: restaurantDetailSchema,
});

export const cartLineSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export type CartLine = z.infer<typeof cartLineSchema>;

export const foodQuotesRequestSchema = z.object({
  restaurantId: z.string().min(1).max(80),
  deliverTo: latLngSchema,
  items: z.array(cartLineSchema).min(1).max(30),
  membershipIds: membershipIdsSchema,
});

export type FoodQuotesRequest = z.infer<typeof foodQuotesRequestSchema>;
export type FoodQuotesRequestInput = z.input<typeof foodQuotesRequestSchema>;

export const feeKinds = ['delivery', 'service', 'small_order'] as const;
export const feeKindSchema = z.enum(feeKinds);
export type FeeKind = z.infer<typeof feeKindSchema>;

export const feeLineSchema = z.object({
  kind: feeKindSchema,
  label: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  standardAmountCents: z.number().int().nonnegative().nullable(),
});

export type FeeLine = z.infer<typeof feeLineSchema>;

export const foodQuoteSchema = z.object({
  providerId: deliveryProviderIdSchema,
  subtotalCents: z.number().int().nonnegative(),
  fees: z.array(feeLineSchema),
  taxCents: z.number().int().nonnegative(),
  totalBeforeTipCents: z.number().int().nonnegative(),
  standardTotalBeforeTipCents: z.number().int().nonnegative(),
  membership: appliedMembershipSchema.nullable(),
  membershipNote: z.string().nullable(),
  etaMinutes: z.number().int().positive(),
  orderUrl: z.url(),
  appUrl: z.string().min(1).nullable(),
});

export type FoodQuote = z.infer<typeof foodQuoteSchema>;

export const unavailableDeliverySchema = z.object({
  providerId: deliveryProviderIdSchema,
  reason: z.string().min(1),
});

export type UnavailableDelivery = z.infer<typeof unavailableDeliverySchema>;

export const foodQuotesResponseSchema = z.object({
  simulated: z.literal(true),
  generatedAt: z.iso.datetime(),
  restaurantId: z.string().min(1),
  inStoreSubtotalCents: z.number().int().nonnegative(),
  quotes: z.array(foodQuoteSchema),
  unavailable: z.array(unavailableDeliverySchema),
});

export type FoodQuotesResponse = z.infer<typeof foodQuotesResponseSchema>;

export const foodErrorCodes = {
  restaurantNotFound: 'restaurant_not_found',
  unknownItem: 'unknown_menu_item',
} as const;
