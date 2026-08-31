import { describe, expect, it } from 'vitest';
import { transpose } from './transposition';
import {
  calculateInducedPrism,
  calculateRequiredDecentration,
  validateInducedPrismInput,
  validateRequiredDecentrationInput,
  deriveHorizontalDecentration,
  calculateBinocularInducedPrism,
  validateBinocularInducedPrismInput,
  calculateBinocularRequiredDecentration,
  validateBinocularRequiredDecentrationInput,
} from './prism';

describe('calculateInducedPrism', () => {
  it('plus sphere decentered OUT induces Base Out (plus lens: base same direction as decentration)', () => {
    const result = calculateInducedPrism(
      { sphere: 4, cylinder: 0, axis: NaN },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toEqual({ diopters: 0.8, base: 'BO' });
    expect(result.vertical).toBeUndefined();
  });

  it('MOBI: minus sphere decentered OUT induces Base In (minus lens: base opposite decentration)', () => {
    const result = calculateInducedPrism(
      { sphere: -5, cylinder: 0, axis: NaN },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toEqual({ diopters: 1, base: 'BI' });
    expect(result.vertical).toBeUndefined();
  });

  it('plus sphere decentered UP induces Base Up', () => {
    const result = calculateInducedPrism(
      { sphere: 2, cylinder: 0, axis: NaN },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 3, verticalDirection: 'UP' },
    );
    expect(result.vertical).toEqual({ diopters: 0.6, base: 'BU' });
    expect(result.horizontal).toBeUndefined();
  });

  it('minus sphere decentered UP induces Base Down', () => {
    const result = calculateInducedPrism(
      { sphere: -2, cylinder: 0, axis: NaN },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 3, verticalDirection: 'UP' },
    );
    expect(result.vertical).toEqual({ diopters: 0.6, base: 'BD' });
    expect(result.horizontal).toBeUndefined();
  });

  it('decentered IN and DOWN flip the base directions relative to OUT/UP', () => {
    const result = calculateInducedPrism(
      { sphere: 4, cylinder: 0, axis: NaN },
      { horizontalMm: 2, horizontalDirection: 'IN', verticalMm: 3, verticalDirection: 'DOWN' },
    );
    expect(result.horizontal).toEqual({ diopters: 0.8, base: 'BI' });
    expect(result.vertical).toEqual({ diopters: 1.2, base: 'BD' });
  });

  it('zero decentration induces no prism', () => {
    const result = calculateInducedPrism(
      { sphere: -4, cylinder: -1, axis: 45 },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toBeUndefined();
    expect(result.vertical).toBeUndefined();
  });

  it('a plano lens induces no prism regardless of decentration', () => {
    const result = calculateInducedPrism(
      { sphere: 0, cylinder: 0, axis: NaN },
      { horizontalMm: 5, horizontalDirection: 'OUT', verticalMm: 5, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toBeUndefined();
    expect(result.vertical).toBeUndefined();
  });

  it('zero power in the decentered meridian induces no prism in that meridian, even with cylinder present', () => {
    // axis 180: horizontal meridian power = S = 0, vertical meridian power = S+C = -2.
    const result = calculateInducedPrism(
      { sphere: 0, cylinder: -2, axis: 180 },
      { horizontalMm: 4, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toBeUndefined();
    expect(result.vertical).toBeUndefined();
  });

  it('axis 180 decouples into independent horizontal/vertical scalar Prentice per meridian', () => {
    // fxx = S = -1, fyy = S+C = -3, fxy = 0.
    const horizontalOnly = calculateInducedPrism(
      { sphere: -1, cylinder: -2, axis: 180 },
      { horizontalMm: 4, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(horizontalOnly.horizontal).toEqual({ diopters: 0.4, base: 'BI' });
    expect(horizontalOnly.vertical).toBeUndefined();

    const verticalOnly = calculateInducedPrism(
      { sphere: -1, cylinder: -2, axis: 180 },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 4, verticalDirection: 'UP' },
    );
    expect(verticalOnly.vertical).toEqual({ diopters: 1.2, base: 'BD' });
    expect(verticalOnly.horizontal).toBeUndefined();
  });

  it('axis 90 decouples with meridian powers swapped relative to axis 180', () => {
    // fxx = S+C = -4, fyy = S = -2, fxy = 0.
    const horizontalOnly = calculateInducedPrism(
      { sphere: -2, cylinder: -2, axis: 90 },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(horizontalOnly.horizontal).toEqual({ diopters: 0.8, base: 'BI' });
    expect(horizontalOnly.vertical).toBeUndefined();

    const verticalOnly = calculateInducedPrism(
      { sphere: -2, cylinder: -2, axis: 90 },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 2, verticalDirection: 'UP' },
    );
    expect(verticalOnly.vertical).toEqual({ diopters: 0.4, base: 'BD' });
    expect(verticalOnly.horizontal).toBeUndefined();
  });

  it('oblique axis 45 couples the meridians: horizontal-only decentration also induces a vertical component', () => {
    // S=0, C=-2, axis=45 -> fxx=fyy=-1, fxy=+1.
    const result = calculateInducedPrism(
      { sphere: 0, cylinder: -2, axis: 45 },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toEqual({ diopters: 0.2, base: 'BI' });
    expect(result.vertical).toEqual({ diopters: 0.2, base: 'BU' });
  });

  it('oblique axis 135 flips the coupled vertical component relative to axis 45 (same magnitudes otherwise)', () => {
    // S=0, C=-2, axis=135 -> fxx=fyy=-1 (same as axis 45), fxy=-1 (sign flipped).
    const result = calculateInducedPrism(
      { sphere: 0, cylinder: -2, axis: 135 },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    expect(result.horizontal).toEqual({ diopters: 0.2, base: 'BI' });
    expect(result.vertical).toEqual({ diopters: 0.2, base: 'BD' });
  });

  it('combines horizontal and vertical decentration linearly', () => {
    const combined = calculateInducedPrism(
      { sphere: -3, cylinder: 0, axis: NaN },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 2, verticalDirection: 'UP' },
    );
    const horizontalOnly = calculateInducedPrism(
      { sphere: -3, cylinder: 0, axis: NaN },
      { horizontalMm: 2, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    );
    const verticalOnly = calculateInducedPrism(
      { sphere: -3, cylinder: 0, axis: NaN },
      { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 2, verticalDirection: 'UP' },
    );
    expect(combined.horizontal).toEqual(horizontalOnly.horizontal);
    expect(combined.vertical).toEqual(verticalOnly.vertical);
  });

  it('gives an identical result for a transposed (plus-cylinder) equivalent Rx, including the oblique coupled component', () => {
    const minusForm = { sphere: -1, cylinder: -1.5, axis: 125 };
    const plusForm = transpose(minusForm);

    const decentration = { horizontalMm: 2.5, horizontalDirection: 'IN' as const, verticalMm: 1.5, verticalDirection: 'DOWN' as const };
    const fromMinus = calculateInducedPrism(minusForm, decentration);
    const fromPlus = calculateInducedPrism(plusForm, decentration);

    expect(fromPlus.horizontal?.diopters).toBeCloseTo(fromMinus.horizontal?.diopters ?? 0, 5);
    expect(fromPlus.horizontal?.base).toBe(fromMinus.horizontal?.base);
    expect(fromPlus.vertical?.diopters).toBeCloseTo(fromMinus.vertical?.diopters ?? 0, 5);
    expect(fromPlus.vertical?.base).toBe(fromMinus.vertical?.base);
  });
});

describe('calculateRequiredDecentration', () => {
  it('is the inverse of the plus-sphere BO case', () => {
    const outcome = calculateRequiredDecentration(
      { sphere: 4, cylinder: 0, axis: NaN },
      { horizontalDiopters: 0.8, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.horizontal).toEqual({ mm: 2, direction: 'OUT' });
    expect(outcome.result.vertical).toBeUndefined();
  });

  it('is the inverse of the MOBI minus-sphere BI case', () => {
    const outcome = calculateRequiredDecentration(
      { sphere: -5, cylinder: 0, axis: NaN },
      { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.horizontal).toEqual({ mm: 2, direction: 'OUT' });
    expect(outcome.result.vertical).toBeUndefined();
  });

  it('requires decentration in both meridians to hit a pure horizontal target through an oblique cylinder', () => {
    // S=-1, C=-2, axis=45 -> fxx=fyy=-2, fxy=1, det=3.
    const outcome = calculateRequiredDecentration(
      { sphere: -1, cylinder: -2, axis: 45 },
      { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.horizontal?.direction).toBe('IN');
    expect(outcome.result.horizontal?.mm).toBeCloseTo(6.667, 2);
    expect(outcome.result.vertical?.direction).toBe('DOWN');
    expect(outcome.result.vertical?.mm).toBeCloseTo(3.333, 2);
  });

  it('round-trips through calculateInducedPrism for the oblique coupled case', () => {
    const rx = { sphere: -1, cylinder: -2, axis: 45 };
    const target = { horizontalDiopters: 1, horizontalBase: 'BO' as const, verticalDiopters: 0, verticalBase: 'BU' as const };
    const outcome = calculateRequiredDecentration(rx, target);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const achieved = calculateInducedPrism(rx, {
      horizontalMm: outcome.result.horizontal?.mm ?? 0,
      horizontalDirection: outcome.result.horizontal?.direction ?? 'OUT',
      verticalMm: outcome.result.vertical?.mm ?? 0,
      verticalDirection: outcome.result.vertical?.direction ?? 'UP',
    });
    expect(achieved.horizontal?.diopters).toBeCloseTo(target.horizontalDiopters, 4);
    expect(achieved.horizontal?.base).toBe(target.horizontalBase);
    expect(achieved.vertical).toBeUndefined();
  });

  it('round-trips for an arbitrary oblique axis (125°) with a combined H+V target', () => {
    const rx = { sphere: -2, cylinder: -1.25, axis: 125 };
    const target = { horizontalDiopters: 1.2, horizontalBase: 'BO' as const, verticalDiopters: 0.5, verticalBase: 'BU' as const };
    const outcome = calculateRequiredDecentration(rx, target);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const achieved = calculateInducedPrism(rx, {
      horizontalMm: outcome.result.horizontal?.mm ?? 0,
      horizontalDirection: outcome.result.horizontal?.direction ?? 'OUT',
      verticalMm: outcome.result.vertical?.mm ?? 0,
      verticalDirection: outcome.result.vertical?.direction ?? 'UP',
    });
    expect(achieved.horizontal?.diopters).toBeCloseTo(target.horizontalDiopters, 4);
    expect(achieved.horizontal?.base).toBe(target.horizontalBase);
    expect(achieved.vertical?.diopters).toBeCloseTo(target.verticalDiopters, 4);
    expect(achieved.vertical?.base).toBe(target.verticalBase);
  });

  it('gives an identical required decentration for a transposed equivalent Rx', () => {
    const minusForm = { sphere: -1, cylinder: -1.5, axis: 125 };
    const plusForm = transpose(minusForm);
    const target = { horizontalDiopters: 1, horizontalBase: 'BI' as const, verticalDiopters: 0.75, verticalBase: 'BD' as const };

    const fromMinus = calculateRequiredDecentration(minusForm, target);
    const fromPlus = calculateRequiredDecentration(plusForm, target);
    expect(fromMinus.ok).toBe(true);
    expect(fromPlus.ok).toBe(true);
    if (!fromMinus.ok || !fromPlus.ok) return;

    expect(fromPlus.result.horizontal?.mm).toBeCloseTo(fromMinus.result.horizontal?.mm ?? 0, 4);
    expect(fromPlus.result.horizontal?.direction).toBe(fromMinus.result.horizontal?.direction);
    expect(fromPlus.result.vertical?.mm).toBeCloseTo(fromMinus.result.vertical?.mm ?? 0, 4);
    expect(fromPlus.result.vertical?.direction).toBe(fromMinus.result.vertical?.direction);
  });

  it('flags a plano lens as singular — decentering a plano lens can never induce prism', () => {
    const outcome = calculateRequiredDecentration(
      { sphere: 0, cylinder: 0, axis: NaN },
      { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('singularity');
  });

  it('flags a plano principal meridian as singular even with a real cylinder present', () => {
    // sphere = 0 -> det = S*(S+C) = 0, regardless of the (nonzero) cylinder.
    const outcome = calculateRequiredDecentration(
      { sphere: 0, cylinder: -2, axis: 90 },
      { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('singularity');
  });

  it('does not flag an ordinary low-power case as singular', () => {
    const outcome = calculateRequiredDecentration(
      { sphere: 0.5, cylinder: -0.25, axis: 60 },
      { horizontalDiopters: 0.5, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(true);
  });

  it('reports no decentration needed for a zero target', () => {
    const outcome = calculateRequiredDecentration(
      { sphere: -3, cylinder: -1, axis: 30 },
      { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result.horizontal).toBeUndefined();
    expect(outcome.result.vertical).toBeUndefined();
  });
});

describe('validateInducedPrismInput', () => {
  const validInput = {
    rx: { sphere: -2, cylinder: -1, axis: 90 },
    decentration: { horizontalMm: 2, horizontalDirection: 'OUT' as const, verticalMm: 0, verticalDirection: 'UP' as const },
  };

  it('accepts a fully valid input', () => {
    expect(validateInducedPrismInput(validInput)).toEqual({});
  });

  it('accepts a spherical-only Rx (cylinder = 0, axis NaN)', () => {
    const errors = validateInducedPrismInput({ ...validInput, rx: { sphere: -2, cylinder: 0, axis: NaN } });
    expect(errors.cylinder).toBeUndefined();
    expect(errors.axis).toBeUndefined();
  });

  it('rejects a missing (NaN) sphere or cylinder', () => {
    expect(validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, sphere: NaN } }).sphere).toBeDefined();
    expect(validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, cylinder: NaN } }).cylinder).toBeDefined();
  });

  it('rejects a positive cylinder', () => {
    expect(validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, cylinder: 1 } }).cylinder).toBeDefined();
  });

  it('requires axis when cylinder is non-zero, and rejects an out-of-range axis', () => {
    expect(
      validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, axis: NaN } }).axis,
    ).toBeDefined();
    expect(
      validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, axis: 0 } }).axis,
    ).toBeDefined();
    expect(
      validateInducedPrismInput({ ...validInput, rx: { ...validInput.rx, axis: 181 } }).axis,
    ).toBeDefined();
  });

  it('rejects a negative or missing decentration amount', () => {
    expect(
      validateInducedPrismInput({ ...validInput, decentration: { ...validInput.decentration, horizontalMm: -1 } })
        .horizontalMm,
    ).toBeDefined();
    expect(
      validateInducedPrismInput({ ...validInput, decentration: { ...validInput.decentration, verticalMm: NaN } })
        .verticalMm,
    ).toBeDefined();
  });

  it('accepts zero decentration', () => {
    const errors = validateInducedPrismInput({
      ...validInput,
      decentration: { horizontalMm: 0, horizontalDirection: 'OUT', verticalMm: 0, verticalDirection: 'UP' },
    });
    expect(errors.horizontalMm).toBeUndefined();
    expect(errors.verticalMm).toBeUndefined();
  });
});

describe('validateRequiredDecentrationInput', () => {
  const validInput = {
    rx: { sphere: -2, cylinder: -1, axis: 90 },
    target: { horizontalDiopters: 1, horizontalBase: 'BO' as const, verticalDiopters: 0, verticalBase: 'BU' as const },
  };

  it('accepts a fully valid input', () => {
    expect(validateRequiredDecentrationInput(validInput)).toEqual({});
  });

  it('rejects a negative or missing prism amount', () => {
    expect(
      validateRequiredDecentrationInput({ ...validInput, target: { ...validInput.target, horizontalDiopters: -1 } })
        .horizontalDiopters,
    ).toBeDefined();
    expect(
      validateRequiredDecentrationInput({ ...validInput, target: { ...validInput.target, verticalDiopters: NaN } })
        .verticalDiopters,
    ).toBeDefined();
  });

  it('accepts a zero target', () => {
    const errors = validateRequiredDecentrationInput({
      ...validInput,
      target: { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
    });
    expect(errors.horizontalDiopters).toBeUndefined();
    expect(errors.verticalDiopters).toBeUndefined();
  });
});

describe('deriveHorizontalDecentration', () => {
  it('OC farther from the midline than the pupil is OUT', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 30, ocDistanceMm: 32 })).toEqual({ mm: 2, direction: 'OUT' });
  });

  it('OC closer to the midline than the pupil is IN', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 32, ocDistanceMm: 30 })).toEqual({ mm: 2, direction: 'IN' });
  });

  it('OC exactly at the pupil is zero decentration (reported as IN by the >= 0 tie-break, magnitude 0)', () => {
    expect(deriveHorizontalDecentration({ patientPdMm: 31, ocDistanceMm: 31 })).toEqual({ mm: 0, direction: 'OUT' });
  });

  it('uses the identical formula for OD and OS — no left/right mirroring, because both inputs are already midline-distance magnitudes', () => {
    // OD: pupil 32mm from bridge, OC manufactured 2mm further out (34mm) -> decentered OUT.
    const od = deriveHorizontalDecentration({ patientPdMm: 32, ocDistanceMm: 34 });
    // OS: pupil 30mm from bridge, OC manufactured 2mm further out (32mm) -> decentered OUT.
    // OD's OC physically moved toward +x (if OD is on the +x side) while OS's OC moved toward
    // -x (if OS is on the -x side) -- opposite raw directions -- yet both are "OUT" for their
    // own eye, which is the clinically correct, flip-proof answer.
    const os = deriveHorizontalDecentration({ patientPdMm: 30, ocDistanceMm: 32 });
    expect(od).toEqual({ mm: 2, direction: 'OUT' });
    expect(os).toEqual({ mm: 2, direction: 'OUT' });
  });
});

describe('calculateBinocularInducedPrism', () => {
  it('computes OD and OS independently from their own Rx for the same PD-vs-OC error (unequal powers -> unequal induced prism)', () => {
    // Both eyes decentered 2mm OUT (OC 2mm wider than patient PD), but OD is -2.00D and OS is -4.00D.
    const result = calculateBinocularInducedPrism({
      od: {
        rx: { sphere: -2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 32, ocDistanceMm: 34 },
        vertical: { mm: 0, direction: 'UP' },
      },
      os: {
        rx: { sphere: -4, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 32 },
        vertical: { mm: 0, direction: 'UP' },
      },
    });
    // MOBI: minus lens decentered OUT -> Base In. Delta = c(cm)*F.
    expect(result.od.horizontal).toEqual({ diopters: 0.4, base: 'BI' }); // 0.2cm * 2D
    expect(result.os.horizontal).toEqual({ diopters: 0.8, base: 'BI' }); // 0.2cm * 4D
  });

  it('combines OD+OS into one total only when both induce the same base direction', () => {
    const result = calculateBinocularInducedPrism({
      od: {
        rx: { sphere: -2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 31 }, // 0.1cm OUT -> 0.2D BI
        vertical: { mm: 0, direction: 'UP' },
      },
      os: {
        rx: { sphere: -4, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 30.75 }, // 0.075cm OUT -> 0.3D BI
        vertical: { mm: 0, direction: 'UP' },
      },
    });
    expect(result.od.horizontal?.base).toBe('BI');
    expect(result.os.horizontal?.base).toBe('BI');
    expect(result.combinedHorizontal).toEqual({ diopters: 0.5, base: 'BI' });
  });

  it('does not manufacture a total when OD and OS induce opposite base directions', () => {
    const result = calculateBinocularInducedPrism({
      od: {
        rx: { sphere: -2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 31 }, // OUT -> BI
        vertical: { mm: 0, direction: 'UP' },
      },
      os: {
        rx: { sphere: -2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 29 }, // IN -> BO
        vertical: { mm: 0, direction: 'UP' },
      },
    });
    expect(result.od.horizontal?.base).toBe('BI');
    expect(result.os.horizontal?.base).toBe('BO');
    expect(result.combinedHorizontal).toBeUndefined();
  });

  it('falls back to the single present side when only one eye induces a component', () => {
    const result = calculateBinocularInducedPrism({
      od: {
        rx: { sphere: -2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 31 },
        vertical: { mm: 0, direction: 'UP' },
      },
      os: {
        rx: { sphere: 0, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 30 },
        vertical: { mm: 0, direction: 'UP' },
      },
    });
    expect(result.os.horizontal).toBeUndefined();
    expect(result.combinedHorizontal).toEqual(result.od.horizontal);
  });

  it('handles vertical the same way as horizontal (combine only on matching base)', () => {
    const result = calculateBinocularInducedPrism({
      od: {
        rx: { sphere: 2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 30 },
        vertical: { mm: 2, direction: 'UP' }, // plus lens UP -> BU
      },
      os: {
        rx: { sphere: 2, cylinder: 0, axis: NaN },
        horizontalPosition: { patientPdMm: 30, ocDistanceMm: 30 },
        vertical: { mm: 3, direction: 'UP' }, // plus lens UP -> BU
      },
    });
    expect(result.od.vertical).toEqual({ diopters: 0.4, base: 'BU' });
    expect(result.os.vertical).toEqual({ diopters: 0.6, base: 'BU' });
    expect(result.combinedVertical).toEqual({ diopters: 1, base: 'BU' });
  });
});

describe('validateBinocularInducedPrismInput / hasBinocularInducedPrismErrors', () => {
  const validEye = {
    rx: { sphere: -2, cylinder: 0, axis: NaN },
    horizontalPosition: { patientPdMm: 30, ocDistanceMm: 31 },
    vertical: { mm: 0, direction: 'UP' as const },
  };

  it('accepts a fully valid binocular input', () => {
    const errors = validateBinocularInducedPrismInput({ od: validEye, os: validEye });
    expect(errors.od.patientPdMm).toBeUndefined();
    expect(errors.od.ocDistanceMm).toBeUndefined();
    expect(errors.os.patientPdMm).toBeUndefined();
  });

  it('requires patientPdMm and ocDistanceMm per eye (not optional in Mode 1)', () => {
    const errors = validateBinocularInducedPrismInput({
      od: { ...validEye, horizontalPosition: { patientPdMm: NaN, ocDistanceMm: NaN } },
      os: validEye,
    });
    expect(errors.od.patientPdMm).toBeDefined();
    expect(errors.od.ocDistanceMm).toBeDefined();
    expect(errors.os.patientPdMm).toBeUndefined();
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

describe('calculateBinocularRequiredDecentration', () => {
  it('regression case: OD -2.00D, OS -4.00D, total 2Δ BI equal split -> 1Δ BI each, but different mm (prism split before mm conversion)', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -4, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'total',
        total: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.allocatedTarget).toEqual({ horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' });
    expect(result.os.allocatedTarget).toEqual({ horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' });
    expect(result.od.outcome.ok).toBe(true);
    expect(result.os.outcome.ok).toBe(true);
    if (!result.od.outcome.ok || !result.os.outcome.ok) return;
    // Per the user's flagged manual-test case, re-derived and verified: minus lens + BI target
    // requires the OC decentered OUT (MOBI: minus lens decentered OUT induces Base In). OUT was
    // correct in the original calculator for this single-lens case; the actual bug was scope
    // (single-lens, ambiguous total-vs-per-eye), not direction.
    expect(result.od.outcome.result.horizontal).toEqual({ mm: 5, direction: 'OUT' });
    expect(result.os.outcome.result.horizontal).toEqual({ mm: 2.5, direction: 'OUT' });
  });

  it('matches the user-reported manual test exactly at single-eye scope: -2.00D + 2Δ BI (entered directly, not as a binocular total) -> 10mm OUT, confirmed correct by re-derivation', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.outcome.ok).toBe(true);
    if (!result.od.outcome.ok) return;
    expect(result.od.outcome.result.horizontal).toEqual({ mm: 10, direction: 'OUT' });
  });

  it('+2.00D with desired BI requires the opposite direction (IN) from the minus-lens BI case', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.outcome.ok).toBe(true);
    if (!result.od.outcome.ok) return;
    expect(result.od.outcome.result.horizontal).toEqual({ mm: 10, direction: 'IN' });
  });

  it('+2.00D with desired BO requires OUT; -2.00D with desired BO requires IN', () => {
    const plus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    const minus = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(plus.od.outcome.ok && plus.od.outcome.result.horizontal).toEqual({ mm: 5, direction: 'OUT' });
    expect(minus.od.outcome.ok && minus.od.outcome.result.horizontal).toEqual({ mm: 5, direction: 'IN' });
  });

  it('BU/BD equivalents mirror the horizontal IN/OUT logic for plus and minus lenses', () => {
    const plusBU = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: 2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 1, verticalBase: 'BU' },
        os: { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 1, verticalBase: 'BU' },
      },
    });
    const minusBU = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 1, verticalBase: 'BU' },
        os: { horizontalDiopters: 0, horizontalBase: 'BO', verticalDiopters: 1, verticalBase: 'BU' },
      },
    });
    // Plus lens: base same direction as decentration -> BU needs UP. Minus lens: opposite -> BU needs DOWN.
    expect(plusBU.od.outcome.ok && plusBU.od.outcome.result.vertical).toEqual({ mm: 5, direction: 'UP' });
    expect(minusBU.od.outcome.ok && minusBU.od.outcome.result.vertical).toEqual({ mm: 5, direction: 'DOWN' });
  });

  it('custom split allocates by the given OD fraction, not 50/50', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'total',
        total: { horizontalDiopters: 4, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        horizontalSplit: { odFraction: 0.75 },
      },
    });
    expect(result.od.allocatedTarget.horizontalDiopters).toBe(3);
    expect(result.os.allocatedTarget.horizontalDiopters).toBe(1);
  });

  it('cylinder/axis correctly selects the horizontal vs. vertical meridional power', () => {
    // axis 180: horizontal meridian = S = -1, vertical meridian = S+C = -3.
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -1, cylinder: -2, axis: 180 } },
      os: { rx: { sphere: -1, cylinder: -2, axis: 180 } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 0, horizontalBase: 'BI', verticalDiopters: 1, verticalBase: 'BU' },
      },
    });
    expect(result.od.relevantPower).toEqual({ horizontal: -1, vertical: -3 });
    // Horizontal target uses fxx=-1: c = 1/1 = 1cm = 10mm.
    expect(result.od.outcome.ok && result.od.outcome.result.horizontal?.mm).toBeCloseTo(10, 4);
    // Vertical target uses fyy=-3: c = 1/3 cm = 3.33mm.
    expect(result.os.outcome.ok && result.os.outcome.result.vertical?.mm).toBeCloseTo(3.333, 2);
  });

  it('reports an independent singularity per eye — one eye undefined does not block the other', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: 0, cylinder: 0, axis: NaN } }, // plano -> singular
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.outcome.ok).toBe(false);
    expect(result.os.outcome.ok).toBe(true);
  });

  it('converts the required OC shift into a monocular ordering PD, direction-aware', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 32 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 30 },
      allocation: {
        mode: 'perEye',
        // OD needs BI (-> OUT, +5mm from patient PD); OS needs BO (-> IN, -5mm from patient PD).
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BO', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.outcome.ok && result.od.outcome.result.horizontal).toEqual({ mm: 5, direction: 'OUT' });
    expect(result.od.orderingPdMm).toBe(37); // 32 + 5
    expect(result.os.outcome.ok && result.os.outcome.result.horizontal).toEqual({ mm: 5, direction: 'IN' });
    expect(result.os.orderingPdMm).toBe(25); // 30 - 5
  });

  it('omits ordering PD when patientPdMm was not supplied', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.orderingPdMm).toBeUndefined();
  });

  it('flags a target above the extreme-prism guideline with a caution, not a rejection', () => {
    const result = calculateBinocularRequiredDecentration({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 12, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(result.od.outcome.ok).toBe(true);
    expect(result.od.caution).toBeDefined();
    expect(result.os.caution).toBeUndefined();
  });

  it('round-trips through calculateBinocularInducedPrism: desired prism -> required decentration -> fed back in -> recovers the original prism per eye', () => {
    const odRx = { sphere: -2, cylinder: -1, axis: 60 };
    const osRx = { sphere: -3, cylinder: -0.75, axis: 120 };
    const required = calculateBinocularRequiredDecentration({
      od: { rx: odRx },
      os: { rx: osRx },
      allocation: {
        mode: 'total',
        total: { horizontalDiopters: 3, horizontalBase: 'BI', verticalDiopters: 1, verticalBase: 'BU' },
      },
    });
    expect(required.od.outcome.ok).toBe(true);
    expect(required.os.outcome.ok).toBe(true);
    if (!required.od.outcome.ok || !required.os.outcome.ok) return;

    // Feed the required decentration back through Mode 1 (via monocular PD/OC positions built
    // to reproduce the same signed decentration) and confirm we recover each eye's allocated target.
    const toPosition = (mm: number, direction: 'IN' | 'OUT') => ({
      patientPdMm: 30,
      ocDistanceMm: direction === 'OUT' ? 30 + mm : 30 - mm,
    });
    const achieved = calculateBinocularInducedPrism({
      od: {
        rx: odRx,
        horizontalPosition: toPosition(required.od.outcome.result.horizontal?.mm ?? 0, required.od.outcome.result.horizontal?.direction ?? 'OUT'),
        vertical: { mm: required.od.outcome.result.vertical?.mm ?? 0, direction: required.od.outcome.result.vertical?.direction ?? 'UP' },
      },
      os: {
        rx: osRx,
        horizontalPosition: toPosition(required.os.outcome.result.horizontal?.mm ?? 0, required.os.outcome.result.horizontal?.direction ?? 'OUT'),
        vertical: { mm: required.os.outcome.result.vertical?.mm ?? 0, direction: required.os.outcome.result.vertical?.direction ?? 'UP' },
      },
    });

    expect(achieved.od.horizontal?.diopters).toBeCloseTo(required.od.allocatedTarget.horizontalDiopters, 4);
    expect(achieved.od.horizontal?.base).toBe(required.od.allocatedTarget.horizontalBase);
    expect(achieved.od.vertical?.diopters).toBeCloseTo(required.od.allocatedTarget.verticalDiopters, 4);
    expect(achieved.od.vertical?.base).toBe(required.od.allocatedTarget.verticalBase);

    expect(achieved.os.horizontal?.diopters).toBeCloseTo(required.os.allocatedTarget.horizontalDiopters, 4);
    expect(achieved.os.horizontal?.base).toBe(required.os.allocatedTarget.horizontalBase);
    expect(achieved.os.vertical?.diopters).toBeCloseTo(required.os.allocatedTarget.verticalDiopters, 4);
    expect(achieved.os.vertical?.base).toBe(required.os.allocatedTarget.verticalBase);
  });
});

describe('validateBinocularRequiredDecentrationInput', () => {
  it('accepts a valid perEye input', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(errors.odTarget).toBeUndefined();
    expect(errors.osTarget).toBeUndefined();
    expect(errors.od.sphere).toBeUndefined();
  });

  it('accepts a valid total input with no split (defaults to equal)', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: { mode: 'total', total: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' } },
    });
    expect(errors.total).toBeUndefined();
  });

  it('rejects a negative per-eye target', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: -1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(errors.odTarget?.horizontalDiopters).toBeDefined();
    expect(errors.osTarget).toBeUndefined();
  });

  it('rejects an out-of-range split fraction', () => {
    const errors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'total',
        total: { horizontalDiopters: 2, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        horizontalSplit: { odFraction: 1.5 },
      },
    });
    expect(errors.horizontalSplit).toBeDefined();
  });

  it('accepts an optional patientPdMm and rejects a negative one', () => {
    const validErrors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: 32 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(validErrors.od.patientPdMm).toBeUndefined();
    expect(validErrors.os.patientPdMm).toBeUndefined();

    const invalidErrors = validateBinocularRequiredDecentrationInput({
      od: { rx: { sphere: -2, cylinder: 0, axis: NaN }, patientPdMm: -5 },
      os: { rx: { sphere: -2, cylinder: 0, axis: NaN } },
      allocation: {
        mode: 'perEye',
        od: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
        os: { horizontalDiopters: 1, horizontalBase: 'BI', verticalDiopters: 0, verticalBase: 'BU' },
      },
    });
    expect(invalidErrors.od.patientPdMm).toBeDefined();
  });
});
