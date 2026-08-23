import type { Prescription } from './transposition';

/**
 * Below this, a determinant/component is treated as zero — the reverse calculation would
 * require infinite decentration (mathematically undefined), not a clinical caution.
 */
const SINGULARITY_EPSILON = 1e-6;

/**
 * Below this, a computed prism/decentration component is reported as absent, not "0.00".
 * Set well above float noise, not just above zero: chaining a reverse solve into a forward
 * check (as the round-trip tests do) can leave residues around 1e-6 from the intermediate
 * cleanFloat rounding, which a tighter epsilon would misreport as a real component.
 */
const ZERO_EPSILON = 1e-4;

export type HorizontalDecentrationDirection = 'IN' | 'OUT';
export type VerticalDecentrationDirection = 'UP' | 'DOWN';
export type HorizontalPrismBase = 'BI' | 'BO';
export type VerticalPrismBase = 'BU' | 'BD';

export interface Decentration {
  horizontalMm: number;
  horizontalDirection: HorizontalDecentrationDirection;
  verticalMm: number;
  verticalDirection: VerticalDecentrationDirection;
}

export interface InducedPrism {
  /** Omitted when there's no horizontal component (within floating-point tolerance) to report. */
  horizontal?: { diopters: number; base: HorizontalPrismBase };
  /** Omitted when there's no vertical component (within floating-point tolerance) to report. */
  vertical?: { diopters: number; base: VerticalPrismBase };
}

export interface TargetPrism {
  horizontalDiopters: number;
  horizontalBase: HorizontalPrismBase;
  verticalDiopters: number;
  verticalBase: VerticalPrismBase;
}

export interface RequiredDecentration {
  /** Omitted when no horizontal decentration is needed to reach the target. */
  horizontal?: { mm: number; direction: HorizontalDecentrationDirection };
  /** Omitted when no vertical decentration is needed to reach the target. */
  vertical?: { mm: number; direction: VerticalDecentrationDirection };
}

export type RequiredDecentrationResult =
  | { ok: true; result: RequiredDecentration }
  | { ok: false; reason: 'singularity' };

export interface InducedPrismInput {
  rx: Prescription;
  decentration: Decentration;
}

export interface RequiredDecentrationInput {
  rx: Prescription;
  target: TargetPrism;
}

export interface PrismRxValidationErrors {
  sphere?: string;
  cylinder?: string;
  axis?: string;
}

export interface InducedPrismValidationErrors extends PrismRxValidationErrors {
  horizontalMm?: string;
  verticalMm?: string;
}

export interface RequiredDecentrationValidationErrors extends PrismRxValidationErrors {
  horizontalDiopters?: string;
  verticalDiopters?: string;
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

function validateRx(rx: Prescription): PrismRxValidationErrors {
  const errors: PrismRxValidationErrors = {};
  const sphereError = validateSphere(rx.sphere);
  if (sphereError) errors.sphere = sphereError;
  const cylinderError = validateCylinder(rx.cylinder);
  if (cylinderError) errors.cylinder = cylinderError;
  const axisError = validateAxis(rx.axis, rx.cylinder !== 0);
  if (axisError) errors.axis = axisError;
  return errors;
}

function validateMm(mm: number): string | undefined {
  if (Number.isNaN(mm)) return 'Enter a decentration amount.';
  if (mm < 0) return 'Decentration cannot be negative — use the direction toggle instead.';
  return undefined;
}

function validateDiopters(value: number): string | undefined {
  if (Number.isNaN(value)) return 'Enter a prism amount.';
  if (value < 0) return 'Prism cannot be negative — use the base direction toggle instead.';
  return undefined;
}

export function validateInducedPrismInput(input: InducedPrismInput): InducedPrismValidationErrors {
  const errors: InducedPrismValidationErrors = validateRx(input.rx);
  const horizontalError = validateMm(input.decentration.horizontalMm);
  if (horizontalError) errors.horizontalMm = horizontalError;
  const verticalError = validateMm(input.decentration.verticalMm);
  if (verticalError) errors.verticalMm = verticalError;
  return errors;
}

export function validateRequiredDecentrationInput(input: RequiredDecentrationInput): RequiredDecentrationValidationErrors {
  const errors: RequiredDecentrationValidationErrors = validateRx(input.rx);
  const horizontalError = validateDiopters(input.target.horizontalDiopters);
  if (horizontalError) errors.horizontalDiopters = horizontalError;
  const verticalError = validateDiopters(input.target.verticalDiopters);
  if (verticalError) errors.verticalDiopters = verticalError;
  return errors;
}

/** Fixes float noise without imposing a clinical rounding rule. */
function cleanFloat(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

interface PowerMatrix {
  fxx: number;
  fyy: number;
  fxy: number;
}

/**
 * The sphero-cylindrical dioptric power matrix (Long's power-matrix formulation), equivalent
 * to the sine-squared cross-cylinder formula Fθ = S + C·sin²(θ − axis) but expressed in the
 * horizontal/vertical (x/y) basis so it can be combined with an arbitrary (horizontal +
 * vertical) decentration vector in one step. Its eigenvalues are exactly the two principal
 * meridian powers (S and S+C), and it is invariant under transposition to plus-cylinder form.
 *
 * Cylinder = 0 is handled directly (bypassing axis) rather than falling through the general
 * formula, since axis may legitimately be NaN for a spherical-only Rx.
 */
function powerMatrix(rx: Prescription): PowerMatrix {
  if (rx.cylinder === 0) {
    return { fxx: rx.sphere, fyy: rx.sphere, fxy: 0 };
  }
  const axisRad = (rx.axis * Math.PI) / 180;
  const sin = Math.sin(axisRad);
  const cos = Math.cos(axisRad);
  return {
    fxx: rx.sphere + rx.cylinder * sin * sin,
    fyy: rx.sphere + rx.cylinder * cos * cos,
    fxy: -rx.cylinder * sin * cos,
  };
}

/**
 * Induced prism from decentering a sphero-cylindrical lens (vector/matrix generalization of
 * Prentice's Rule: Δ = F·c). Decentration is the lens's optical center relative to the
 * pupil — OUT/UP are the positive directions — which is exactly the sign convention needed
 * for the result's sign to read directly as a base direction: a positive horizontal
 * component is BO, a positive vertical component is BU (this matches, and was verified
 * against, the standard "MOBI" teaching case: a minus lens decentered OUT induces BASE IN).
 *
 * An oblique cylinder axis couples the two meridians (Fxy ≠ 0), so a purely horizontal
 * decentration can still induce a vertical prism component — that's real optics, not a bug.
 * Assumes valid input — call validateInducedPrismInput first.
 */
export function calculateInducedPrism(rx: Prescription, decentration: Decentration): InducedPrism {
  const { fxx, fyy, fxy } = powerMatrix(rx);

  const cx = (decentration.horizontalMm / 10) * (decentration.horizontalDirection === 'OUT' ? 1 : -1);
  const cy = (decentration.verticalMm / 10) * (decentration.verticalDirection === 'UP' ? 1 : -1);

  const deltaX = cleanFloat(fxx * cx + fxy * cy);
  const deltaY = cleanFloat(fxy * cx + fyy * cy);

  const result: InducedPrism = {};
  if (Math.abs(deltaX) >= ZERO_EPSILON) {
    result.horizontal = { diopters: Math.abs(deltaX), base: deltaX > 0 ? 'BO' : 'BI' };
  }
  if (Math.abs(deltaY) >= ZERO_EPSILON) {
    result.vertical = { diopters: Math.abs(deltaY), base: deltaY > 0 ? 'BU' : 'BD' };
  }
  return result;
}

/**
 * Reverse Prentice's Rule: the decentration required to induce a desired prism (c = F⁻¹·Δ).
 * For an oblique cylinder, a purely horizontal (or vertical) target can require decentration
 * in both directions at once — the matrix inverse captures that correctly; a naive c = Δ/F
 * per axis would not.
 *
 * Undefined (singular) whenever either principal meridian is plano (det(F) = S·(S+C) = 0):
 * reaching a target that depends on a zero-power meridian would require infinite
 * decentration. This is reported as a clean "undefined" rather than a partial/pseudo-inverse
 * solution, deliberately — same policy as vertexDistance.ts's singularity handling.
 */
export function calculateRequiredDecentration(rx: Prescription, target: TargetPrism): RequiredDecentrationResult {
  const { fxx, fyy, fxy } = powerMatrix(rx);
  const det = fxx * fyy - fxy * fxy;

  if (Math.abs(det) < SINGULARITY_EPSILON) {
    return { ok: false, reason: 'singularity' };
  }

  const deltaX = target.horizontalDiopters * (target.horizontalBase === 'BO' ? 1 : -1);
  const deltaY = target.verticalDiopters * (target.verticalBase === 'BU' ? 1 : -1);

  const cx = cleanFloat((fyy * deltaX - fxy * deltaY) / det);
  const cy = cleanFloat((-fxy * deltaX + fxx * deltaY) / det);

  const result: RequiredDecentration = {};
  if (Math.abs(cx) >= ZERO_EPSILON) {
    result.horizontal = { mm: Math.abs(cx) * 10, direction: cx > 0 ? 'OUT' : 'IN' };
  }
  if (Math.abs(cy) >= ZERO_EPSILON) {
    result.vertical = { mm: Math.abs(cy) * 10, direction: cy > 0 ? 'UP' : 'DOWN' };
  }
  return { ok: true, result };
}
