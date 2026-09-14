import { describe, expect, it } from 'vitest';
import {
  formatDiopter,
  formatRx,
  formatSphere,
  formatStockParameters,
  parseFullRxText,
  parseSphereInput,
} from './formatDiopter';
import type { ToricAvailabilityMapping } from '../../domain/calculators/toricAvailability';

describe('parseSphereInput', () => {
  it('parses "Pln" (any case) as 0', () => {
    expect(parseSphereInput('Pln')).toBe(0);
    expect(parseSphereInput('pln')).toBe(0);
    expect(parseSphereInput('PLN')).toBe(0);
    expect(parseSphereInput('  Pln  ')).toBe(0);
  });

  it('falls back to numeric parsing for everything else', () => {
    expect(parseSphereInput('-4.00')).toBe(-4);
    expect(parseSphereInput('+1.50')).toBe(1.5);
    expect(Number.isNaN(parseSphereInput(''))).toBe(true);
    expect(Number.isNaN(parseSphereInput('plano'))).toBe(true);
  });
});

describe('formatSphere', () => {
  it('shows "Pln" for a zero sphere', () => {
    expect(formatSphere(0)).toBe('Pln');
    expect(formatSphere(-0)).toBe('Pln');
  });

  it('formats non-zero spheres normally', () => {
    expect(formatSphere(-4)).toBe('-4.00');
    expect(formatSphere(1.5)).toBe('+1.50');
  });
});

describe('formatRx', () => {
  it('uses "Pln" for a plano sphere but keeps normal cylinder formatting', () => {
    expect(formatRx({ sphere: 0, cylinder: -1.5, axis: 90 })).toBe('Pln / -1.50 x 90');
  });

  it('omits the "/ CYL x AXIS" tail for a spherical-only Rx (cylinder = 0)', () => {
    expect(formatRx({ sphere: -4, cylinder: 0, axis: 180 })).toBe('-4.00');
  });

  it('omits the tail for a plano, spherical-only Rx too', () => {
    expect(formatRx({ sphere: 0, cylinder: 0, axis: 90 })).toBe('Pln');
  });
});

describe('formatDiopter', () => {
  it('keeps "+0.00" for a generic (non-sphere-labeled) zero value', () => {
    expect(formatDiopter(0)).toBe('+0.00');
  });
});

describe('parseFullRxText', () => {
  it('parses a formatRx-canonical toric Rx string', () => {
    expect(parseFullRxText('-4.72 / -1.74 x 83')).toEqual({ sphere: -4.72, cylinder: -1.74, axis: 83 });
  });

  it('round-trips formatRx output exactly for a range of prescriptions', () => {
    const cases = [
      { sphere: -4.72, cylinder: -1.74, axis: 83 },
      { sphere: 0, cylinder: -1.5, axis: 90 },
      { sphere: 2, cylinder: 0.75, axis: 1 },
      { sphere: -6.5, cylinder: -2.25, axis: 180 },
    ];
    for (const rx of cases) {
      expect(parseFullRxText(formatRx(rx))).toEqual(rx);
    }
  });

  it('accepts "Pln" (any case) as a zero sphere', () => {
    expect(parseFullRxText('Pln / -1.50 x 90')).toEqual({ sphere: 0, cylinder: -1.5, axis: 90 });
    expect(parseFullRxText('pln / -1.50 x 90')).toEqual({ sphere: 0, cylinder: -1.5, axis: 90 });
    expect(parseFullRxText('PLN / -1.50 x 90')).toEqual({ sphere: 0, cylinder: -1.5, axis: 90 });
  });

  it('accepts "×" as well as "x" for the multiplication sign', () => {
    expect(parseFullRxText('-2.00 / -1.25 × 90')).toEqual({ sphere: -2, cylinder: -1.25, axis: 90 });
  });

  it('tolerates extra surrounding/internal whitespace', () => {
    expect(parseFullRxText('  -2.00  /  -1.25  x  90  ')).toEqual({ sphere: -2, cylinder: -1.25, axis: 90 });
  });

  it('accepts the space-separated shorthand (no "/") as an equally confident match', () => {
    expect(parseFullRxText('-2.00 -1.25 × 90')).toEqual({ sphere: -2, cylinder: -1.25, axis: 90 });
    expect(parseFullRxText('-2.00 -1.25 x 90')).toEqual({ sphere: -2, cylinder: -1.25, axis: 90 });
    expect(parseFullRxText('Pln -1.50 x 90')).toEqual({ sphere: 0, cylinder: -1.5, axis: 90 });
  });

  it('rejects sphere and cylinder with no separator at all between them (typo shape, not a real one)', () => {
    expect(parseFullRxText('-2.00-1.25 x 90')).toBeNull();
  });

  it('rejects a bare sphere value with no "/" tail — indistinguishable from a normal single-value paste', () => {
    expect(parseFullRxText('-4.00')).toBeNull();
    expect(parseFullRxText('Pln')).toBeNull();
  });

  it('rejects a zero cylinder — never produced by real formatRx output', () => {
    expect(parseFullRxText('-2.00 / 0.00 x 90')).toBeNull();
    expect(parseFullRxText('-2.00 / +0.00 x 90')).toBeNull();
  });

  it('rejects an out-of-range axis', () => {
    expect(parseFullRxText('-2.00 / -1.25 x 0')).toBeNull();
    expect(parseFullRxText('-2.00 / -1.25 x 181')).toBeNull();
  });

  it('rejects a non-integer axis', () => {
    expect(parseFullRxText('-2.00 / -1.25 x 90.5')).toBeNull();
  });

  it('rejects malformed or unrelated text without throwing or returning NaN', () => {
    expect(parseFullRxText('')).toBeNull();
    expect(parseFullRxText('not an rx')).toBeNull();
    expect(parseFullRxText('-2.00 / abc x 90')).toBeNull();
    expect(parseFullRxText('-2.00 -1.25 90')).toBeNull();
    expect(parseFullRxText('-2.00 / -1.25')).toBeNull();
  });
});

describe('formatStockParameters', () => {
  it('formats a spherical-only recommendation as a bare sphere', () => {
    const availability: ToricAvailabilityMapping = { sphere: -4.75, cylinderCandidatesD: [] };
    expect(formatStockParameters(availability)).toBe('-4.75');
  });

  it('formats a single unambiguous cylinder candidate in formatRx grammar', () => {
    const availability: ToricAvailabilityMapping = { sphere: -3, cylinderCandidatesD: [-0.75], axis: 90 };
    expect(formatStockParameters(availability)).toBe('-3.00 / -0.75 x 90');
  });

  it('round-trips a single-candidate recommendation through parseFullRxText', () => {
    const availability: ToricAvailabilityMapping = { sphere: -3, cylinderCandidatesD: [-0.75], axis: 90 };
    expect(parseFullRxText(formatStockParameters(availability))).toEqual({ sphere: -3, cylinder: -0.75, axis: 90 });
  });

  it('spells out both options on an exact tie rather than picking one', () => {
    const availability: ToricAvailabilityMapping = { sphere: 0, cylinderCandidatesD: [-1.75, -1.25], axis: 90 };
    expect(formatStockParameters(availability)).toBe('Pln / -1.75 or -1.25 x 90');
  });

  it('the tied-candidate text is not itself a confident parseFullRxText match', () => {
    const availability: ToricAvailabilityMapping = { sphere: 0, cylinderCandidatesD: [-1.75, -1.25], axis: 90 };
    expect(parseFullRxText(formatStockParameters(availability))).toBeNull();
  });
});
