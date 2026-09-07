import type { Prescription } from '../calculators/transposition';
import type { HorizontalPrismBase, VerticalPrismBase } from '../calculators/prism';

/**
 * A clinician-entered prism finding — recorded as-measured, never computed or inferred.
 * Both components record the eye the deviation was measured over (horizontal and vertical
 * may be measured over different eyes), but that recorded eye only changes the split for
 * vertical (base-up/base-down is meaningful per eye) — see splitPrismEqually, which still
 * divides horizontal evenly with the same base in both eyes regardless of which eye it was
 * measured over, since a horizontal deviation is a whole-eye-pair finding.
 */
export interface PrismMeasurement {
  horizontal?: { amount: number; base: HorizontalPrismBase; eye: 'OD' | 'OS' };
  vertical?: { amount: number; base: VerticalPrismBase; eye: 'OD' | 'OS' };
}

export function isMeasurementEmpty(measurement: PrismMeasurement): boolean {
  return !measurement.horizontal && !measurement.vertical;
}

/** e.g. "6.00Δ BO OD" or "6.00Δ BO OD / 2.00Δ BU OS". */
export function formatPrismMeasurement(measurement: PrismMeasurement): string {
  const parts: string[] = [];
  if (measurement.horizontal) parts.push(`${measurement.horizontal.amount.toFixed(2)}Δ ${measurement.horizontal.base} ${measurement.horizontal.eye}`);
  if (measurement.vertical) parts.push(`${measurement.vertical.amount.toFixed(2)}Δ ${measurement.vertical.base} ${measurement.vertical.eye}`);
  return parts.join(' / ');
}

/** The patient's best refractive correction, entered before a prism trial so the Final Rx can show it alongside the prism. */
export interface BestCorrection {
  od: Prescription;
  os: Prescription;
}

export interface EyePrismSplit {
  horizontal?: { amount: number; base: HorizontalPrismBase };
  vertical?: { amount: number; base: VerticalPrismBase };
}

export interface PrismDistribution {
  od: EyePrismSplit;
  os: EyePrismSplit;
}

const OPPOSITE_VERTICAL_BASE: Record<VerticalPrismBase, VerticalPrismBase> = { BU: 'BD', BD: 'BU' };

/**
 * Equal/balanced split of a measured deviation between the two eyes — mechanical arithmetic
 * on an amount the clinician already measured and trialled, not a clinical recommendation
 * (matches Prism Prescribing Guidance's own "equal/balanced split" framing). Horizontal
 * splits evenly with the same base in both eyes; vertical splits evenly with opposite
 * bases — the eye the deviation was measured over keeps its base, the fellow eye takes the
 * opposite (e.g. 6Δ BU OS -> 3Δ BD OD + 3Δ BU OS).
 */
export function splitPrismEqually(measurement: PrismMeasurement): PrismDistribution {
  const od: EyePrismSplit = {};
  const os: EyePrismSplit = {};

  if (measurement.horizontal) {
    const half = measurement.horizontal.amount / 2;
    od.horizontal = { amount: half, base: measurement.horizontal.base };
    os.horizontal = { amount: half, base: measurement.horizontal.base };
  }

  if (measurement.vertical) {
    const half = measurement.vertical.amount / 2;
    const measuredEyeSplit = { amount: half, base: measurement.vertical.base };
    const fellowEyeSplit = { amount: half, base: OPPOSITE_VERTICAL_BASE[measurement.vertical.base] };
    if (measurement.vertical.eye === 'OD') {
      od.vertical = measuredEyeSplit;
      os.vertical = fellowEyeSplit;
    } else {
      os.vertical = measuredEyeSplit;
      od.vertical = fellowEyeSplit;
    }
  }

  return { od, os };
}
