import { describe, expect, it } from 'vitest';
import { convertVertexDistance, validateVertexDistanceInput } from './vertexDistance';

describe('convertVertexDistance', () => {
  it('matches a hand-calculated toric conversion with clean numbers', () => {
    // t = 0.5 (500mm -> 0mm); meridian1 = -2 -> -2/(1-0.5*-2) = -1.0; meridian2 = -3 -> -3/(1-0.5*-3) = -1.2
    const outcome = convertVertexDistance({
      rx: { sphere: -2, cylinder: -1, axis: 45 },
      fromVertexMm: 500,
      toVertexMm: 0,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.rx.sphere).toBeCloseTo(-1.0);
    expect(outcome.result.rx.cylinder).toBeCloseTo(-0.2);
    expect(outcome.result.rx.axis).toBe(45);
  });

  it('leaves the axis unchanged by vertex conversion', () => {
    const outcome = convertVertexDistance({
      rx: { sphere: -4, cylinder: -1.5, axis: 137 },
      fromVertexMm: 12,
      toVertexMm: 0,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.rx.axis).toBe(137);
  });

  it('spectacle (12mm) -> CL (0mm) reduces minus power magnitude and increases plus power magnitude', () => {
    const minus = convertVertexDistance({ rx: { sphere: -10, cylinder: 0, axis: 90 }, fromVertexMm: 12, toVertexMm: 0 });
    expect(minus.ok).toBe(true);
    if (minus.ok) {
      expect(minus.result.rx.sphere).toBeGreaterThan(-10);
      expect(minus.result.rx.sphere).toBeLessThan(0);
    }

    const plus = convertVertexDistance({ rx: { sphere: 10, cylinder: 0, axis: 90 }, fromVertexMm: 12, toVertexMm: 0 });
    expect(plus.ok).toBe(true);
    if (plus.ok) {
      expect(plus.result.rx.sphere).toBeGreaterThan(10);
    }
  });

  it('CL (0mm) -> spectacle (12mm) increases minus power magnitude', () => {
    const outcome = convertVertexDistance({ rx: { sphere: -10, cylinder: 0, axis: 90 }, fromVertexMm: 0, toVertexMm: 12 });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.rx.sphere).toBeLessThan(-10);
    }
  });

  it('returns the Rx unchanged when from and to vertex distances are equal', () => {
    const outcome = convertVertexDistance({
      rx: { sphere: -6.5, cylinder: -1.25, axis: 83 },
      fromVertexMm: 12,
      toVertexMm: 12,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.rx.sphere).toBeCloseTo(-6.5);
    expect(outcome.result.rx.cylinder).toBeCloseTo(-1.25);
    expect(outcome.result.rx.axis).toBe(83);
  });

  it('is its own inverse: converting A->B then B->A returns the original Rx', () => {
    const rx = { sphere: -6.5, cylinder: -1.25, axis: 83 };
    const forward = convertVertexDistance({ rx, fromVertexMm: 12, toVertexMm: 0 });
    expect(forward.ok).toBe(true);
    if (!forward.ok) return;

    const back = convertVertexDistance({ rx: forward.result.rx, fromVertexMm: 0, toVertexMm: 12 });
    expect(back.ok).toBe(true);
    if (!back.ok) return;

    expect(back.result.rx.sphere).toBeCloseTo(rx.sphere, 5);
    expect(back.result.rx.cylinder).toBeCloseTo(rx.cylinder, 5);
  });

  it('flags the mathematical singularity instead of returning an undefined/huge value', () => {
    // t = 1 (1000mm -> 0mm); meridian power 1 -> denominator (1 - 1*1) = 0.
    const outcome = convertVertexDistance({
      rx: { sphere: 1, cylinder: 0, axis: 90 },
      fromVertexMm: 1000,
      toVertexMm: 0,
    });
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('singularity');
  });

  it('does not flag a large-but-finite result near the singularity as invalid', () => {
    // t = 1; denominator (1 - 1*0.9999) = 0.0001, well above the epsilon threshold.
    const outcome = convertVertexDistance({
      rx: { sphere: 0.9999, cylinder: 0, axis: 90 },
      fromVertexMm: 1000,
      toVertexMm: 0,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.rx.sphere).toBeCloseTo(9999, 0);
  });

  it('converts a spherical-only Rx (cylinder = 0) without a real axis, still producing cylinder = 0', () => {
    const outcome = convertVertexDistance({
      rx: { sphere: -4.75, cylinder: 0, axis: NaN },
      fromVertexMm: 12,
      toVertexMm: 0,
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.rx.cylinder).toBeCloseTo(0);
    expect(Number.isNaN(outcome.result.rx.axis)).toBe(false);
    expect(outcome.result.rx.axis).toBeGreaterThanOrEqual(1);
    expect(outcome.result.rx.axis).toBeLessThanOrEqual(180);
  });
});

describe('validateVertexDistanceInput', () => {
  const validInput = { rx: { sphere: -6.5, cylinder: -1.25, axis: 83 }, fromVertexMm: 12, toVertexMm: 0 };

  it('accepts a fully valid input', () => {
    expect(validateVertexDistanceInput(validInput)).toEqual({});
  });

  it('accepts a spherical-only Rx (cylinder = 0)', () => {
    const errors = validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, cylinder: 0 } });
    expect(errors.cylinder).toBeUndefined();
  });

  it('accepts 0mm as a vertex distance (the contact-lens / corneal-plane case)', () => {
    const errors = validateVertexDistanceInput({ ...validInput, toVertexMm: 0 });
    expect(errors.toVertexMm).toBeUndefined();
  });

  it('rejects a missing (NaN) sphere, cylinder, or axis', () => {
    expect(validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, sphere: NaN } }).sphere).toBeDefined();
    expect(
      validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, cylinder: NaN } }).cylinder,
    ).toBeDefined();
    expect(validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, axis: NaN } }).axis).toBeDefined();
  });

  it('rejects a positive cylinder (plus-cylinder notation is not supported here)', () => {
    const errors = validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, cylinder: 1.25 } });
    expect(errors.cylinder).toBeDefined();
  });

  it('rejects an axis outside 1-180', () => {
    expect(validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, axis: 0 } }).axis).toBeDefined();
    expect(validateVertexDistanceInput({ ...validInput, rx: { ...validInput.rx, axis: 181 } }).axis).toBeDefined();
  });

  it('rejects a negative vertex distance', () => {
    expect(validateVertexDistanceInput({ ...validInput, fromVertexMm: -1 }).fromVertexMm).toBeDefined();
    expect(validateVertexDistanceInput({ ...validInput, toVertexMm: -1 }).toVertexMm).toBeDefined();
  });

  it('does not require axis when cylinder is 0 (spherical-only Rx)', () => {
    const errors = validateVertexDistanceInput({
      ...validInput,
      rx: { ...validInput.rx, cylinder: 0, axis: NaN },
    });
    expect(errors.axis).toBeUndefined();
    expect(errors.cylinder).toBeUndefined();
  });

  it('still rejects an out-of-range axis when cylinder is 0, if one was entered', () => {
    const errors = validateVertexDistanceInput({
      ...validInput,
      rx: { ...validInput.rx, cylinder: 0, axis: 200 },
    });
    expect(errors.axis).toBeDefined();
  });

  it('still requires axis when cylinder is a real non-zero value', () => {
    const errors = validateVertexDistanceInput({
      ...validInput,
      rx: { ...validInput.rx, cylinder: -1.25, axis: NaN },
    });
    expect(errors.axis).toBeDefined();
  });
});
