import { describe, expect, it } from 'vitest';
import { transpose } from './transposition';
import {
  calculateInducedPrism,
  calculateRequiredDecentration,
  validateInducedPrismInput,
  validateRequiredDecentrationInput,
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
