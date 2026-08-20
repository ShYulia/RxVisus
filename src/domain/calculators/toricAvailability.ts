import type { Prescription } from './transposition';

/**
 * Describes a set of stock parameters a toric lens (or lens line) is actually available in.
 * Purely a mathematical availability grid — it never encodes a lens-selection decision.
 */
export interface ToricAvailabilityProfile {
  id: string;
  name: string;
  /** Minus-cylinder notation, e.g. -0.75. Any order — sorted internally. */
  availableCylindersD: number[];
  axisIncrementDeg: number;
  sphereStepD: number;
}

/** Generic starter profile — not a real manufacturer catalogue. */
export const GENERIC_TORIC_AVAILABILITY_PROFILE: ToricAvailabilityProfile = {
  id: 'generic-toric',
  name: 'Generic toric (minus cylinder)',
  availableCylindersD: [-0.75, -1.25, -1.75, -2.25, -2.75],
  axisIncrementDeg: 10,
  sphereStepD: 0.25,
};

export interface ToricAvailabilityMapping {
  sphere: number;
  /** One value, or two when the exact cylinder is equidistant between two configured values. */
  cylinderCandidatesD: number[];
  axis: number;
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step;
}

const TIE_EPSILON = 1e-9;

function nearestCylinders(exactD: number, availableD: number[]): number[] {
  const sorted = [...availableD].sort((a, b) => a - b);
  const distances = sorted.map((c) => Math.abs(c - exactD));
  const minDistance = Math.min(...distances);
  return sorted.filter((_, i) => Math.abs(distances[i] - minDistance) < TIE_EPSILON);
}

/**
 * Circular rounding to the nearest axis increment, treating 0 and 180 as the same point
 * (axis is expressed on a 1-180 scale, so the wrapped result is reported as 180, never 0).
 */
function roundAxisCircular(axis: number, incrementDeg: number): number {
  const normalized = axis % 180;
  const nearestMultiple = Math.round(normalized / incrementDeg) * incrementDeg;
  const wrapped = nearestMultiple % 180;
  return wrapped === 0 ? 180 : wrapped;
}

/**
 * Maps an exact optical result to the nearest configured stock parameters. This answers
 * "which configured parameters are closest?" — never "which lens should be prescribed?".
 */
export function mapToAvailability(rx: Prescription, profile: ToricAvailabilityProfile): ToricAvailabilityMapping {
  return {
    sphere: roundToStep(rx.sphere, profile.sphereStepD),
    cylinderCandidatesD: nearestCylinders(rx.cylinder, profile.availableCylindersD),
    axis: roundAxisCircular(rx.axis, profile.axisIncrementDeg),
  };
}
