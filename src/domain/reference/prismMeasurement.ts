import type { HorizontalPrismBase, VerticalPrismBase } from '../calculators/prism';

/**
 * A clinician-entered prism finding — recorded as-measured, never computed or inferred.
 * Vertical prism needs an eye (OD/OS) since base-up/base-down is only meaningful per eye;
 * horizontal doesn't, since a total horizontal deviation is recorded as one amount + base
 * before any prescribing split.
 */
export interface PrismMeasurement {
  horizontal?: { amount: number; base: HorizontalPrismBase };
  vertical?: { amount: number; base: VerticalPrismBase; eye: 'OD' | 'OS' };
}

export function isMeasurementEmpty(measurement: PrismMeasurement): boolean {
  return !measurement.horizontal && !measurement.vertical;
}

/** e.g. "6.00Δ BO" or "6.00Δ BO / 2.00Δ BU OD". */
export function formatPrismMeasurement(measurement: PrismMeasurement): string {
  const parts: string[] = [];
  if (measurement.horizontal) parts.push(`${measurement.horizontal.amount.toFixed(2)}Δ ${measurement.horizontal.base}`);
  if (measurement.vertical) parts.push(`${measurement.vertical.amount.toFixed(2)}Δ ${measurement.vertical.base} ${measurement.vertical.eye}`);
  return parts.join(' / ');
}
