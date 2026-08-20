import { describe, expect, it } from 'vitest';
import { clinicalTests, getClinicalTest, searchClinicalTests } from './clinicalTests';

describe('getClinicalTest', () => {
  it('finds a known test by id', () => {
    expect(getClinicalTest('double-maddox-rod')?.title).toBe('Double Maddox Rod');
  });

  it('returns undefined for an unknown id', () => {
    expect(getClinicalTest('not-a-real-test')).toBeUndefined();
  });
});

describe('searchClinicalTests', () => {
  it('returns every test for an empty query', () => {
    expect(searchClinicalTests('')).toEqual(clinicalTests);
  });

  it('matches by title, case-insensitively', () => {
    const results = searchClinicalTests('maddox');
    const ids = results.map((t) => t.id);
    expect(ids).toContain('maddox-rod');
    expect(ids).toContain('double-maddox-rod');
  });

  it('matches by tag', () => {
    const results = searchClinicalTests('torsion');
    expect(results.map((t) => t.id)).toContain('double-maddox-rod');
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchClinicalTests('nonexistent-xyz')).toEqual([]);
  });
});
