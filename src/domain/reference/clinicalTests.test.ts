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

  it('finds the newly added Von Graefe Technique', () => {
    expect(getClinicalTest('von-graefe-test')?.title).toBe('Von Graefe Technique');
  });

  it('returns undefined for an unknown id', () => {
    expect(getClinicalTest('not-a-real-test')).toBeUndefined();
  });
});

describe('clinicalTests point-of-care shape', () => {
  // These tests have a bespoke visual quick-reference card (TestCard's QUICK_CARDS) that
  // covers setup/interpretation itself — Schober/Maddox Rod with diagrams, MAF/BAF/Vergence
  // Facility with a flip-sequence instruction card — instead of the generic text fields below.
  const HAS_VISUAL_QUICK_CARD = [
    'cover-test',
    'schober-test',
    'maddox-rod',
    'von-graefe-test',
    'double-maddox-rod',
    'worth-4-dot',
    'monocular-accommodative-facility-test',
    'binocular-accommodative-facility-test',
    'vergence-facility-test',
    'parks-3-step',
  ];

  it('every test lists at least one required item', () => {
    for (const test of clinicalTests) {
      expect(test.youNeed.length, `${test.id} -> youNeed`).toBeGreaterThan(0);
    }
  });

  it('every test without a visual quick card has at least one interpretation (full table or a one-line reminder)', () => {
    for (const test of clinicalTests) {
      if (HAS_VISUAL_QUICK_CARD.includes(test.id)) continue;
      const hasInterpretation = (test.interpret?.length ?? 0) > 0 || !!test.quickInterpretReminder;
      expect(hasInterpretation, `${test.id} -> interpret or quickInterpretReminder`).toBe(true);
    }
  });

  it('a test with a keyAnchorCaption always has a keyAnchor to caption', () => {
    for (const test of clinicalTests) {
      if (test.keyAnchorCaption) {
        expect(test.keyAnchor, `${test.id} -> keyAnchorCaption without a keyAnchor`).toBeTruthy();
      }
    }
  });

  it('MAF does not overclaim a mandatory starting lens in its background notes — phrased as convention, not a requirement', () => {
    const maf = getClinicalTest('monocular-accommodative-facility-test')!;
    const details = maf.moreSections!.flatMap((section) => section.items).join(' ');
    expect(details).toContain('not a strict requirement');
    expect(details.toLowerCase()).not.toContain('must start');
  });
});

describe('NRA/PRA <-> MAF direction mapping (regression: this pairing was previously inverted)', () => {
  // Reduced PRA (can't stimulate more accommodation) corroborates MINUS-side MAF difficulty
  // (also a stimulate-accommodation limitation) and points toward Accommodative Insufficiency —
  // never plus-side, which is the Accommodative Excess direction instead.
  it('nra-pra-test pairs low PRA with minus-side MAF difficulty, not plus-side', () => {
    const test = getClinicalTest('nra-pra-test')!;
    const allText = [test.quickInterpretReminder, ...(test.moreSections?.flatMap((s) => s.items) ?? [])].join(' ');
    expect(allText).toMatch(/low PRA[^.]*minus-side/i);
    expect(allText).not.toMatch(/PRA[^.]*plus-side/i);
  });

  it('percival-criterion pairs reduced PRA with minus-side MAF difficulty, not plus-side', () => {
    const test = getClinicalTest('percival-criterion')!;
    const allText = test.moreSections!.flatMap((s) => s.items).join(' ');
    expect(allText).toMatch(/reduced PRA\/minus-side/i);
    expect(allText).not.toMatch(/PRA\/plus-side/i);
  });

  it('the Monocular Accommodative Facility card itself still states the correct direction (unchanged reference point)', () => {
    const maf = getClinicalTest('monocular-accommodative-facility-test')!;
    const details = maf.moreSections!.flatMap((section) => section.items).join(' ');
    expect(details).toMatch(/clearing PLUS suggests difficulty relaxing/i);
    expect(details).toMatch(/clearing MINUS suggests difficulty stimulating/i);
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

  it('matches Von Graefe by title', () => {
    const results = searchClinicalTests('graefe');
    expect(results.map((t) => t.id)).toContain('von-graefe-test');
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchClinicalTests('nonexistent-xyz')).toEqual([]);
  });
});
