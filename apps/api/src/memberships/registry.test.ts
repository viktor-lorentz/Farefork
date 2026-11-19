import { providerIds } from '@repo/shared';
import { describe, expect, it } from 'vitest';
import { allCatalogVersions, catalogFor } from './registry';

describe('membership registry', () => {
  it('returns the active catalog for a date', () => {
    expect(catalogFor(new Date('2026-11-18T12:00:00Z')).version).toBe('2026-11-01');
  });

  it('falls back to the earliest catalog before any effective date', () => {
    expect(catalogFor(new Date('2020-01-01T00:00:00Z')).version).toBe('2026-11-01');
  });

  it('has unique program ids and only known providers', () => {
    for (const version of allCatalogVersions()) {
      const catalog = catalogFor(new Date(`${version}T00:00:00Z`));
      const ids = catalog.programs.map((program) => program.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const program of catalog.programs) {
        for (const providerId of program.providerIds) {
          expect(providerIds).toContain(providerId);
        }
      }
    }
  });

  it('never prices unavailable programs', () => {
    const catalog = catalogFor(new Date('2026-11-18T00:00:00Z'));
    for (const program of catalog.programs.filter((item) => !item.available)) {
      expect(program.monthlyPriceCents).toBeNull();
    }
  });
});
