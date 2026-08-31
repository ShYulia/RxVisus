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

// ---------------------------------------------------------------------------
// Binocular layer
//
// The two functions above compute one lens in isolation, which is the correct
// unit of optical computation (Prentice's Rule always acts on a single lens's
// own power) but not the correct unit of *clinical* computation — both real
// tasks ("what prism does this patient actually experience", "how do I induce
// this prism") are inherently binocular: OD and OS can carry different power,
// so they generally require different decentration for the same prism, and a
// binocular result has to make clear when OD/OS combine into one meaningful
// number versus when they don't. Everything below composes the single-lens
// functions per eye; it never re-derives or duplicates the Prentice math.
// ---------------------------------------------------------------------------

export interface MonocularPosition {
  /**
   * Distance from the facial/bridge midline to this eye's pupil (visual axis), mm.
   * Always a non-negative magnitude — "how far this eye's pupil sits from the nose" —
   * never a signed left/right coordinate.
   */
  patientPdMm: number;
  /** Distance from the facial/bridge midline to this eye's manufactured optical center, mm. Same convention as patientPdMm. */
  ocDistanceMm: number;
}

/**
 * Derives horizontal decentration (the OC's position relative to the patient's visual axis)
 * from two from-midline distances. Both inputs are magnitudes measured the same way for
 * either eye — "farther from the midline" means "more temporal" whether it's OD or OS — so
 * this one formula is correct for both eyes without any left/right mirroring. That's
 * deliberate: the classic nasal/temporal flip bug comes from mixing a signed shared axis with
 * per-eye meaning, and there's no signed shared axis here to get backwards.
 *
 * OUT (temporal) is the standard optical-dispensing sense of "decentered out": increasing the
 * distance between the OC and the visual axis by moving the OC away from the nose, e.g.
 * ordering the lab's PD wider than the patient's PD.
 */
export function deriveHorizontalDecentration(
  position: MonocularPosition,
): { mm: number; direction: HorizontalDecentrationDirection } {
  const signed = cleanFloat(position.ocDistanceMm - position.patientPdMm);
  return { mm: Math.abs(signed), direction: signed >= 0 ? 'OUT' : 'IN' };
}

function combine<Base extends string>(
  a?: { diopters: number; base: Base },
  b?: { diopters: number; base: Base },
): { diopters: number; base: Base } | undefined {
  if (a && b) return a.base === b.base ? { diopters: cleanFloat(a.diopters + b.diopters), base: a.base } : undefined;
  return a ?? b;
}

// --- Mode 1: Induced Prism (binocular) --------------------------------------

export interface EyeInducedPrismInput {
  rx: Prescription;
  horizontalPosition: MonocularPosition;
  vertical: { mm: number; direction: VerticalDecentrationDirection };
}

export interface BinocularInducedPrismInput {
  od: EyeInducedPrismInput;
  os: EyeInducedPrismInput;
}

export interface BinocularInducedPrismResult {
  od: InducedPrism;
  os: InducedPrism;
  /** Present only when OD and OS induce the *same* base direction — see combine(). A mismatched pair is never collapsed into one misleading total. */
  combinedHorizontal?: { diopters: number; base: HorizontalPrismBase };
  combinedVertical?: { diopters: number; base: VerticalPrismBase };
}

export interface EyeInducedPrismValidationErrors extends PrismRxValidationErrors {
  patientPdMm?: string;
  ocDistanceMm?: string;
  verticalMm?: string;
}

export interface BinocularInducedPrismValidationErrors {
  od: EyeInducedPrismValidationErrors;
  os: EyeInducedPrismValidationErrors;
}

function validateMonocularPosition(position: MonocularPosition): Pick<EyeInducedPrismValidationErrors, 'patientPdMm' | 'ocDistanceMm'> {
  const errors: Pick<EyeInducedPrismValidationErrors, 'patientPdMm' | 'ocDistanceMm'> = {};
  if (Number.isNaN(position.patientPdMm)) errors.patientPdMm = "Enter the patient's monocular PD.";
  else if (position.patientPdMm < 0) errors.patientPdMm = 'PD cannot be negative.';
  if (Number.isNaN(position.ocDistanceMm)) errors.ocDistanceMm = 'Enter the optical center position.';
  else if (position.ocDistanceMm < 0) errors.ocDistanceMm = 'Distance cannot be negative.';
  return errors;
}

function validateEyeInducedPrismInput(input: EyeInducedPrismInput): EyeInducedPrismValidationErrors {
  const errors: EyeInducedPrismValidationErrors = { ...validateRx(input.rx), ...validateMonocularPosition(input.horizontalPosition) };
  const verticalError = validateMm(input.vertical.mm);
  if (verticalError) errors.verticalMm = verticalError;
  return errors;
}

function hasEyeErrors<T extends object>(errors: T): boolean {
  return Object.values(errors).some((v) => v !== undefined);
}

export function validateBinocularInducedPrismInput(input: BinocularInducedPrismInput): BinocularInducedPrismValidationErrors {
  return { od: validateEyeInducedPrismInput(input.od), os: validateEyeInducedPrismInput(input.os) };
}

export function hasBinocularInducedPrismErrors(errors: BinocularInducedPrismValidationErrors): boolean {
  return hasEyeErrors(errors.od) || hasEyeErrors(errors.os);
}

function toDecentration(eye: EyeInducedPrismInput): Decentration {
  const horizontal = deriveHorizontalDecentration(eye.horizontalPosition);
  return {
    horizontalMm: horizontal.mm,
    horizontalDirection: horizontal.direction,
    verticalMm: eye.vertical.mm,
    verticalDirection: eye.vertical.direction,
  };
}

/**
 * Assumes valid input — call validateBinocularInducedPrismInput first. OD and OS are computed
 * independently from their own Rx (they may have different power); this is never a single-lens
 * calculation forced onto two eyes.
 */
export function calculateBinocularInducedPrism(input: BinocularInducedPrismInput): BinocularInducedPrismResult {
  const od = calculateInducedPrism(input.od.rx, toDecentration(input.od));
  const os = calculateInducedPrism(input.os.rx, toDecentration(input.os));
  return {
    od,
    os,
    combinedHorizontal: combine(od.horizontal, os.horizontal),
    combinedVertical: combine(od.vertical, os.vertical),
  };
}

// --- Mode 2: Required Decentration (binocular) -------------------------------

export interface PrismSplit {
  /** OD's share of the total, 0–1. OS receives the remainder (1 − odFraction). 0.5 = equal split (the default). */
  odFraction: number;
}

export type BinocularRequiredDecentrationAllocation =
  | { mode: 'perEye'; od: TargetPrism; os: TargetPrism }
  | { mode: 'total'; total: TargetPrism; horizontalSplit?: PrismSplit; verticalSplit?: PrismSplit };

export interface EyeRequiredDecentrationInput {
  rx: Prescription;
  /** Patient's monocular PD from the facial midline, mm. Optional — only needed to report an ordering PD. */
  patientPdMm?: number;
}

export interface BinocularRequiredDecentrationInput {
  od: EyeRequiredDecentrationInput;
  os: EyeRequiredDecentrationInput;
  allocation: BinocularRequiredDecentrationAllocation;
}

export interface EyeRequiredDecentrationResult {
  /** The prism this specific eye was allocated (either entered directly, or this eye's share of a total). */
  allocatedTarget: TargetPrism;
  /** Meridional power (fxx, fyy) actually used to solve this eye's decentration — surfaced so the clinician can see why, e.g., a near-plano meridian needs a large shift. */
  relevantPower: { horizontal: number; vertical: number };
  outcome: RequiredDecentrationResult;
  /** Patient PD ± the required shift — where the OC should actually be ground/ordered. Present only when patientPdMm was supplied and the horizontal decentration is defined. */
  orderingPdMm?: number;
  /** Present when the allocated target exceeds the practical single-lens ground-in guideline (see EXTREME_PRISM_DIOPTERS). Never a rejection — the math and the lens are still valid. */
  caution?: string;
}

export interface BinocularRequiredDecentrationResult {
  od: EyeRequiredDecentrationResult;
  os: EyeRequiredDecentrationResult;
}

export interface TargetPrismValidationErrors {
  horizontalDiopters?: string;
  verticalDiopters?: string;
}

function validateTargetPrism(target: TargetPrism): TargetPrismValidationErrors {
  const errors: TargetPrismValidationErrors = {};
  const h = validateDiopters(target.horizontalDiopters);
  if (h) errors.horizontalDiopters = h;
  const v = validateDiopters(target.verticalDiopters);
  if (v) errors.verticalDiopters = v;
  return errors;
}

function validatePatientPdMm(mm: number | undefined): string | undefined {
  if (mm === undefined) return undefined;
  if (Number.isNaN(mm)) return "Enter the patient's monocular PD.";
  if (mm < 0) return 'PD cannot be negative.';
  return undefined;
}

function validateSplitFraction(fraction: number | undefined): string | undefined {
  if (fraction === undefined) return undefined;
  if (Number.isNaN(fraction)) return 'Enter the OD share.';
  if (fraction < 0 || fraction > 1) return 'OD share must be between 0% and 100%.';
  return undefined;
}

export interface BinocularRequiredDecentrationValidationErrors {
  od: PrismRxValidationErrors & { patientPdMm?: string };
  os: PrismRxValidationErrors & { patientPdMm?: string };
  odTarget?: TargetPrismValidationErrors;
  osTarget?: TargetPrismValidationErrors;
  total?: TargetPrismValidationErrors;
  horizontalSplit?: string;
  verticalSplit?: string;
}

export function validateBinocularRequiredDecentrationInput(
  input: BinocularRequiredDecentrationInput,
): BinocularRequiredDecentrationValidationErrors {
  const errors: BinocularRequiredDecentrationValidationErrors = {
    od: { ...validateRx(input.od.rx), patientPdMm: validatePatientPdMm(input.od.patientPdMm) },
    os: { ...validateRx(input.os.rx), patientPdMm: validatePatientPdMm(input.os.patientPdMm) },
  };
  if (input.allocation.mode === 'perEye') {
    const odTarget = validateTargetPrism(input.allocation.od);
    const osTarget = validateTargetPrism(input.allocation.os);
    if (hasEyeErrors(odTarget)) errors.odTarget = odTarget;
    if (hasEyeErrors(osTarget)) errors.osTarget = osTarget;
  } else {
    const total = validateTargetPrism(input.allocation.total);
    if (hasEyeErrors(total)) errors.total = total;
    const horizontalSplitError = validateSplitFraction(input.allocation.horizontalSplit?.odFraction);
    if (horizontalSplitError) errors.horizontalSplit = horizontalSplitError;
    const verticalSplitError = validateSplitFraction(input.allocation.verticalSplit?.odFraction);
    if (verticalSplitError) errors.verticalSplit = verticalSplitError;
  }
  return errors;
}

export function hasBinocularRequiredDecentrationErrors(errors: BinocularRequiredDecentrationValidationErrors): boolean {
  return (
    hasEyeErrors(errors.od) ||
    hasEyeErrors(errors.os) ||
    (errors.odTarget ? hasEyeErrors(errors.odTarget) : false) ||
    (errors.osTarget ? hasEyeErrors(errors.osTarget) : false) ||
    (errors.total ? hasEyeErrors(errors.total) : false) ||
    Boolean(errors.horizontalSplit) ||
    Boolean(errors.verticalSplit)
  );
}

/**
 * Standard optical-dispensing guideline: beyond ~10Δ in one eye, grinding prism directly into a
 * lens becomes impractical (excess edge/center thickness, decentration approaching the blank's
 * usable diameter), and a Fresnel press-on prism — or splitting the prism across both lenses —
 * is the usual recommendation. Surfaced as a caution, never a rejection: below true singularity
 * the math and the lens are both perfectly valid.
 */
const EXTREME_PRISM_DIOPTERS = 10;

function extremeCaution(target: TargetPrism): string | undefined {
  if (target.horizontalDiopters > EXTREME_PRISM_DIOPTERS || target.verticalDiopters > EXTREME_PRISM_DIOPTERS) {
    return `This exceeds ${EXTREME_PRISM_DIOPTERS}Δ in one eye — prism this large is usually impractical to grind into a standard lens. Consider splitting the prism across both lenses, or a Fresnel press-on prism.`;
  }
  return undefined;
}

function orderingPdMm(
  patientPdMm: number | undefined,
  horizontal?: { mm: number; direction: HorizontalDecentrationDirection },
): number | undefined {
  if (patientPdMm === undefined) return undefined;
  if (!horizontal) return cleanFloat(patientPdMm);
  return cleanFloat(patientPdMm + (horizontal.direction === 'OUT' ? horizontal.mm : -horizontal.mm));
}

function allocateEyeTarget(eye: 'od' | 'os', allocation: BinocularRequiredDecentrationAllocation): TargetPrism {
  if (allocation.mode === 'perEye') return eye === 'od' ? allocation.od : allocation.os;
  const odHorizontalFraction = allocation.horizontalSplit?.odFraction ?? 0.5;
  const odVerticalFraction = allocation.verticalSplit?.odFraction ?? 0.5;
  const horizontalFraction = eye === 'od' ? odHorizontalFraction : 1 - odHorizontalFraction;
  const verticalFraction = eye === 'od' ? odVerticalFraction : 1 - odVerticalFraction;
  return {
    horizontalDiopters: cleanFloat(allocation.total.horizontalDiopters * horizontalFraction),
    horizontalBase: allocation.total.horizontalBase,
    verticalDiopters: cleanFloat(allocation.total.verticalDiopters * verticalFraction),
    verticalBase: allocation.total.verticalBase,
  };
}

function calculateEyeRequiredDecentration(input: EyeRequiredDecentrationInput, target: TargetPrism): EyeRequiredDecentrationResult {
  const { fxx, fyy } = powerMatrix(input.rx);
  const outcome = calculateRequiredDecentration(input.rx, target);
  return {
    allocatedTarget: target,
    relevantPower: { horizontal: fxx, vertical: fyy },
    outcome,
    orderingPdMm: outcome.ok ? orderingPdMm(input.patientPdMm, outcome.result.horizontal) : undefined,
    caution: extremeCaution(target),
  };
}

/**
 * Assumes valid input — call validateBinocularRequiredDecentrationInput first. The total (when
 * allocation.mode is 'total') is split into per-eye PRISM (diopters) before either eye's own
 * inverse-Prentice solve — never split into millimeters, since OD and OS can have different
 * power and would then require different decentration for an equal diopter share.
 */
export function calculateBinocularRequiredDecentration(input: BinocularRequiredDecentrationInput): BinocularRequiredDecentrationResult {
  return {
    od: calculateEyeRequiredDecentration(input.od, allocateEyeTarget('od', input.allocation)),
    os: calculateEyeRequiredDecentration(input.os, allocateEyeTarget('os', input.allocation)),
  };
}
