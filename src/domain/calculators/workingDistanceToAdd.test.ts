import { describe, expect, it } from 'vitest';
import {
  MAX_WORKING_DISTANCE_CM,
  MIN_WORKING_DISTANCE_CM,
  convertWorkingDistanceToAdd,
  validateWorkingDistanceToAddInput,
} from './workingDistanceToAdd';

describe('convertWorkingDistanceToAdd', () => {
  it('matches the worked example: +1.50 D at 50cm -> 80cm', () => {
    const result = convertWorkingDistanceToAdd({ knownAdd: 1.5, testedDistanceCm: 50, newDistanceCm: 80 });
    expect(result.testedDistanceDemand).toBeCloseTo(2.0);
    expect(result.newDistanceDemand).toBeCloseTo(1.25);
    expect(result.equivalentAdd).toBeCloseTo(0.75);
    expect(result.nearestQuarterAdd).toBeCloseTo(0.75);
    expect(result.requiresCaution).toBe(false);
  });

  it('returns the known ADD unchanged when tested and new distance match', () => {
    const result = convertWorkingDistanceToAdd({ knownAdd: 1.5, testedDistanceCm: 50, newDistanceCm: 50 });
    expect(result.equivalentAdd).toBeCloseTo(1.5);
    expect(result.requiresCaution).toBe(false);
  });

  it('rounds a non-quarter-diopter result to the nearest 0.25 D without altering the exact value', () => {
    // 1/0.42 - 1/0.40 demand difference produces a result that isn't a clean quarter step.
    const result = convertWorkingDistanceToAdd({ knownAdd: 2.0, testedDistanceCm: 40, newDistanceCm: 42 });
    expect(result.equivalentAdd).toBeCloseTo(1.881, 3);
    expect(result.nearestQuarterAdd).toBeCloseTo(2.0);
  });

  it('flags requiresCaution when the equivalent ADD is exactly zero', () => {
    // known ADD 0.50 at 40cm (2.50D demand); moving to a distance with 2.00D demand (50cm) drops it to 0.
    const result = convertWorkingDistanceToAdd({ knownAdd: 0.5, testedDistanceCm: 40, newDistanceCm: 50 });
    expect(result.equivalentAdd).toBeCloseTo(0);
    expect(result.requiresCaution).toBe(true);
  });

  it('flags requiresCaution and still returns the exact negative result', () => {
    const result = convertWorkingDistanceToAdd({ knownAdd: 0.5, testedDistanceCm: 40, newDistanceCm: 100 });
    expect(result.equivalentAdd).toBeLessThan(0);
    expect(result.requiresCaution).toBe(true);
  });
});

describe('validateWorkingDistanceToAddInput', () => {
  it('accepts a fully valid input', () => {
    const errors = validateWorkingDistanceToAddInput({ knownAdd: 1.5, testedDistanceCm: 50, newDistanceCm: 80 });
    expect(errors).toEqual({});
  });

  it('rejects a missing (NaN) ADD', () => {
    const errors = validateWorkingDistanceToAddInput({
      knownAdd: NaN,
      testedDistanceCm: 50,
      newDistanceCm: 80,
    });
    expect(errors.knownAdd).toBeDefined();
  });

  it('rejects a zero ADD', () => {
    const errors = validateWorkingDistanceToAddInput({ knownAdd: 0, testedDistanceCm: 50, newDistanceCm: 80 });
    expect(errors.knownAdd).toBeDefined();
  });

  it('rejects a negative ADD', () => {
    const errors = validateWorkingDistanceToAddInput({ knownAdd: -1, testedDistanceCm: 50, newDistanceCm: 80 });
    expect(errors.knownAdd).toBeDefined();
  });

  it('rejects zero or negative working distance', () => {
    expect(
      validateWorkingDistanceToAddInput({ knownAdd: 1.5, testedDistanceCm: 0, newDistanceCm: 80 }).testedDistanceCm,
    ).toBeDefined();
    expect(
      validateWorkingDistanceToAddInput({ knownAdd: 1.5, testedDistanceCm: -10, newDistanceCm: 80 })
        .testedDistanceCm,
    ).toBeDefined();
  });

  it('rejects working distance outside the 20-500cm sanity range', () => {
    expect(
      validateWorkingDistanceToAddInput({
        knownAdd: 1.5,
        testedDistanceCm: MIN_WORKING_DISTANCE_CM - 1,
        newDistanceCm: 80,
      }).testedDistanceCm,
    ).toBeDefined();
    expect(
      validateWorkingDistanceToAddInput({
        knownAdd: 1.5,
        testedDistanceCm: 50,
        newDistanceCm: MAX_WORKING_DISTANCE_CM + 1,
      }).newDistanceCm,
    ).toBeDefined();
  });

  it('accepts the boundary values 20cm and 500cm', () => {
    const errors = validateWorkingDistanceToAddInput({
      knownAdd: 1.5,
      testedDistanceCm: MIN_WORKING_DISTANCE_CM,
      newDistanceCm: MAX_WORKING_DISTANCE_CM,
    });
    expect(errors).toEqual({});
  });
});
