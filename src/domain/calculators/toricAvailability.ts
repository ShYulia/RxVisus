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
  /**
   * One value, or two when the exact cylinder is equidistant between two configured values.
   * Empty when the exact result is cylinder = 0, or when |cylinder| is below the smallest
   * configured toric cylinder — both are recommended as spherical rather than snapped up to
   * a toric cylinder the exact result doesn't actually call for. In the below-threshold case,
   * `sphere` is the spherical equivalent of the exact Rx, not the raw sphere component.
   */
  cylinderCandidatesD: number[];
  /** Omitted when cylinderCandidatesD is empty — axis is meaningless for a spherical-only Rx. */
  axis?: number;
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
 *
 * cylinder = 0 is treated as genuinely spherical, not "toric with a very small cylinder" —
 * it's reported as sphere-only rather than snapped to the nearest configured toric cylinder.
 *
 * Below the smallest configured toric cylinder, the exact cylinder is likewise not rounded
 * up into the toric grid — it's reported spherical, using the spherical equivalent (not the
 * raw sphere component) so the recommendation still reflects the whole exact result. At or
 * above that threshold, the normal nearest-configured-cylinder mapping applies.
 */
export function mapToAvailability(rx: Prescription, profile: ToricAvailabilityProfile): ToricAvailabilityMapping {
  if (rx.cylinder === 0) {
    return { sphere: roundToStep(rx.sphere, profile.sphereStepD), cylinderCandidatesD: [] };
  }

  const smallestAvailableCylinderMagnitude = Math.min(...profile.availableCylindersD.map((c) => Math.abs(c)));
  const belowSmallestAvailableCylinder =
    smallestAvailableCylinderMagnitude - Math.abs(rx.cylinder) > TIE_EPSILON;

  if (belowSmallestAvailableCylinder) {
    const sphericalEquivalent = rx.sphere + rx.cylinder / 2;
    return { sphere: roundToStep(sphericalEquivalent, profile.sphereStepD), cylinderCandidatesD: [] };
  }

  return {
    sphere: roundToStep(rx.sphere, profile.sphereStepD),
    cylinderCandidatesD: nearestCylinders(rx.cylinder, profile.availableCylindersD),
    axis: roundAxisCircular(rx.axis, profile.axisIncrementDeg),
  };
}
