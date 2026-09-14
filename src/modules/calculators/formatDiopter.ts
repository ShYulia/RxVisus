import type { Prescription } from '../../domain/calculators/transposition';
import type { ToricAvailabilityMapping } from '../../domain/calculators/toricAvailability';

/** Formats a diopter value with an explicit sign and 2 decimal places, e.g. "+1.50", "-0.75". */
export function formatDiopter(value: number): string {
  const clean = Object.is(value, -0) ? 0 : value;
  const sign = clean < 0 ? '' : '+';
  return `${sign}${clean.toFixed(2)}`;
}

/** Parses a SPH field's raw text, accepting the clinical plano abbreviation "Pln" (any case) as 0. */
export function parseSphereInput(raw: string): number {
  return raw.trim().toLowerCase() === 'pln' ? 0 : parseFloat(raw);
}

/** Formats a sphere value, showing "Pln" instead of "+0.00" for a zero sphere. */
export function formatSphere(value: number): string {
  const clean = Object.is(value, -0) ? 0 : value;
  return clean === 0 ? 'Pln' : formatDiopter(clean);
}

/**
 * Formats a prescription in standard clinical notation, e.g. "-4.72 / -1.74 x 83". A
 * spherical-only Rx (cylinder = 0) is written as just the sphere — "Pln" or "-4.00" — with
 * no "/ +0.00 x ..." tail, matching how a spherical Rx is actually written; axis is
 * clinically meaningless without a cylinder to apply it to.
 */
export function formatRx(rx: Prescription): string {
  if (rx.cylinder === 0) return formatSphere(rx.sphere);
  return `${formatSphere(rx.sphere)} / ${formatDiopter(rx.cylinder)} x ${rx.axis}`;
}

/**
 * Matches a full Rx: "<sphere> / <cylinder> x <axis>" (formatRx's own grammar) or the
 * equivalent space-separated shorthand "<sphere> <cylinder> x <axis>" (e.g. as commonly
 * copied from an EHR/optical form, or typed by hand) — sphere as "Pln" or a signed decimal,
 * cylinder a signed decimal, axis a 1-3 digit integer. The sphere/cylinder separator is
 * either "/" or required whitespace (never nothing — "-2.00-1.25" has no separator at all
 * and is deliberately not matched, since that adjacency is a typo shape, not a real one).
 * "x" or "×" both accepted as the multiplication sign before axis, and — unlike the
 * sphere/cylinder separator — this one is never optional: it's the one unambiguous marker
 * that distinguishes "this is a full Rx" from "this is two unrelated numbers"; see
 * parseFullRxText's doc comment for why that distinction matters.
 */
const FULL_RX_PATTERN =
  /^\s*(pln|[+-]?\d+(?:\.\d+)?)(?:\s*\/\s*|\s+)([+-]?\d+(?:\.\d+)?)\s*[x×]\s*(\d{1,3})\s*$/i;

/**
 * Parses text describing a full Rx — RxKit's own Copy Result grammar (formatRx's output) or
 * the equivalent space-separated shorthand, see FULL_RX_PATTERN — back into a Prescription.
 * This is the paste-side counterpart used to auto-populate a whole SPH/CYL/AXIS row from one
 * pasted Rx string. Returns null for anything that isn't a confident, unambiguous match,
 * rather than guessing:
 *  - A bare sphere value or "Pln" alone (formatRx's own spherical-only output) is
 *    intentionally rejected here — it's structurally identical to an ordinary single-value
 *    paste (e.g. pasting a plain number into just the SPH field), so treating it as
 *    "populate the whole row" would silently override CYL/AXIS on what the user meant as a
 *    normal single-field paste. Only the structurally unambiguous "sphere, cylinder, x axis"
 *    shape (the "x"/"×" marker before axis is mandatory — see FULL_RX_PATTERN) triggers
 *    row-wide population; three bare numbers with no "x"/"×" marker (e.g. "-2.00 -1.25 90")
 *    are equally rejected, since without that marker there's no way to confidently tell an
 *    Rx apart from three unrelated numbers.
 *  - A cylinder of 0 never appears in real formatRx output (cylinder = 0 always collapses to
 *    the bare-sphere form), so a pasted "... / 0.00 x ..." is non-canonical and rejected.
 *  - Axis must be a whole number in 1-180; anything else (out of range, non-integer, missing)
 *    is rejected rather than clamped or defaulted.
 */
export function parseFullRxText(raw: string): Prescription | null {
  const match = FULL_RX_PATTERN.exec(raw);
  if (!match) return null;

  const [, sphereText, cylinderText, axisText] = match;
  const sphere = sphereText.toLowerCase() === 'pln' ? 0 : parseFloat(sphereText);
  const cylinder = parseFloat(cylinderText);
  const axis = parseInt(axisText, 10);

  if (!Number.isFinite(sphere) || !Number.isFinite(cylinder) || cylinder === 0) return null;
  if (!Number.isInteger(axis) || axis < 1 || axis > 180) return null;

  return { sphere, cylinder, axis };
}

/**
 * Formats a stock-availability mapping as shown under "Nearest Common Stock Parameters" —
 * used by Vertex Distance's Copy Stock Parameters button, which copies this rather than the
 * exact mathematical vertex-corrected result (that stays visible on screen via
 * CalculatorResult, unchanged). Matches formatRx's grammar whenever there's a single
 * unambiguous set of parameters (spherical, or one nearest cylinder), so it round-trips
 * through parseFullRxText like any other Copy Result output. The rare exact-tie case (two
 * equally-close cylinders) has no single set of parameters, so both options are spelled out
 * explicitly rather than picking one.
 */
export function formatStockParameters(availability: ToricAvailabilityMapping): string {
  if (availability.cylinderCandidatesD.length === 0) return formatSphere(availability.sphere);
  if (availability.cylinderCandidatesD.length === 1) {
    return `${formatSphere(availability.sphere)} / ${formatDiopter(availability.cylinderCandidatesD[0])} x ${availability.axis}`;
  }
  const cylinderOptions = availability.cylinderCandidatesD.map((c) => formatDiopter(c)).join(' or ');
  return `${formatSphere(availability.sphere)} / ${cylinderOptions} x ${availability.axis}`;
}
