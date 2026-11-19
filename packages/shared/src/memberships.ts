import { z } from 'zod';
import { providerIdSchema } from './providers';

export const membershipProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  providerIds: z.array(providerIdSchema).min(1),
  summary: z.string(),
  available: z.boolean(),
  monthlyPriceCents: z.number().int().nonnegative().nullable(),
});

export type MembershipProgram = z.infer<typeof membershipProgramSchema>;

export const membershipCatalogSchema = z.object({
  version: z.string().min(1),
  effectiveFrom: z.iso.date(),
  programs: z.array(membershipProgramSchema),
});

export type MembershipCatalog = z.infer<typeof membershipCatalogSchema>;
