import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData } from './binocularFindings';
import { evaluateDistanceSheard, evaluateNearSheard } from './binocularSheard';

/**
 * A single guided next-step recommendation: which optional-menu step to jump to (see
 * clinicalPathways.ts's 'optional-menu' options — stepId must match one of those exactly) and
 * one short, plain-language reason a clinician who doesn't remember which targeted test to
 * reach for can act on directly.
 */
export interface GuidedRecommendation {
  stepId: string;
  label: string;
  reason: string;
}

/**
 * Turns the findings already entered into a short list of "this specific targeted test would
 * meaningfully add information, here's why" recommendations — the clinician should never have
 * to remember on their own whether Gradient AC/A, NRA/PRA, MEM/Nott, Vergence Facility,
 * Distance Fusional Vergence, or Stereoacuity is the right next step. An empty result means no
 * additional targeted testing is indicated by these findings — never recommend a test just
 * because it exists. Skips any test whose data is already recorded (nothing to gain by
 * re-suggesting it). Deterministic and transparent: every recommendation traces back to
 * specific recorded findings, never an inferred severity beyond what was actually measured.
 */
export function getGuidedNextSteps(data: ParsedBinocularData): GuidedRecommendation[] {
  const recs: GuidedRecommendation[] = [];
  const distance = data.distancePhoria;
  const near = data.nearPhoria;
  const symptomatic = data.symptoms.size > 0 && !data.symptoms.has('none');
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);
  const npcReceded = data.npcBreakCm !== undefined && data.npcBreakCm > BINOCULAR_NORMS.npcBreakNotableCm;
  const accommodativeDifficultyNoted = (data.maf?.difficulty && data.maf.difficulty !== 'neither') || (data.baf?.difficulty && data.baf.difficulty !== 'neither');
  const coreFindingsExplainSymptoms = nearSheard.pass === false || distanceSheard.pass === false || npcReceded || !!accommodativeDifficultyNoted;

  // Large/clinically relevant distance-near phoria difference -> Gradient AC/A can
  // characterize how much of it is accommodatively driven.
  if (distance && near && data.acaGradient === undefined) {
    const directionMismatch = distance.type !== 'ortho' && near.type !== 'ortho' && distance.type !== near.type;
    const magnitudeGap =
      distance.type !== 'ortho' &&
      near.type !== 'ortho' &&
      distance.type === near.type &&
      Math.abs((near.amount ?? 0) - (distance.amount ?? 0)) > BINOCULAR_NORMS.phoriaSimilarMarginDelta;
    if (directionMismatch || magnitudeGap) {
      recs.push({
        stepId: 'aca-gradient',
        label: 'Gradient AC/A',
        reason: 'Distance and near phoria differ enough to help characterize the accommodative contribution to the deviation.',
      });
    }
  }

  // Suspected accommodative dysfunction (MAF/BAF difficulty already noted) not yet
  // cross-checked with an objective/binocular-range accommodative measure.
  if (accommodativeDifficultyNoted) {
    if (data.nra === undefined && data.pra === undefined) {
      recs.push({
        stepId: 'nra-pra',
        label: 'NRA / PRA',
        reason: 'Accommodative difficulty was noted on facility testing — NRA/PRA characterizes the binocular accommodative response range.',
      });
    }
    if (!data.memNott) {
      recs.push({
        stepId: 'mem-nott',
        label: 'MEM / Nott Retinoscopy',
        reason: 'Accommodative difficulty was noted on facility testing — an objective lag/lead estimate can corroborate it.',
      });
    }
  }

  // Symptomatic despite relatively acceptable static vergence findings -> facility (speed)
  // testing may reveal what static ranges alone did not.
  if (symptomatic && !coreFindingsExplainSymptoms && data.vergenceFacilityCpm === undefined && !data.vergenceFacilityUnavailable) {
    recs.push({
      stepId: 'vergence-facility-gate',
      label: 'Vergence Facility',
      reason: 'Symptoms are present but not clearly explained by the static findings so far — facility testing may reveal a speed-based problem.',
    });
  }

  // Predominantly distance-related vergence findings (the distance finding is the larger one,
  // not just "different from near") -> distance fusional vergence ranges haven't been
  // characterized yet. Near-predominant pictures (e.g. a CI-type near > distance gap) should
  // NOT trigger this — that's what Gradient AC/A / the near-vergence workup already covers.
  const distanceRelated =
    !!distance &&
    distance.type !== 'ortho' &&
    ((near && near.type === 'ortho') ||
      (near && distance.type === near.type && (distance.amount ?? 0) > (near.amount ?? 0) + BINOCULAR_NORMS.phoriaSimilarMarginDelta));
  if (distanceRelated && !data.distanceVergence) {
    recs.push({
      stepId: 'distance-vergence',
      label: 'Distance Fusional Vergence',
      reason: 'The deviation is predominantly at distance — distance vergence ranges would characterize the compensating reserve there.',
    });
  }

  // Sensory binocular function not yet characterized, and there's a motor finding or
  // symptoms worth correlating it against.
  const hasMotorFinding = (!!distance && distance.type !== 'ortho') || (!!near && near.type !== 'ortho');
  if (!data.stereoacuity && (symptomatic || hasMotorFinding)) {
    recs.push({
      stepId: 'stereoacuity',
      label: 'Stereoacuity',
      reason: 'Characterizing sensory binocular status alongside the motor findings helps confirm the overall picture.',
    });
  }

  return recs;
}
