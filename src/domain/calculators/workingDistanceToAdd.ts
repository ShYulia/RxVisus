/** Sanity bounds for working distance, in cm. Catches input mistakes — not a clinical range. */
export const MIN_WORKING_DISTANCE_CM = 20;
export const MAX_WORKING_DISTANCE_CM = 500;

export interface WorkingDistanceToAddInput {
  knownAdd: number;
  testedDistanceCm: number;
  newDistanceCm: number;
}

export interface WorkingDistanceToAddValidationErrors {
  knownAdd?: string;
  testedDistanceCm?: string;
  newDistanceCm?: string;
}

export interface WorkingDistanceToAddResult {
  /** Full-precision mathematical result. */
  equivalentAdd: number;
  /** equivalentAdd rounded to the nearest 0.25 D — a practical lens-power reference, not a recommendation. */
  nearestQuarterAdd: number;
  /** True when equivalentAdd <= 0 — the conversion does not yield a usable positive ADD. */
  requiresCaution: boolean;
  testedDistanceDemand: number;
  newDistanceDemand: number;
}

function validateDistance(cm: number): string | undefined {
  if (Number.isNaN(cm)) return 'Enter a working distance.';
  if (cm <= 0) return 'Working distance must be greater than 0 cm.';
  if (cm < MIN_WORKING_DISTANCE_CM || cm > MAX_WORKING_DISTANCE_CM) {
    return `Working distance must be between ${MIN_WORKING_DISTANCE_CM} and ${MAX_WORKING_DISTANCE_CM} cm.`;
  }
  return undefined;
}

function validateKnownAdd(add: number): string | undefined {
  if (Number.isNaN(add)) return 'Enter the clinically tested ADD.';
  if (add <= 0) return 'Clinically tested ADD must be a positive value.';
  return undefined;
}

export function validateWorkingDistanceToAddInput(
  input: WorkingDistanceToAddInput,
): WorkingDistanceToAddValidationErrors {
  const errors: WorkingDistanceToAddValidationErrors = {};
  const knownAddError = validateKnownAdd(input.knownAdd);
  if (knownAddError) errors.knownAdd = knownAddError;
  const testedError = validateDistance(input.testedDistanceCm);
  if (testedError) errors.testedDistanceCm = testedError;
  const newError = validateDistance(input.newDistanceCm);
  if (newError) errors.newDistanceCm = newError;
  return errors;
}

function roundToQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}

/**
 * Converts a clinically tested ADD to an equivalent ADD at a different working distance,
 * preserving the patient's own accommodative contribution at the tested distance.
 * Assumes valid input — call validateWorkingDistanceToAddInput first.
 */
export function convertWorkingDistanceToAdd(input: WorkingDistanceToAddInput): WorkingDistanceToAddResult {
  const testedDistanceDemand = 100 / input.testedDistanceCm;
  const newDistanceDemand = 100 / input.newDistanceCm;
  const equivalentAdd = input.knownAdd + (newDistanceDemand - testedDistanceDemand);
  return {
    equivalentAdd,
    nearestQuarterAdd: roundToQuarter(equivalentAdd),
    requiresCaution: equivalentAdd <= 0,
    testedDistanceDemand,
    newDistanceDemand,
  };
}
