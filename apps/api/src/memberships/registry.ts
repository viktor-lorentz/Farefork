import { membershipCatalogSchema, type MembershipCatalog } from '@repo/shared';
import catalog20261101 from './config/2026-11-01.json' with { type: 'json' };

const catalogs: MembershipCatalog[] = [membershipCatalogSchema.parse(catalog20261101)];

export function catalogFor(date: Date = new Date()): MembershipCatalog {
  const day = date.toISOString().slice(0, 10);
  const eligible = catalogs
    .filter((catalog) => catalog.effectiveFrom <= day)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const current = eligible[0] ?? catalogs[0];
  if (!current) {
    throw new Error('No membership catalog configured');
  }
  return current;
}

export function allCatalogVersions(): string[] {
  return catalogs.map((catalog) => catalog.version);
}
