import { describe, expect, it } from 'vitest';
import { transpose } from './transposition';
import {
  horizontalMeridionalPower,
  verticalMeridionalPower,
  deriveHorizontalDecentration,
  calculateHorizontalInducedPrism,
  calculateBinocularInducedPrism,
  validateBinocularInducedPrismInput,
  hasBinocularInducedPrismErrors,
  calculateBinocularRequiredDecentration,
  validateBinocularRequiredDecentrationInput,
  hasBinocularRequiredDecentrationErrors,
} from './prism';

// ---------------------------------------------------------------------------
// Meridional power — Fθ = S + C·sin²(θ − axis), evaluated at θ=180 (horizontal)
// and θ=90 (vertical).
// ---------------------------------------------------------------------------

describe('horizontalMeridionalPower / verticalMeridionalPower', () => {
  it('a spherical-only Rx has the same power in every meridian', () => {
    expect(horizontalMeridionalPower({ sphere: -3, cylinder: 0, axis: NaN })).toBe(-3);
    expect(verticalMeridionalPower({ sphere: -3, cylinder: 0, axis: NaN })).toBe(-3);
  });

  it('axis 180: F180 = S, F90 = S + C', () => {
    // OU +2.00 -2.00 x90 style Rx but at axis 180 for a plain sanity check.
    expect(horizontalMeridionalPower({ sphere: -1, cylinder: -2, axis: 180 })).toBe(-1);
    expect(verticalMeridionalPower({ sphere: -1, cylinder: -2, axis: 180 })).toBe(-3);
  });

  it('axis 90: F180 = S + C, F90 = S (swapped relative to axis 180)', () => {
    expect(horizontalMeridionalPower({ sphere: -1, cylinder: -2, axis: 90 })).toBe(-3);
    expect(verticalMeridionalPower({ sphere: -1, cylinder: -2, axis: 90 })).toBe(-1);
  });

  it("regression: OU +2.00 -2.00 x90 has F180 = 0 despite a real cylinder present", () => {
    // Fθ = S + C sin²(θ-axis). F180 = 2 + (-2)*sin²(90) = 2 - 2 = 0.
    expect(horizontalMeridionalPower({ sphere: 2, cylinder: -2, axis: 90 })).toBe(0);
    expect(verticalMeridionalPower({ sphere: 2, cylinder: -2, axis: 90 })).toBe(2);
  });

  it('an oblique axis produces a power between S and S+C', () => {
    // S=-2, C=-2, axis=45 -> F180 = -2 + (-2)*sin²(135) = -2 + (-2)*0.5 = -3.
    expect(horizontalMeridionalPower({ sphere: -2, cylinder: -2, axis: 45 })).toBeCloseTo(-3, 4);
    // F90 = -2 + (-2)*sin²(45) = -2 - 1 = -3 (axis 45 is symmetric between the two meridians).
    expect(verticalMeridionalPower({ sphere: -2, cylinder: -2, axis: 45 })).toBeCloseTo(-3, 4);
  });

  it('gives the identical meridional power for a transposed (plus-cylinder) equivalent Rx', () => {
    const minusForm = { sphere: -1, cylinder: -1.5, axis: 125 };
    const plusForm = transpose(minusForm);
    expect(horizontalMeridionalPower(plusForm)).toBeCloseTo(horizontalMeridionalPower(minusForm), 4);
    expect(verticalMeridionalPower(plusForm)).toBeCloseTo(verticalMeridionalPower(minusForm), 4);
  });
});

describe('deriveHorizontalDecentration', () => {
  it('OC farther from the midline than the pupil is OUT', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 30, ocDistanceMm: 32 })).toEqual({ mm: 2, direction: 'OUT' });
  });

  it('OC closer to the midline than the pupil is IN', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 32, ocDistanceMm: 30 })).toEqual({ mm: 2, direction: 'IN' });
  });

  it('OC exactly at the pupil is zero decentration', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 31, ocDistanceMm: 31 })).toEqual({ mm: 0, direction: 'OUT' });
  });

  it('uses the identical formula for OD and OS — no left/right mirroring needed', () => {
    const od = deriveHorizontalDecentration({ patientPdMm: 32, ocDistanceMm: 34 });
    const os = deriveHorizontalDecentration({ patientPdMm: 30, ocDistanceMm: 32 });
    expect(od).toEqual({ mm: 2, direction: 'OUT' });
    expect(os).toEqual({ mm: 2, direction: 'OUT' });
  });
});

// ---------------------------------------------------------------------------
// Mode 1 — Induced Prism (horizontal only)
// ---------------------------------------------------------------------------

describe('calculateHorizontalInducedPrism', () => {
  it('REGRESSION 1: OU +2.00 -2.00 x90, patient PD 31/31, manufactured OC 33/33 -> F180 = 0, no measurable horizontal induced prism despite a real 2mm OC error', () => {
    const rx = { sphere: 2, cylinder: -2, axis: 90 };
    const position = { patientPdMm: 31, ocDistanceMm: 33 };
    const result = calculateHorizontalInducedPrism(rx, position);
    expect(result.f180).toBe(0);
    expect(result.decentration).toEqual({ mm: 2, direction: 'OUT' });
    expect(result.prism).toBeUndefined();
  });

  it('REGRESSION 2: OU -2.00 DS, patient PD 31/31, OC 33/33 -> Base In (MOBI: minus lens decentered OUT)', () => {
    const rx = { sphere: -2, cylinder: 0, axis: NaN };
    const position = { patientPdMm: 31, ocDistanceMm: 33 };
    const result = calculateHorizontalInducedPrism(rx, position);
    expect(result.f180).toBe(-2);
    expect(result.prism).toEqual({ diopters: 0.4, base: 'BI' });
  });

  it('REGRESSION 3: OU +2.00 DS, same PD/OC mismatch -> same magnitude, opposite base (Base Out)', () => {
    const rx = { sphere: 2, cylinder: 0, axis: NaN };
    const position = { patientPdMm: 31, ocDistanceMm: 33 };
    const result = calculateHorizontalInducedPrism(rx, position);
    expect(result.f180).toBe(2);
    expect(result.prism).toEqual({ diopters: 0.4, base: 'BO' });
  });

  it('REGRESSION 8: a sphero-cylinder prescription where F180 differs substantially from sphere alone uses F180, not sphere', () => {
    // S=-1, C=-4, axis=180 -> F180 = S = -1 (NOT S+C = -5, which sphere-only math would wrongly use if it summed S+C).
    // Chosen so sphere alone (-1) and F180 (-1) happen to coincide but F90 (-5) is wildly different,
    // proving the horizontal path is reading a genuine meridional value rather than defaulting to sphere.
    const rx = { sphere: -1, cylinder: -4, axis: 180 };
    const position = { patientPdMm: 30, ocDistanceMm: 32 }; // 2mm OUT -> 0.2cm
    const result = calculateHorizontalInducedPrism(rx, position);
    expect(result.f180).toBe(-1);
    expect(result.prism).toEqual({ diopters: 0.2, base: 'BI' });

    // Same physical decentration, axis rotated to 90 so F180 becomes S+C = -5 instead — proves
    // the horizontal result actually tracks F180 (which swaps with axis), not a fixed sphere value.
    const rxAxis90 = { sphere: -1, cylinder: -4, axis: 90 };
    const resultAxis90 = calculateHorizontalInducedPrism(rxAxis90, position);
    expect(resultAxis90.f180).toBe(-5);
    expect(resultAxis90.prism).toEqual({ diopters: 1, base: 'BI' });
  });

  it('zero decentration induces no prism regardless of power', () => {
    const result = calculateHorizontalInducedPrism({ sphere: -6, cylinder: -2, axis: 45 }, { patientPdMm: 31, ocDistanceMm: 31 });
    expect(result.prism).toBeUndefined();
  });

  it('a plano horizontal meridian induces no prism regardless of decentration', () => {
    const result = calculateHorizontalInducedPrism({ sphere: 0, cylinder: 0, axis: NaN }, { patientPdMm: 30, ocDistanceMm: 35 });
    expect(result.prism).toBeUndefined();
  });

  it('IN decentration flips the base relative to OUT', () => {
    const out = calculateHorizontalInducedPrism({ sphere: -3, cylinder: 0, axis: NaN }, { patientPdMm: 30, ocDistanceMm: 32 });
    const inward = calculateHorizontalInducedPrism({ sphere: -3, cylinder: 0, axis: NaN }, { patientPdMm: 32, ocDistanceMm: 30 });
    expect(out.prism).toEqual({ diopters: 0.6, base: 'BI' });
    expect(inward.prism).toEqual({ diopters: 0.6, base: 'BO' });
  });

  it('gives an identical result for a transposed (plus-cylinder) equivalent Rx', () => {
    const minusForm = { sphere: -1, cylinder: -1.5, axis: 125 };
    const plusForm = transpose(minusForm);
    const position = { patientPdMm: 30, ocDistanceMm: 32.5 };
    const fromMinus = calculateHorizontalInducedPrism(minusForm, position);
    const fromPlus = calculateHorizontalInducedPrism(plusForm, position);
    expect(fromPlus.prism?.diopters).toBeCloseTo(fromMinus.prism?.diopters ?? 0, 4);
    expect(fromPlus.prism?.base).toBe(fromMinus.prism?.base);
  });
});

describe('calculateBinocularInducedPrism', () => {
  it('REGRESSION 1 (binocular): OU +2.00 -2.00 x90, PD 31/31, OC 33/33 -> 0Δ OU, no total', () => {
    const eye = {
      rx: { sphere: 2, cylinder: -2, axis: 90 },
      position: { patientPdMm: 31, ocDistanceMm: 33 },
    };
    const result = calculateBinocularInducedPrism({ od: eye, os: eye });
    expect(result.od.prism).toBeUndefined();
    expect(result.os.prism).toBeUndefined();
    expect(result.totalHorizontal).toBeUndefined();
  });

  it('REGRESSION 4: unequal OD/OS powers with equal physical horizontal OC error are calculated independently per eye', () => {
    const result = calculateBinocularInducedPrism({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, position: { patientPdMm: 31, ocDistanceMm: 33 } },
      os: { rx: { sphere: -4, cylinder: 0, axis: NaN }, position: { patientPdMm: 31, ocDistanceMm: 33 } },
    });
    expect(result.od.prism).toEqual({ diopters: 0.4, base: 'BI' });
    expect(result.os.prism).toEqual({ diopters: 0.8, base: 'BI' });
    // Same base direction -> a real total applies, and it is the sum, not a naive mm split.
    expect(result.totalHorizontal).toEqual({ diopters: 1.2, base: 'BI' });
  });

  it('does not manufacture a total when OD and OS induce opposite bases', () => {
    const result = calculateBinocularInducedPrism({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, position: { patientPdMm: 30, ocDistanceMm: 31 } }, // OUT -> BI
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, position: { patientPdMm: 30, ocDistanceMm: 29 } }, // IN -> BO
    });
    expect(result.od.prism?.base).toBe('BI');
    expect(result.os.prism?.base).toBe('BO');
    expect(result.totalHorizontal).toBeUndefined();
  });

  it('falls back to the single present side when only one eye induces a component', () => {
    const result = calculateBinocularInducedPrism({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, position: { patientPdMm: 30, ocDistanceMm: 31 } },
      os: { rx: { sphere: 0, cylinder: 0, axis: NaN }, position: { patientPdMm: 30, ocDistanceMm: 30 } },
    });
    expect(result.os.prism).toBeUndefined();
    expect(result.totalHorizontal).toEqual(result.od.prism);
  });
});

describe('validateBinocularInducedPrismInput / hasBinocularInducedPrismErrors', () => {
  const validEye = { rx: { sphere: -2, cylinder: 0, axis: NaN }, position: { patientPdMm: 30, ocDistanceMm: 31 } };

  it('accepts a fully valid binocular input', () => {
    const errors = validateBinocularInducedPrismInput({ od: validEye, os: validEye });
    expect(hasBinocularInducedPrismErrors(errors)).toBe(false);
  });

  it('requires patientPdMm and ocDistanceMm per eye', () => {
    const errors = validateBinocularInducedPrismInput({
      od: { ...validEye, position: { patientPdMm: NaN, ocDistanceMm: NaN } },
      os: validEye,
    });
    expect(errors.od.patientPdMm).toBeDefined();
    expect(errors.od.ocDistanceMm).toBeDefined();
    expect(errors.os.patientPdMm).toBeUndefined();
    expect(hasBinocularInducedPrismErrors(errors)).toBe(true);
  });

  it('flags only the eye with the error, not both', () => {
    const errors = validateBinocularInducedPrismInput({
      od: validEye,
      os: { ...validEye, rx: { sphere: NaN, cylinder: 0, axis: NaN } },
    });
    expect(errors.od.sphere).toBeUndefined();
    expect(errors.os.sphere).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Mode 2 — Required Decentration
// ---------------------------------------------------------------------------

describe('calculateBinocularRequiredDecentration — horizontal', () => {
  it('REGRESSION 5: unequal OD/OS powers, total 2Δ BI equal split -> 1Δ BI each, but different mm (prism split before mm conversion)', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -4, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 2, base: 'BI' } },
    });
    expect(result.od.allocatedHorizontal).toEqual({ diopters: 1, base: 'BI' });
    expect(result.os.allocatedHorizontal).toEqual({ diopters: 1, base: 'BI' });
    // MOBI: minus lens + BI target -> OUT. OD: 1/2 = 0.5cm = 5mm. OS: 1/4 = 0.25cm = 2.5mm.
    expect(result.od.horizontal).toEqual({ kind: 'defined', mm: 5, direction: 'OUT' });
    expect(result.os.horizontal).toEqual({ kind: 'defined', mm: 2.5, direction: 'OUT' });
  });

  it('does NOT compute one mm value and divide it between the eyes (contrast with a naive equal-mm split)', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -4, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 2, base: 'BI' } },
    });
    const odMm = result.od.horizontal.kind === 'defined' ? result.od.horizontal.mm : null;
    const osMm = result.os.horizontal.kind === 'defined' ? result.os.horizontal.mm : null;
    // A naive "split the total mm in half" bug would give 3.75mm/3.75mm (7.5mm total / 2).
    // The correct per-eye-power calculation gives 5mm and 2.5mm.
    expect(odMm).not.toBe(osMm);
    expect(odMm).toBe(5);
    expect(osMm).toBe(2.5);
  });

  it('+2.00D with desired BI requires the opposite direction (IN) from the minus-lens BI case', () => {
    const eye = { rx: { sphere: 2, cylinder: 0, axis: NaN } };
    const result = calculateBinocularRequiredDecentration({
      od: eye,
      os: eye,
      horizontal: { mode: 'perEye', od: { diopters: 2, base: 'BI' }, os: { diopters: 2, base: 'BI' } },
    });
    expect(result.od.horizontal).toEqual({ kind: 'defined', mm: 10, direction: 'IN' });
  });

  it('+2.00D with desired BO requires OUT; -2.00D with desired BO requires IN', () => {
    const target = { mode: 'perEye' as const, od: { diopters: 1, base: 'BO' as const }, os: { diopters: 1, base: 'BO' as const } };
    const plus = calculateBinocularRequiredDecentration({ od: { rx: { sphere: 2, cylinder: 0, axis: NaN } }, os: { rx: { sphere: 2, cylinder: 0, axis: NaN } }, horizontal: target });
    const minus = calculateBinocularRequiredDecentration({ od: { rx: { sphere: -2, cylinder: 0, axis: NaN } }, os: { rx: { sphere: -2, cylinder: 0, axis: NaN } }, horizontal: target });
    expect(plus.od.horizontal).toEqual({ kind: 'defined', mm: 5, direction: 'OUT' });
    expect(minus.od.horizontal).toEqual({ kind: 'defined', mm: 5, direction: 'IN' });
  });

  it('custom split allocates by the given OD fraction, not 50/50', () => {
    const eye = { rx: { sphere: -2, cylinder: 0, axis: NaN } };
    const result = calculateBinocularRequiredDecentration({
      od: eye,
      os: eye,
      horizontal: { mode: 'total', total: { diopters: 4, base: 'BI' }, split: { odFraction: 0.75 } },
    });
    expect(result.od.allocatedHorizontal?.diopters).toBe(3);
    expect(result.os.allocatedHorizontal?.diopters).toBe(1);
  });

  it('REGRESSION 8: horizontal decentration is solved from F180, not sphere alone, for a sphero-cylinder Rx', () => {
    // axis 180: F180 = S = -1, F90 = S+C = -3 — wildly different from each other and from sphere-only reasoning.
    const rx = { sphere: -1, cylinder: -2, axis: 180 };
    const result = calculateBinocularRequiredDecentration({
      od: { rx },
      os: { rx },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(result.od.relevantPower.f180).toBe(-1);
    // c = 1/1 = 1cm = 10mm (would be 1/3 cm = 3.33mm if sphere+cylinder, or 1cm if it used sphere alone coincidentally — the discriminating check is the axis-90 case just below).
    expect(result.od.horizontal).toEqual({ kind: 'defined', mm: 10, direction: 'OUT' });

    const rxAxis90 = { sphere: -1, cylinder: -2, axis: 90 };
    const resultAxis90 = calculateBinocularRequiredDecentration({
      od: { rx: rxAxis90 },
      os: { rx: rxAxis90 },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(resultAxis90.od.relevantPower.f180).toBe(-3);
    expect(resultAxis90.od.horizontal).toEqual({ kind: 'defined', mm: 3.33333, direction: 'OUT' });
  });

  it('reports an independent singularity per eye — one eye undefined does not block the other', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 0, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(result.od.horizontal).toEqual({ kind: 'singularity' });
    expect(result.os.horizontal.kind).toBe('defined');
  });

  it('a horizontal singularity does not block an independently-solvable vertical target for the same eye', () => {
    // axis 180: F180 = S = 0 (singular horizontally), F90 = S+C = -2 (solvable vertically).
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 0, cylinder: -2, axis: 180 }, vertical: { diopters: 1, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.horizontal).toEqual({ kind: 'singularity' });
    expect(result.od.vertical).toEqual({ kind: 'defined', mm: 5, direction: 'DOWN' });
  });

  it('converts the required OC shift into a monocular ordering PD, direction-aware', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 32 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 30 },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BO' } },
    });
    expect(result.od.horizontal).toEqual({ kind: 'defined', mm: 5, direction: 'OUT' });
    expect(result.od.orderingPdMm).toBe(37);
    expect(result.os.horizontal).toEqual({ kind: 'defined', mm: 5, direction: 'IN' });
    expect(result.os.orderingPdMm).toBe(25);
  });

  it('flags a target above the extreme-prism guideline with a caution, not a rejection, and the wording does not claim it cannot be manufactured', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 12, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(result.od.horizontal.kind).toBe('defined');
    expect(result.od.caution).toBeDefined();
    expect(result.od.caution).toContain('High prescribed prism (>10Δ)');
    expect(result.od.caution?.toLowerCase()).not.toContain('impossible');
    expect(result.od.caution?.toLowerCase()).not.toContain('cannot be');
    expect(result.od.caution?.toLowerCase()).not.toContain('tolerance');
    expect(result.os.caution).toBeUndefined();
  });

  it('a prism target at exactly 10Δ does not trigger the high-prism caution — only strictly above it does', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 10, base: 'BI' }, os: { diopters: 10.1, base: 'BI' } },
    });
    expect(result.od.caution).toBeUndefined();
    expect(result.os.caution).toBeDefined();
  });

  it('round-trips through calculateHorizontalInducedPrism: required decentration, fed back in, recovers the original horizontal target', () => {
    const rx = { sphere: -2, cylinder: -1, axis: 60 };
    const required = calculateBinocularRequiredDecentration({
      od: { rx },
      os: { rx },
      horizontal: { mode: 'perEye', od: { diopters: 1.2, base: 'BO' }, os: { diopters: 1.2, base: 'BO' } },
    });
    expect(required.od.horizontal.kind).toBe('defined');
    if (required.od.horizontal.kind !== 'defined') return;

    const { mm, direction } = required.od.horizontal;
    const ocDistanceMm = direction === 'OUT' ? 30 + mm : 30 - mm;
    const achieved = calculateHorizontalInducedPrism(rx, { patientPdMm: 30, ocDistanceMm });
    expect(achieved.prism?.diopters).toBeCloseTo(1.2, 4);
    expect(achieved.prism?.base).toBe('BO');
  });
});

describe('calculateBinocularRequiredDecentration — vertical', () => {
  it('REGRESSION 6: required BU prism uses F90 and the correct OC movement direction (plus lens: same direction as base; minus lens: opposite)', () => {
    const plus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BU' } },
      os: { rx: { sphere: 2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BU' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(plus.od.relevantPower.f90).toBe(2);
    expect(plus.od.vertical).toEqual({ kind: 'defined', mm: 5, direction: 'UP' });

    const minus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BU' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(minus.od.relevantPower.f90).toBe(-2);
    expect(minus.od.vertical).toEqual({ kind: 'defined', mm: 5, direction: 'DOWN' });
  });

  it('REGRESSION 7: required BD prism uses F90 and the correct OC movement direction (mirrors BU)', () => {
    const plus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BD' } },
      os: { rx: { sphere: 2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BD' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(plus.od.vertical).toEqual({ kind: 'defined', mm: 5, direction: 'DOWN' });

    const minus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BD' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BD' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(minus.od.vertical).toEqual({ kind: 'defined', mm: 5, direction: 'UP' });
  });

  it('REGRESSION 9: a sphero-cylinder prescription where F90 differs substantially from sphere is used for vertical decentration', () => {
    // axis 90: F180 = S+C = -3, F90 = S = -1.
    const rx = { sphere: -1, cylinder: -2, axis: 90 };
    const result = calculateBinocularRequiredDecentration({
      od: { rx, vertical: { diopters: 1, base: 'BD' } },
      os: { rx, vertical: { diopters: 1, base: 'BD' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.relevantPower.f90).toBe(-1);
    // c = 1/1 = 1cm = 10mm (would be 10/3mm if it mistakenly used F180=-3 instead of F90=-1).
    expect(result.od.vertical).toEqual({ kind: 'defined', mm: 10, direction: 'UP' });
  });

  it('a plano vertical meridian is flagged as a per-eye vertical singularity', () => {
    // axis 90: F90 = S = 0.
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 0, cylinder: -2, axis: 90 }, vertical: { diopters: 1, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.vertical).toEqual({ kind: 'singularity' });
  });

  it('round-trips vertical through the horizontal-only induced-prism helper is not applicable — verified instead via direct inverse-Prentice consistency (c = Δ/F, Δ = c×F)', () => {
    const rx = { sphere: -1.75, cylinder: -0.5, axis: 30 };
    const f90 = verticalMeridionalPower(rx);
    const result = calculateBinocularRequiredDecentration({
      od: { rx, vertical: { diopters: 0.6, base: 'BU' } },
      os: { rx },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.od.vertical.kind).toBe('defined');
    if (result.od.vertical.kind !== 'defined') return;
    const cCm = (result.od.vertical.mm / 10) * (result.od.vertical.direction === 'UP' ? 1 : -1);
    expect(cCm * f90).toBeCloseTo(0.6, 4);
  });
});

describe('REGRESSION 10 — binocular vertical relationship distinguishes yoked from differential imbalance', () => {
  it('equal same-direction BU in both eyes is fully yoked — zero imbalance, never summed', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 4.4, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 4.4, base: 'BU' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.verticalRelationship?.imbalance).toBeUndefined();
    expect(result.verticalRelationship?.yoked).toEqual({ diopters: 4.4, base: 'BU' });
  });

  it('opposing bases (BU one eye, BD the other) compound into a differential imbalance, with no yoked component', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 4.4, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 4.4, base: 'BD' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.verticalRelationship?.imbalance).toEqual({ diopters: 8.8, moreBuEye: 'OD' });
    expect(result.verticalRelationship?.yoked).toBeUndefined();
  });

  it('unequal same-direction BU prism yields a partial yoked component plus the residual imbalance', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 3, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 1, base: 'BU' } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.verticalRelationship?.yoked).toEqual({ diopters: 1, base: 'BU' });
    expect(result.verticalRelationship?.imbalance).toEqual({ diopters: 2, moreBuEye: 'OD' });
  });

  it('no vertical prism entered for either eye reports no relationship at all', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 2, base: 'BI' } },
    });
    expect(result.verticalRelationship).toBeUndefined();
  });

  it('vertical prism in only one eye is entirely imbalance, with no yoked component', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: 2, base: 'BD' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(result.verticalRelationship?.imbalance).toEqual({ diopters: 2, moreBuEye: 'OS' });
    expect(result.verticalRelationship?.yoked).toBeUndefined();
  });
});

describe('validateBinocularRequiredDecentrationInput / hasBinocularRequiredDecentrationErrors', () => {
  it('accepts a valid perEye input', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(hasBinocularRequiredDecentrationErrors(errors)).toBe(false);
  });

  it('accepts a valid total input with no split (defaults to equal)', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 2, base: 'BI' } },
    });
    expect(errors.totalHorizontal).toBeUndefined();
    expect(hasBinocularRequiredDecentrationErrors(errors)).toBe(false);
  });

  it('rejects a negative per-eye horizontal target', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: -1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(errors.odHorizontal?.diopters).toBeDefined();
    expect(errors.osHorizontal).toBeUndefined();
    expect(hasBinocularRequiredDecentrationErrors(errors)).toBe(true);
  });

  it('rejects a negative per-eye vertical target', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, vertical: { diopters: -1, base: 'BU' } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 0, base: 'BI' } },
    });
    expect(errors.od.verticalDiopters).toBeDefined();
    expect(hasBinocularRequiredDecentrationErrors(errors)).toBe(true);
  });

  it('rejects an out-of-range split fraction', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'total', total: { diopters: 2, base: 'BI' }, split: { odFraction: 1.5 } },
    });
    expect(errors.horizontalSplit).toBeDefined();
  });

  it('accepts an optional patientPdMm and rejects a negative one', () => {
    const validErrors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 32 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(validErrors.od.patientPdMm).toBeUndefined();

    const invalidErrors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: -5 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      horizontal: { mode: 'perEye', od: { diopters: 1, base: 'BI' }, os: { diopters: 1, base: 'BI' } },
    });
    expect(invalidErrors.od.patientPdMm).toBeDefined();
  });
});
