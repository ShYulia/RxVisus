import type { Prescription } from '../../domain/calculators/transposition';

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
