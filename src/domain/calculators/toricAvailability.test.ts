import { describe, expect, it } from 'vitest';
import { GENERIC_TORIC_AVAILABILITY_PROFILE, exceedsCommonStockCylinderRange, mapToAvailability } from './toricAvailability';

const profile = GENERIC_TORIC_AVAILABILITY_PROFILE;

describe('mapToAvailability — sphere', () => {
  it('rounds sphere to the nearest 0.25 D step', () => {
    expect(mapToAvailability({ sphere: -4.1, cylinder: -0.75, axis: 90 }, profile).sphere).toBeCloseTo(-4.0);
    expect(mapToAvailability({ sphere: -4.13, cylinder: -0.75, axis: 90 }, profile).sphere).toBeCloseTo(-4.25);
  });
});

describe('mapToAvailability — cylinder', () => {
  it('picks the single nearest configured cylinder when unambiguous', () => {
    const result = mapToAvailability({ sphere: 0, cylinder: -1.3, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([-1.25]);
  });

  it('surfaces both candidates on an exact tie rather than picking one', () => {
    // -1.50 is exactly equidistant between the configured -1.25 and -1.75.
    const result = mapToAvailability({ sphere: 0, cylinder: -1.5, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([-1.75, -1.25]);
  });

  it('recommends spherical rather than rounding up to the smallest configured cylinder when below range', () => {
    const result = mapToAvailability({ sphere: 0, cylinder: -0.3, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([]);
  });

  it('maps to the largest configured cylinder rather than extrapolating beyond range', () => {
    const result = mapToAvailability({ sphere: 0, cylinder: -4.0, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([-2.75]);
  });
});

describe('mapToAvailability — spherical-only (cylinder = 0)', () => {
  it('reports no cylinder candidates for an exactly spherical result', () => {
    const result = mapToAvailability({ sphere: -4.75, cylinder: 0, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([]);
  });

  it('does not snap cylinder = 0 to the nearest configured toric cylinder', () => {
    // -0.3 (nonzero) maps to -0.75; exactly 0 must not, since it isn't a "small" cylinder — it's none.
    const result = mapToAvailability({ sphere: -4.75, cylinder: 0, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).not.toEqual([-0.75]);
  });

  it('still rounds sphere to the nearest step when spherical-only', () => {
    const result = mapToAvailability({ sphere: -4.13, cylinder: 0, axis: 90 }, profile);
    expect(result.sphere).toBeCloseTo(-4.25);
  });

  it('omits axis when spherical-only', () => {
    const result = mapToAvailability({ sphere: -4.75, cylinder: 0, axis: 90 }, profile);
    expect(result.axis).toBeUndefined();
  });
});

describe('mapToAvailability — below the smallest available toric cylinder', () => {
  it('recommends spherical (via spherical equivalent) just below the 0.75 D threshold, not rounded up to toric', () => {
    // SE = -3 + (-0.74 / 2) = -3.37 -> nearest 0.25 step is -3.25.
    const result = mapToAvailability({ sphere: -3, cylinder: -0.74, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([]);
    expect(result.sphere).toBeCloseTo(-3.25);
    expect(result.axis).toBeUndefined();
  });

  it('keeps the toric recommendation exactly at the 0.75 D threshold', () => {
    const result = mapToAvailability({ sphere: -3, cylinder: -0.75, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([-0.75]);
    expect(result.sphere).toBeCloseTo(-3);
    expect(result.axis).toBe(90);
  });
});

describe('mapToAvailability — axis (circular rounding)', () => {
  it.each([
    [90, 90],
    [170, 170],
    [178, 180],
    [180, 180],
    [1, 180],
    [3, 180],
    [175, 180],
    [5, 10],
  ])('rounds axis %d to %d', (input, expected) => {
    const result = mapToAvailability({ sphere: 0, cylinder: -0.75, axis: input }, profile);
    expect(result.axis).toBe(expected);
  });

  it('never reports axis 0 — the wrapped result is always expressed as 180', () => {
    for (let axis = 1; axis <= 180; axis++) {
      const result = mapToAvailability({ sphere: 0, cylinder: -0.75, axis }, profile);
      expect(result.axis).not.toBe(0);
      expect(result.axis).toBeGreaterThanOrEqual(1);
      expect(result.axis).toBeLessThanOrEqual(180);
    }
  });
});

describe('exceedsCommonStockCylinderRange', () => {
  it('is false for a cylinder within the configured range', () => {
    expect(exceedsCommonStockCylinderRange(-1.5, profile)).toBe(false);
  });

  it('is false exactly at the largest configured cylinder', () => {
    expect(exceedsCommonStockCylinderRange(-2.75, profile)).toBe(false);
  });

  it('is true when the magnitude exceeds the largest configured cylinder', () => {
    expect(exceedsCommonStockCylinderRange(-3.0, profile)).toBe(true);
    expect(exceedsCommonStockCylinderRange(-6.0, profile)).toBe(true);
  });

  it('is false for a cylinder below the smallest configured value — that case substitutes spherical, not a supply gap', () => {
    expect(exceedsCommonStockCylinderRange(-0.3, profile)).toBe(false);
  });

  it('is false for a zero (spherical-only) cylinder', () => {
    expect(exceedsCommonStockCylinderRange(0, profile)).toBe(false);
  });

  it('agrees with mapToAvailability\'s own clamping behavior: true exactly when the exact cylinder and the mapped cylinder diverge beyond a simple rounding step', () => {
    // -6.00 clamps to the largest configured cylinder (-2.75), not merely "rounds" to it.
    const result = mapToAvailability({ sphere: 0, cylinder: -6.0, axis: 90 }, profile);
    expect(result.cylinderCandidatesD).toEqual([-2.75]);
    expect(exceedsCommonStockCylinderRange(-6.0, profile)).toBe(true);
  });
});
