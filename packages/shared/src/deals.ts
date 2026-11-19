import { z } from 'zod';
import { providerIdSchema } from './providers';

export const dealKindSchema = z.enum(['ride', 'food']);
export type DealKind = z.infer<typeof dealKindSchema>;

export const dealSchema = z.object({
  id: z.string().min(1),
  providerId: providerIdSchema,
  kind: dealKindSchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  code: z.string().nullable(),
  estimatedSavingsCents: z.number().int().nonnegative(),
  minSubtotalCents: z.number().int().nonnegative().nullable(),
  newCustomersOnly: z.boolean(),
  membershipProgramId: z.string().nullable(),
  membershipName: z.string().nullable(),
  eligible: z.boolean(),
  startsAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});

export type Deal = z.infer<typeof dealSchema>;

export const dealsQuerySchema = z.object({
  kind: dealKindSchema.optional(),
  membershipIds: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(',').filter(Boolean) : []))
    .pipe(z.array(z.string().min(1).max(60)).max(12)),
});

export const dealsResponseSchema = z.object({
  simulated: z.literal(true),
  generatedAt: z.iso.datetime(),
  deals: z.array(dealSchema),
});

export type DealsResponse = z.infer<typeof dealsResponseSchema>;
