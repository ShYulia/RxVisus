import type { Prescription } from './transposition';

/**
 * Below this, a computed prism/decentration component is reported as absent, not "0.00" —
 * set well above float noise, not just above zero.
 */
const ZERO_EPSILON = 1e-4;

/**
 * Below this, a meridional power is treated as plano for the purpose of inverse-Prentice
 * (Δ / F): solving for the decentration that would produce a nonzero prism through a
 * zero-power meridian is mathematically undefined (infinite decentration), not a clinical
 * caution.
 */
const SINGULARITY_EPSILON = 1e-6;

export type HorizontalDecentrationDirection = 'IN' | 'OUT';
export type VerticalDecentrationDirection = 'UP' | 'DOWN';
export type HorizontalPrismBase = 'BI' | 'BO';
export type VerticalPrismBase = 'BU' | 'BD';

export interface PrismRxValidationErrors {
  sphere?: string;
  cylinder?: string;
  axis?: string;
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

function validateDiopters(value: number): string | undefined {
  if (Number.isNaN(value)) return 'Enter a prism amount.';
  if (value < 0) return 'Prism cannot be negative — use the base direction toggle instead.';
  return undefined;
}

function validatePatientPdMm(mm: number | undefined): string | undefined {
  if (mm === undefined) return undefined;
  if (Number.isNaN(mm)) return "Enter the patient's monocular PD.";
  if (mm < 0) return 'PD cannot be negative.';
  return undefined;
}

/** Fixes float noise without imposing a clinical rounding rule. */
function cleanFloat(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function hasErrors<T extends object>(errors: T): boolean {
  return Object.values(errors).some((v) => v !== undefined && v !== null);
}

// ---------------------------------------------------------------------------
// Meridional power — the sphero-cylinder sine-squared formula, evaluated only
// at the two meridians this calculator ever needs: 180° (horizontal) and 90°
// (vertical). Fθ = S + C·sin²(θ − axis). This is the standard formula for
// finding lens power in an oblique meridian (e.g. American Board of
// Opticianry / NAO "Prentice's Rule and Finding the Power of a Lens in Any
// Meridian"; the sine-squared law is also the textbook basis for meridional
// refraction/Conoid of Sturm treatments of sphero-cylindrical power).
// Horizontal and vertical decentration/prism are always solved independently
// through their own meridian's scalar power — never through a coupled 2x2
// power matrix. A dispensing optician's Prentice's Rule table works the same
// way: F180 for horizontal, F90 for vertical, full stop. An oblique-axis
// lens's true peripheral (off-meridian) prismatic behavior is a distinct,
// more advanced topic (the astigmatic power matrix) that this calculator
// deliberately does not model, matching the standard-of-practice, purely
// meridional way both tasks (induced prism, required decentration) are
// actually taught and worked in dispensing/optometry.
// ---------------------------------------------------------------------------

function meridionalPower(rx: Prescription, thetaDeg: 90 | 180): number {
  if (rx.cylinder === 0) return rx.sphere;
  const diffRad = ((thetaDeg - rx.axis) * Math.PI) / 180;
  return cleanFloat(rx.sphere + rx.cylinder * Math.sin(diffRad) ** 2);
}

/** Lens power in the horizontal (180°) meridian — the power that governs horizontal Prentice's Rule. */
export function horizontalMeridionalPower(rx: Prescription): number {
  return meridionalPower(rx, 180);
}

/** Lens power in the vertical (90°) meridian — the power that governs vertical Prentice's Rule. */
export function verticalMeridionalPower(rx: Prescription): number {
  return meridionalPower(rx, 90);
}

// ---------------------------------------------------------------------------
// Mode 1 — Induced Prism (horizontal only)
//
// "The patient's PD and the manufactured optical-center position differ.
// What horizontal prism is induced?" This is a purely horizontal dispensing
// question: only the patient's monocular PD and the lab's manufactured
// monocular OC position are involved, and only F180 (the horizontal
// meridian) matters. There is no vertical input here — a required vertical
// field would force a clinician who has no measured vertical OC error to
// enter an arbitrary number, which would then get treated as real optics.
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
export function deriveHorizontalDecentration(position: MonocularPosition): { mm: number; direction: HorizontalDecentrationDirection } {
  const signed = cleanFloat(position.ocDistanceMm - position.patientPdMm);
  return { mm: Math.abs(signed), direction: signed >= 0 ? 'OUT' : 'IN' };
}

export interface EyeHorizontalInducedPrismResult {
  /** OC decentration relative to the patient's visual axis, derived from patientPdMm vs ocDistanceMm. */
  decentration: { mm: number; direction: HorizontalDecentrationDirection };
  /** The horizontal (180°) meridional power actually used — surfaced so a near-plano horizontal meridian visibly explains a near-zero result despite a real physical PD/OC mismatch. */
  f180: number;
  /** Omitted when there's no measurable horizontal prism (within ZERO_EPSILON). */
  prism?: { diopters: number; base: HorizontalPrismBase };
}

/**
 * Scalar Prentice's Rule (Δ = c(cm) × F180), horizontal only.
 *
 * Sign convention: OUT is positive decentration. Verified against authoritative dispensing
 * teaching (e.g. opticaltraining.com "Mastering Prentice's Rule"; the standard "MOBI" mnemonic):
 * a MINUS lens decentered OUT (wider PD than patient) induces BASE IN; a PLUS lens decentered
 * OUT induces BASE OUT. Equivalently: base direction matches the decentration direction for a
 * plus lens, and is opposite the decentration direction for a minus lens. That single sign rule
 * (positive signed prism → BO, negative → BI) reproduces both cases without a special-cased
 * plus/minus branch.
 */
export function calculateHorizontalInducedPrism(rx: Prescription, position: MonocularPosition): EyeHorizontalInducedPrismResult {
  const decentration = deriveHorizontalDecentration(position);
  const cCm = (decentration.mm / 10) * (decentration.direction === 'OUT' ? 1 : -1);
  const f180 = horizontalMeridionalPower(rx);
  const deltaSigned = cleanFloat(cCm * f180);

  const result: EyeHorizontalInducedPrismResult = { decentration, f180 };
  if (Math.abs(deltaSigned) >= ZERO_EPSILON) {
    result.prism = { diopters: Math.abs(deltaSigned), base: deltaSigned > 0 ? 'BO' : 'BI' };
  }
  return result;
}

export interface EyeInducedPrismValidationErrors extends PrismRxValidationErrors {
  patientPdMm?: string;
  ocDistanceMm?: string;
}

function validateMonocularPosition(position: MonocularPosition): Pick<EyeInducedPrismValidationErrors, 'patientPdMm' | 'ocDistanceMm'> {
  const errors: Pick<EyeInducedPrismValidationErrors, 'patientPdMm' | 'ocDistanceMm'> = {};
  if (Number.isNaN(position.patientPdMm)) errors.patientPdMm = "Enter the patient's monocular PD.";
  else if (position.patientPdMm < 0) errors.patientPdMm = 'PD cannot be negative.';
  if (Number.isNaN(position.ocDistanceMm)) errors.ocDistanceMm = 'Enter the manufactured optical center position.';
  else if (position.ocDistanceMm < 0) errors.ocDistanceMm = 'Distance cannot be negative.';
  return errors;
}

export interface EyeInducedPrismInput {
  rx: Prescription;
  position: MonocularPosition;
}

function validateEyeInducedPrismInput(input: EyeInducedPrismInput): EyeInducedPrismValidationErrors {
  return { ...validateRx(input.rx), ...validateMonocularPosition(input.position) };
}

export interface BinocularInducedPrismInput {
  od: EyeInducedPrismInput;
  os: EyeInducedPrismInput;
}

export interface BinocularInducedPrismValidationErrors {
  od: EyeInducedPrismValidationErrors;
  os: EyeInducedPrismValidationErrors;
}

export function validateBinocularInducedPrismInput(input: BinocularInducedPrismInput): BinocularInducedPrismValidationErrors {
  return { od: validateEyeInducedPrismInput(input.od), os: validateEyeInducedPrismInput(input.os) };
}

export function hasBinocularInducedPrismErrors(errors: BinocularInducedPrismValidationErrors): boolean {
  return hasErrors(errors.od) || hasErrors(errors.os);
}

/**
 * OD + OS horizontal prism, present only when both eyes induce the SAME base direction. This
 * is a real, precisely-defined quantity — not a vague "combined effect" — because horizontal
 * prism in the same base direction is additive across the two lenses: it is exactly the total
 * that a symmetric "Xul BI OU" prescription describes when split 50/50 between the lenses (the
 * inverse of Mode 2's "Total, split OU" allocation). When OD and OS induce opposite bases there
 * is no single meaningful total, so none is manufactured — the caller must show both eyes
 * separately.
 */
function combineHorizontal(
  a?: { diopters: number; base: HorizontalPrismBase },
  b?: { diopters: number; base: HorizontalPrismBase },
): { diopters: number; base: HorizontalPrismBase } | undefined {
  if (a && b) return a.base === b.base ? { diopters: cleanFloat(a.diopters + b.diopters), base: a.base } : undefined;
  return a ?? b;
}

export interface BinocularInducedPrismResult {
  od: EyeHorizontalInducedPrismResult;
  os: EyeHorizontalInducedPrismResult;
  /** Total horizontal prism across both lenses — see combineHorizontal(). Undefined when OD and OS induce opposing bases (no single total applies) or neither eye has a measurable component. */
  totalHorizontal?: { diopters: number; base: HorizontalPrismBase };
}

/** Assumes valid input — call validateBinocularInducedPrismInput first. OD and OS are computed independently from their own Rx (they may have different power). */
export function calculateBinocularInducedPrism(input: BinocularInducedPrismInput): BinocularInducedPrismResult {
  const od = calculateHorizontalInducedPrism(input.od.rx, input.od.position);
  const os = calculateHorizontalInducedPrism(input.os.rx, input.os.position);
  return { od, os, totalHorizontal: combineHorizontal(od.prism, os.prism) };
}

// ---------------------------------------------------------------------------
// Mode 2 — Required Decentration
//
// "I want a particular (horizontal and/or vertical) prism. How much OC
// decentration is required?" Horizontal and vertical are solved completely
// independently, each by the inverse of the same scalar Prentice's Rule
// (c = Δ/F) against that meridian's own power — never a coupled 2x2 solve.
// Horizontal prism may be prescribed as a single binocular total to be
// split between the lenses (the classic symmetric base-in/base-out
// convergence-exercise convention) or per eye directly. Vertical prism is
// always entered per eye — a "total vertical to split" is not a real
// clinical concept (vertical prism is prescribed per eye against the
// measured vertical phoria/imbalance), so that ambiguity is never offered.
// ---------------------------------------------------------------------------

export interface HorizontalPrismTarget {
  diopters: number;
  base: HorizontalPrismBase;
}

export interface VerticalPrismTarget {
  diopters: number;
  base: VerticalPrismBase;
}

export type HorizontalDecentrationResult =
  /** No horizontal target was entered at all for this eye/allocation — distinct from `'none'`, which means a target WAS entered and it resolved to (near) zero. Never rendered as "the desired prism is zero". */
  | { kind: 'not-specified' }
  | { kind: 'none' }
  | { kind: 'defined'; mm: number; direction: HorizontalDecentrationDirection }
  | { kind: 'singularity' };

export type VerticalDecentrationResult =
  /** Same as HorizontalDecentrationResult's 'not-specified' — nothing was entered, not a computed zero. */
  | { kind: 'not-specified' }
  | { kind: 'none' }
  | { kind: 'defined'; mm: number; direction: VerticalDecentrationDirection }
  | { kind: 'singularity' };

/**
 * Inverse of the scalar Prentice's Rule for one meridian: c(cm) = Δ/F, converted to mm.
 * `target === undefined` means the field was left blank — reported as `'not-specified'`, never
 * silently folded into `'none'` (a real, explicitly-entered zero) or treated as a computed
 * result. Singular (undefined) when F is ~plano and a nonzero prism was actually requested —
 * reaching a target through a zero-power meridian would require infinite decentration. Reported
 * as a clean "singularity", never a partial/pseudo-inverse guess.
 */
function solveHorizontalDecentration(target: HorizontalPrismTarget | undefined, f180: number): HorizontalDecentrationResult {
  if (!target) return { kind: 'not-specified' };
  if (target.diopters < ZERO_EPSILON) return { kind: 'none' };
  if (Math.abs(f180) < SINGULARITY_EPSILON) return { kind: 'singularity' };
  const deltaSigned = target.diopters * (target.base === 'BO' ? 1 : -1);
  const cCm = cleanFloat(deltaSigned / f180);
  const mm = cleanFloat(Math.abs(cCm) * 10);
  if (mm < ZERO_EPSILON) return { kind: 'none' };
  return { kind: 'defined', mm, direction: cCm > 0 ? 'OUT' : 'IN' };
}

function solveVerticalDecentration(target: VerticalPrismTarget | undefined, f90: number): VerticalDecentrationResult {
  if (!target) return { kind: 'not-specified' };
  if (target.diopters < ZERO_EPSILON) return { kind: 'none' };
  if (Math.abs(f90) < SINGULARITY_EPSILON) return { kind: 'singularity' };
  const deltaSigned = target.diopters * (target.base === 'BU' ? 1 : -1);
  const cCm = cleanFloat(deltaSigned / f90);
  const mm = cleanFloat(Math.abs(cCm) * 10);
  if (mm < ZERO_EPSILON) return { kind: 'none' };
  return { kind: 'defined', mm, direction: cCm > 0 ? 'UP' : 'DOWN' };
}

/**
 * Standard optical-dispensing guideline: beyond ~10Δ in one eye, ground-in prism starts adding
 * substantial edge/center thickness, and labs commonly prefer splitting the prism across both
 * lenses or a Fresnel press-on prism instead. This is a flag to reconsider the approach, not a
 * manufacturing limit — actual feasibility depends on the lab, the lens design/material, and the
 * blank, none of which this calculator knows. Surfaced as a caution, never a rejection: below
 * true singularity the math and the lens are both perfectly valid.
 */
const EXTREME_PRISM_DIOPTERS = 10;

function extremeCaution(horizontal?: HorizontalPrismTarget, vertical?: VerticalPrismTarget): string | undefined {
  if ((horizontal?.diopters ?? 0) > EXTREME_PRISM_DIOPTERS || (vertical?.diopters ?? 0) > EXTREME_PRISM_DIOPTERS) {
    return `High prescribed prism (>${EXTREME_PRISM_DIOPTERS}Δ). Consider laboratory feasibility, prism distribution between the lenses, or alternative prism options such as Fresnel prism where clinically appropriate.`;
  }
  return undefined;
}

function orderingPdMm(patientPdMm: number | undefined, horizontal: HorizontalDecentrationResult): number | undefined {
  if (patientPdMm === undefined) return undefined;
  if (horizontal.kind !== 'defined') return cleanFloat(patientPdMm);
  return cleanFloat(patientPdMm + (horizontal.direction === 'OUT' ? horizontal.mm : -horizontal.mm));
}

export interface EyeRequiredDecentrationInput {
  rx: Prescription;
  /** Patient's monocular PD from the facial midline, mm. Optional — only needed to report an ordering PD. */
  patientPdMm?: number;
  horizontal?: HorizontalPrismTarget;
  vertical?: VerticalPrismTarget;
}

export interface EyeRequiredDecentrationResult {
  /** Meridional power (F180, F90) actually used to solve this eye's decentration — surfaced so the clinician can see why, e.g., a near-plano meridian needs a large shift. */
  relevantPower: { f180: number; f90: number };
  /** The horizontal target this eye was allocated (entered directly, or its share of a binocular total) — echoed back so "desired" is unambiguous next to the result. */
  allocatedHorizontal?: HorizontalPrismTarget;
  horizontal: HorizontalDecentrationResult;
  vertical: VerticalDecentrationResult;
  /** Patient PD ± the required horizontal shift — where the OC should actually be ground/ordered. Present only when patientPdMm was supplied. */
  orderingPdMm?: number;
  /** Present when either target exceeds the practical single-lens ground-in guideline. Never a rejection. */
  caution?: string;
}

function calculateEyeRequiredDecentration(input: EyeRequiredDecentrationInput): EyeRequiredDecentrationResult {
  const f180 = horizontalMeridionalPower(input.rx);
  const f90 = verticalMeridionalPower(input.rx);
  const horizontal = solveHorizontalDecentration(input.horizontal, f180);
  const vertical = solveVerticalDecentration(input.vertical, f90);
  return {
    relevantPower: { f180, f90 },
    allocatedHorizontal: input.horizontal,
    horizontal,
    vertical,
    orderingPdMm: orderingPdMm(input.patientPdMm, horizontal),
    caution: extremeCaution(input.horizontal, input.vertical),
  };
}

export interface PrismSplit {
  /**
   * OD's share of the total, 0–1. OS receives the remainder (1 − odFraction). 0.5 = equal split.
   * `undefined` means "not yet specified" (only meaningful in a custom-split UI where the
   * clinician hasn't typed a share yet) — this must never be treated as 0.5 nor as 0; see
   * allocateHorizontal, which withholds an allocation entirely rather than guessing.
   */
  odFraction?: number;
}

/**
 * How the desired HORIZONTAL prism is specified. 'total' is the classic symmetric
 * base-in/base-out convention (e.g. convergence-insufficiency training prism prescribed as one
 * binocular number, split between the lenses). 'perEye' lets OD and OS be entered directly and
 * independently, including opposing bases. There is no equivalent 'total' mode for vertical —
 * see the module doc comment above. Every target here is optional: a blank field means "not
 * specified for this eye/allocation", never a fabricated 0Δ — see allocateHorizontal and
 * solveHorizontalDecentration's `'not-specified'` result kind.
 */
export type HorizontalPrismAllocation =
  | { mode: 'perEye'; od?: HorizontalPrismTarget; os?: HorizontalPrismTarget }
  | { mode: 'total'; total?: HorizontalPrismTarget; split?: PrismSplit };

export interface EyeRequiredDecentrationEntry {
  rx: Prescription;
  patientPdMm?: number;
  /** Always per-eye — see the module doc comment on why vertical prism has no 'total' allocation mode. */
  vertical?: VerticalPrismTarget;
}

export interface BinocularRequiredDecentrationInput {
  od: EyeRequiredDecentrationEntry;
  os: EyeRequiredDecentrationEntry;
  horizontal: HorizontalPrismAllocation;
}

/**
 * Allocates this eye's share of the desired horizontal prism, or `undefined` when nothing
 * should be allocated: 'perEye' simply echoes back whatever was (or wasn't) entered for this
 * eye; 'total' allocates a fraction of `total` — but only once both `total` and the split
 * fraction are actually known. A 'total' entered without a resolvable split fraction (custom
 * split selected, share left blank) deliberately returns `undefined` for BOTH eyes rather than
 * guessing 50/50 or 0/100 — validateBinocularRequiredDecentrationInput flags that state with a
 * visible "Enter the OD share." error instead.
 */
function allocateHorizontal(eye: 'od' | 'os', allocation: HorizontalPrismAllocation): HorizontalPrismTarget | undefined {
  if (allocation.mode === 'perEye') return eye === 'od' ? allocation.od : allocation.os;
  if (!allocation.total) return undefined;
  // No `split` object at all means the caller isn't offering a custom fraction — default to an
  // equal split. A `split` object that IS present but whose `odFraction` is still undefined
  // means a custom split is in play and the clinician hasn't entered a share yet — withhold the
  // allocation for both eyes rather than guessing 50/50 (or, worse, 0%/100% from `?? 0`).
  if (allocation.split && allocation.split.odFraction === undefined) return undefined;
  const odFraction = allocation.split?.odFraction ?? 0.5;
  const fraction = eye === 'od' ? odFraction : 1 - odFraction;
  return { diopters: cleanFloat(allocation.total.diopters * fraction), base: allocation.total.base };
}

/**
 * The relationship between OD's and OS's independently-entered vertical prism — computed
 * directly from what was typed for each eye, never by naively summing.
 *
 * - `imbalance` is the clinically meaningful "relative vertical prism" — the net anisophoria-
 *   causing demand between the eyes (e.g. OD 4.4Δ BU + OS 4.4Δ BU → imbalance 0Δ: fully yoked,
 *   no relative vertical prism at all; OD 4.4Δ BU + OS 4.4Δ BD → imbalance 8.8Δ: opposing
 *   bases compound).
 * - `yoked` is the shared same-direction component (present only when both eyes' prism points
 *   the same way) — it shifts both retinal images together and is not a source of vertical
 *   diplopia, so it is reported separately and is never added into `imbalance`.
 */
export interface VerticalPrismRelationship {
  imbalance?: { diopters: number; moreBuEye: 'OD' | 'OS' };
  yoked?: { diopters: number; base: VerticalPrismBase };
}

function signedVertical(target: VerticalPrismTarget | undefined): number {
  if (!target || target.diopters < ZERO_EPSILON) return 0;
  return target.diopters * (target.base === 'BU' ? 1 : -1);
}

function calculateVerticalPrismRelationship(od: VerticalPrismTarget | undefined, os: VerticalPrismTarget | undefined): VerticalPrismRelationship | undefined {
  const odSigned = signedVertical(od);
  const osSigned = signedVertical(os);
  if (Math.abs(odSigned) < ZERO_EPSILON && Math.abs(osSigned) < ZERO_EPSILON) return undefined;

  const result: VerticalPrismRelationship = {};
  const diff = cleanFloat(odSigned - osSigned);
  if (Math.abs(diff) >= ZERO_EPSILON) {
    result.imbalance = { diopters: Math.abs(diff), moreBuEye: diff > 0 ? 'OD' : 'OS' };
  }
  const sameDirection = (odSigned > 0 && osSigned > 0) || (odSigned < 0 && osSigned < 0);
  if (sameDirection) {
    const yokedDiopters = cleanFloat(Math.min(Math.abs(odSigned), Math.abs(osSigned)));
    if (yokedDiopters >= ZERO_EPSILON) {
      result.yoked = { diopters: yokedDiopters, base: odSigned > 0 ? 'BU' : 'BD' };
    }
  }
  return result;
}

export interface BinocularRequiredDecentrationResult {
  od: EyeRequiredDecentrationResult;
  os: EyeRequiredDecentrationResult;
  /** Present only when at least one eye has a nonzero vertical target — see VerticalPrismRelationship. */
  verticalRelationship?: VerticalPrismRelationship;
}

/**
 * Assumes valid input — call validateBinocularRequiredDecentrationInput first. A horizontal
 * total is split into per-eye PRISM (diopters) before either eye's own inverse-Prentice solve —
 * never split into millimeters, since OD and OS can have different power and would then require
 * different decentration for an equal diopter share.
 */
export function calculateBinocularRequiredDecentration(input: BinocularRequiredDecentrationInput): BinocularRequiredDecentrationResult {
  const odHorizontal = allocateHorizontal('od', input.horizontal);
  const osHorizontal = allocateHorizontal('os', input.horizontal);
  const od = calculateEyeRequiredDecentration({ rx: input.od.rx, patientPdMm: input.od.patientPdMm, horizontal: odHorizontal, vertical: input.od.vertical });
  const os = calculateEyeRequiredDecentration({ rx: input.os.rx, patientPdMm: input.os.patientPdMm, horizontal: osHorizontal, vertical: input.os.vertical });
  return { od, os, verticalRelationship: calculateVerticalPrismRelationship(input.od.vertical, input.os.vertical) };
}

// --- Validation ---------------------------------------------------------

export interface HorizontalPrismTargetValidationErrors {
  diopters?: string;
}

function validateHorizontalTarget(target: HorizontalPrismTarget): HorizontalPrismTargetValidationErrors {
  const diopters = validateDiopters(target.diopters);
  return diopters ? { diopters } : {};
}

function validateVerticalTarget(target: VerticalPrismTarget): HorizontalPrismTargetValidationErrors {
  const diopters = validateDiopters(target.diopters);
  return diopters ? { diopters } : {};
}

/**
 * Split is only relevant once a total was actually entered — nothing to validate for an
 * unspecified total. Once a total exists, a `split` object with no `odFraction` (custom split
 * selected, share left blank) is flagged explicitly rather than silently allocating 0%/100% —
 * see allocateHorizontal's matching guard. Omitting `split` altogether (equal split) is fine.
 */
function validateSplitFraction(totalSpecified: boolean, split: PrismSplit | undefined): string | undefined {
  if (!totalSpecified || !split) return undefined;
  const fraction = split.odFraction;
  if (fraction === undefined || Number.isNaN(fraction)) return 'Enter the OD share.';
  if (fraction < 0 || fraction > 1) return 'OD share must be between 0% and 100%.';
  return undefined;
}

export interface EyeRequiredDecentrationValidationErrors extends PrismRxValidationErrors {
  patientPdMm?: string;
  verticalDiopters?: string;
}

function validateEyeRequiredDecentrationEntry(entry: EyeRequiredDecentrationEntry): EyeRequiredDecentrationValidationErrors {
  const errors: EyeRequiredDecentrationValidationErrors = { ...validateRx(entry.rx), patientPdMm: validatePatientPdMm(entry.patientPdMm) };
  if (entry.vertical) {
    const vertical = validateVerticalTarget(entry.vertical);
    if (vertical.diopters) errors.verticalDiopters = vertical.diopters;
  }
  return errors;
}

export interface BinocularRequiredDecentrationValidationErrors {
  od: EyeRequiredDecentrationValidationErrors;
  os: EyeRequiredDecentrationValidationErrors;
  odHorizontal?: HorizontalPrismTargetValidationErrors;
  osHorizontal?: HorizontalPrismTargetValidationErrors;
  totalHorizontal?: HorizontalPrismTargetValidationErrors;
  horizontalSplit?: string;
}

export function validateBinocularRequiredDecentrationInput(input: BinocularRequiredDecentrationInput): BinocularRequiredDecentrationValidationErrors {
  const errors: BinocularRequiredDecentrationValidationErrors = {
    od: validateEyeRequiredDecentrationEntry(input.od),
    os: validateEyeRequiredDecentrationEntry(input.os),
  };
  if (input.horizontal.mode === 'perEye') {
    // A blank per-eye target is "not specified for this eye" (fine — the clinician may want
    // prism in only one eye) rather than a validation error; only a target that WAS entered
    // gets checked for validity.
    if (input.horizontal.od) {
      const odHorizontal = validateHorizontalTarget(input.horizontal.od);
      if (hasErrors(odHorizontal)) errors.odHorizontal = odHorizontal;
    }
    if (input.horizontal.os) {
      const osHorizontal = validateHorizontalTarget(input.horizontal.os);
      if (hasErrors(osHorizontal)) errors.osHorizontal = osHorizontal;
    }
  } else {
    if (input.horizontal.total) {
      const totalHorizontal = validateHorizontalTarget(input.horizontal.total);
      if (hasErrors(totalHorizontal)) errors.totalHorizontal = totalHorizontal;
    }
    const splitError = validateSplitFraction(!!input.horizontal.total, input.horizontal.split);
    if (splitError) errors.horizontalSplit = splitError;
  }
  return errors;
}

export function hasBinocularRequiredDecentrationErrors(errors: BinocularRequiredDecentrationValidationErrors): boolean {
  return (
    hasErrors(errors.od) ||
    hasErrors(errors.os) ||
    (errors.odHorizontal ? hasErrors(errors.odHorizontal) : false) ||
    (errors.osHorizontal ? hasErrors(errors.osHorizontal) : false) ||
    (errors.totalHorizontal ? hasErrors(errors.totalHorizontal) : false) ||
    Boolean(errors.horizontalSplit)
  );
}
