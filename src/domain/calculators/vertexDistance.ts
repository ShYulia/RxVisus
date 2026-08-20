import type { Prescription } from './transposition';

/**
 * Below this, the conversion denominator is treated as zero — the result is
 * mathematically undefined (power would require an infinite/undefined value
 * at the new vertex distance), not a clinical caution.
 */
const SINGULARITY_EPSILON = 1e-6;

export interface VertexDistanceInput {
  rx: Prescription;
  fromVertexMm: number;
  toVertexMm: number;
}

export interface VertexDistanceValidationErrors {
  sphere?: string;
  cylinder?: string;
  axis?: string;
  fromVertexMm?: string;
  toVertexMm?: string;
}

export interface VertexDistanceMeridian {
  /** Power at the "from" vertex distance. */
  power: number;
  /** Power converted to the "to" vertex distance. */
  convertedPower: number;
}

export interface VertexDistanceCalculation {
  /** Exact optical result, reconstructed in minus-cylinder notation. */
  rx: Prescription;
  meridian1: VertexDistanceMeridian;
  meridian2: VertexDistanceMeridian;
}

export type VertexDistanceResult =
  | { ok: true; result: VertexDistanceCalculation }
  | { ok: false; reason: 'singularity' };

function validateVertexMm(mm: number): string | undefined {
  if (Number.isNaN(mm)) return 'Enter a vertex distance.';
  if (mm < 0) return 'Vertex distance cannot be negative.';
  return undefined;
}

function validateSphere(sphere: number): string | undefined {
  if (Number.isNaN(sphere)) return 'Enter the sphere power.';
  return undefined;
}

function validateCylinder(cylinder: number): string | undefined {
  if (Number.isNaN(cylinder)) return 'Enter the cylinder power.';
  if (cylinder > 0) return 'Cylinder must be zero or negative — this calculator uses minus-cylinder notation.';
  return undefined;
}

/**
 * Axis is clinically meaningless for a spherical-only Rx (cylinder = 0), so it's only
 * required when there's an actual cylinder to give an axis to. A value that IS entered
 * still has to be in range, even when not required.
 */
function validateAxis(axis: number, required: boolean): string | undefined {
  if (Number.isNaN(axis)) return required ? 'Enter the axis.' : undefined;
  if (axis < 1 || axis > 180) return 'Axis must be between 1 and 180.';
  return undefined;
}

export function validateVertexDistanceInput(input: VertexDistanceInput): VertexDistanceValidationErrors {
  const errors: VertexDistanceValidationErrors = {};
  const sphereError = validateSphere(input.rx.sphere);
  if (sphereError) errors.sphere = sphereError;
  const cylinderError = validateCylinder(input.rx.cylinder);
  if (cylinderError) errors.cylinder = cylinderError;
  const axisError = validateAxis(input.rx.axis, input.rx.cylinder !== 0);
  if (axisError) errors.axis = axisError;
  const fromError = validateVertexMm(input.fromVertexMm);
  if (fromError) errors.fromVertexMm = fromError;
  const toError = validateVertexMm(input.toVertexMm);
  if (toError) errors.toVertexMm = toError;
  return errors;
}

/** Fixes float noise without imposing a clinical rounding rule. */
function cleanFloat(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/** F2 = F1 / (1 - t*F1), t = (fromVertexMm - toVertexMm) in meters. Returns null at the singularity. */
function convertMeridianPower(power: number, t: number): number | null {
  const denominator = 1 - t * power;
  if (Math.abs(denominator) < SINGULARITY_EPSILON) return null;
  return cleanFloat(power / denominator);
}

/** Axis has no clinical meaning for a spherical-only Rx — this is a neutral placeholder, never a measurement. */
const NO_CYLINDER_AXIS_PLACEHOLDER = 180;

/**
 * Converts a prescription from one vertex distance to another, applying the vertex-distance
 * formula independently to each principal meridian (sphere, and sphere+cylinder), then
 * reconstructing minus-cylinder sphere/cylinder. Axis is unaffected by vertex conversion.
 * Assumes valid input — call validateVertexDistanceInput first.
 */
export function convertVertexDistance(input: VertexDistanceInput): VertexDistanceResult {
  const t = (input.fromVertexMm - input.toVertexMm) / 1000;

  const meridian1Power = input.rx.sphere;
  const meridian2Power = input.rx.sphere + input.rx.cylinder;

  const convertedMeridian1 = convertMeridianPower(meridian1Power, t);
  const convertedMeridian2 = convertMeridianPower(meridian2Power, t);

  if (convertedMeridian1 === null || convertedMeridian2 === null) {
    return { ok: false, reason: 'singularity' };
  }

  const axis =
    input.rx.cylinder === 0 && Number.isNaN(input.rx.axis) ? NO_CYLINDER_AXIS_PLACEHOLDER : input.rx.axis;

  return {
    ok: true,
    result: {
      rx: {
        sphere: convertedMeridian1,
        cylinder: cleanFloat(convertedMeridian2 - convertedMeridian1),
        axis,
      },
      meridian1: { power: meridian1Power, convertedPower: convertedMeridian1 },
      meridian2: { power: meridian2Power, convertedPower: convertedMeridian2 },
    },
  };
}
