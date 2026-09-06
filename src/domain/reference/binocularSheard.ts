import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData, Phoria, VergencePair } from './binocularFindings';

/**
 * Sheard's criterion: the compensating fusional reserve (opposite the phoria)
 * should be at least BINOCULAR_NORMS.sheardMultiplier x the phoria. Method is
 * explicit and centralized here (not scattered/assumed elsewhere): use the
 * blur point when recorded (it's reached before break, so it's the more
 * conservative/standard reading); fall back to break only when blur wasn't
 * recorded. PASS/FAIL is a finding only — this module never computes or
 * suggests a prism amount.
 *
 * Source: Sheard C. "Zones of Ocular Comfort." American Journal of Optometry.
 * 1930;7:9–25 (original formulation). Modern treatment: Scheiman M, Wick B.
 * Clinical Management of Binocular Vision: Heterophoric, Accommodative, and
 * Eye Movement Disorders. Lippincott Williams & Wilkins (current edition).
 * See also the "Source" section on the Sheard's Criterion card in
 * clinicalTests.ts.
 */
export interface SheardResult {
  applicable: boolean;
  compensatingDirection?: 'bi' | 'bo';
  phoriaAmount?: number;
  reserveUsed?: number;
  reserveSource?: 'blur' | 'break';
  pass?: boolean;
}

const NOT_APPLICABLE: SheardResult = { applicable: false };

export function evaluateSheardFor(phoria: Phoria | undefined, vergence: VergencePair | undefined): SheardResult {
  if (!phoria || phoria.type === 'ortho' || phoria.amount === undefined) return NOT_APPLICABLE;
  const direction = phoria.type === 'exo' ? 'bo' : 'bi';
  const finding = vergence?.[direction];
  if (!finding) return NOT_APPLICABLE;
  const reserveSource: 'blur' | 'break' | undefined = finding.blur !== undefined ? 'blur' : finding.break !== undefined ? 'break' : undefined;
  if (!reserveSource) return NOT_APPLICABLE;
  const reserveUsed = finding[reserveSource]!;
  return {
    applicable: true,
    compensatingDirection: direction,
    phoriaAmount: phoria.amount,
    reserveUsed,
    reserveSource,
    pass: reserveUsed >= BINOCULAR_NORMS.sheardMultiplier * phoria.amount,
  };
}

export function evaluateNearSheard(data: ParsedBinocularData): SheardResult {
  return evaluateSheardFor(data.nearPhoria, data.nearVergence);
}

export function evaluateDistanceSheard(data: ParsedBinocularData): SheardResult {
  return evaluateSheardFor(data.distancePhoria, data.distanceVergence);
}
