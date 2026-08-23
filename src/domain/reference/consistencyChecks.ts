import type { PrismMeasurement } from './prismMeasurement';

/**
 * Clinical consistency checks: catch an obvious mismatch between two
 * independently-entered findings (e.g. an alignment finding and a later
 * prism measurement) and surface it as a non-blocking warning — never
 * silently corrected, never blocking the clinician from keeping their
 * result. New checks should follow the same shape: a pure function taking
 * the relevant recorded values and returning a warning or null.
 */
export interface ConsistencyWarning {
  findingLabel: string;
  measuredLabel: string;
  message: string;
}

const EXPECTED_HORIZONTAL_BASE: Record<string, { base: 'BO' | 'BI'; label: string }> = {
  eso: { base: 'BO', label: 'Eso' },
  exo: { base: 'BI', label: 'Exo' },
};

/**
 * Eso is neutralized with base-out, exo with base-in — always. Flags the
 * measured base when it contradicts a recorded eso/exo alignment finding.
 * Both findings are entered independently by the clinician and either can
 * legitimately be unusual, so this only surfaces the mismatch — it never
 * changes either value.
 */
export function checkHorizontalDirectionConsistency(direction: string | undefined, measurement: PrismMeasurement): ConsistencyWarning | null {
  if (!direction) return null;
  const expected = EXPECTED_HORIZONTAL_BASE[direction.toLowerCase()];
  if (!expected || !measurement.horizontal) return null;
  if (measurement.horizontal.base === expected.base) return null;

  return {
    findingLabel: expected.label,
    measuredLabel: `${measurement.horizontal.amount.toFixed(2)}Δ ${measurement.horizontal.base}`,
    message: `This does not match the expected prism direction for ${expected.label === 'Eso' ? 'an' : 'a'} ${expected.label.toLowerCase()} deviation. Please recheck the alignment finding and prism measurement.`,
  };
}
