import { describe, expect, it } from 'vitest';
import { clinicalTests, getClinicalTest, searchClinicalTests } from './clinicalTests';

describe('getClinicalTest', () => {
  it('finds a known test by id', () => {
    expect(getClinicalTest('double-maddox-rod')?.title).toBe('Double Maddox Rod');
  });

  it('finds the newly added Pinhole Test, Worth 4 Dot, and Schober Test', () => {
    expect(getClinicalTest('pinhole-test')?.title).toBe('Pinhole Test');
    expect(getClinicalTest('worth-4-dot')?.title).toBe('Worth 4 Dot');
    expect(getClinicalTest('schober-test')?.title).toBe('Schober Test (Cross Test)');
  });

  it('returns undefined for an unknown id', () => {
    expect(getClinicalTest('not-a-real-test')).toBeUndefined();
  });
});

describe('clinicalTests point-of-care shape', () => {
  // Schober and Maddox Rod have a bespoke visual quick-reference card (TestCard's
  // QUICK_CARDS) that covers setup/interpretation with diagrams instead of these fields.
  const HAS_VISUAL_QUICK_CARD = ['schober-test', 'maddox-rod'];

  it('every test lists at least one required item', () => {
    for (const test of clinicalTests) {
      expect(test.youNeed.length, `${test.id} -> youNeed`).toBeGreaterThan(0);
    }
  });

  it('every test without a visual quick card has at least one interpretation', () => {
    for (const test of clinicalTests) {
      if (HAS_VISUAL_QUICK_CARD.includes(test.id)) continue;
      expect(test.interpret?.length ?? 0, `${test.id} -> interpret`).toBeGreaterThan(0);
    }
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
