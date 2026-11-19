import { z } from 'zod';
import { providerIdSchema } from './providers';

export const membershipRideClassSchema = z.enum(['economy', 'comfort', 'xl', 'premium']);

export const membershipBenefitSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ride_percent_off'),
    percent: z.number().positive().max(50),
    maxCents: z.number().int().positive().nullable(),
    rideClasses: z.array(membershipRideClassSchema).min(1).nullable(),
  }),
  z.object({
    type: z.literal('ride_credit_back'),
    percent: z.number().positive().max(50),
    creditName: z.string().min(1),
    rideClasses: z.array(membershipRideClassSchema).min(1).nullable(),
  }),
  z.object({
    type: z.literal('delivery_fee_waived'),
    minSubtotalCents: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('service_fee_rate'),
    rate: z.number().min(0).max(1),
    minSubtotalCents: z.number().int().nonnegative(),
  }),
]);

export type MembershipBenefit = z.infer<typeof membershipBenefitSchema>;

export const membershipTierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  billing: z.enum(['monthly', 'annual']),
  monthlyPriceCents: z.number().int().nonnegative(),
});

export type MembershipTier = z.infer<typeof membershipTierSchema>;

export const membershipProgramSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  providerIds: z.array(providerIdSchema).min(1),
  summary: z.string(),
  available: z.boolean(),
  tiers: z.array(membershipTierSchema),
  benefits: z.array(membershipBenefitSchema),
});

export type MembershipProgram = z.infer<typeof membershipProgramSchema>;

export const membershipCatalogSchema = z.object({
  version: z.string().min(1),
  effectiveFrom: z.iso.date(),
  programs: z.array(membershipProgramSchema),
});

export type MembershipCatalog = z.infer<typeof membershipCatalogSchema>;

export const appliedMembershipSchema = z.object({
  programId: z.string().min(1),
  tierId: z.string().min(1),
  name: z.string().min(1),
});

export type AppliedMembership = z.infer<typeof appliedMembershipSchema>;

export const membershipIdsSchema = z.array(z.string().min(1).max(60)).max(12).default([]);

export function cheapestTier(program: MembershipProgram): MembershipTier | null {
  return [...program.tiers].sort((a, b) => a.monthlyPriceCents - b.monthlyPriceCents)[0] ?? null;
}

export function selectedTier(
  program: MembershipProgram,
  membershipIds: readonly string[],
): MembershipTier | null {
  return (
    program.tiers.find((tier) => membershipIds.includes(tier.id)) ??
    (membershipIds.includes(program.id) ? (program.tiers[0] ?? null) : null)
  );
}
