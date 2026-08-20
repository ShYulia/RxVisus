import type { Prescription } from '../../domain/calculators/transposition';

/** Formats a diopter value with an explicit sign and 2 decimal places, e.g. "+1.50", "-0.75". */
export function formatDiopter(value: number): string {
  const clean = Object.is(value, -0) ? 0 : value;
  const sign = clean < 0 ? '' : '+';
  return `${sign}${clean.toFixed(2)}`;
}

/** Formats a prescription in standard clinical notation, e.g. "-4.72 / -1.74 x 083". */
export function formatRx(rx: Prescription): string {
  const axis = String(rx.axis).padStart(3, '0');
  return `${formatDiopter(rx.sphere)} / ${formatDiopter(rx.cylinder)} x ${axis}`;
}
