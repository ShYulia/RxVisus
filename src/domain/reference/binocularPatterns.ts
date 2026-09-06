import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData } from './binocularFindings';
import { evaluateDistanceSheard, evaluateNearSheard, type SheardResult } from './binocularSheard';

/**
 * Each pattern below is its own bespoke clinical check — a required
 * condition specific to that pattern, plus its own supporting findings.
 * There is deliberately no generic "N findings = pattern" rule and no
 * confidence tier: a pattern either meets its own defining condition (and is
 * suggested, with the specific findings that led to it shown transparently)
 * or it isn't suggested at all. RxKit is an interpretation aid for a
 * qualified optometrist — it may recognize a clinically meaningful
 * combination of findings and suggest what it resembles, but it never
 * scores, ranks, or otherwise converts that recognition into a synthesized
 * confidence level. This module never infers treatment or a prism amount.
 */
export interface PatternMatch {
  id: string;
  label: string;
  supportingFindings: string[];
}

type PatternCheck = (data: ParsedBinocularData, nearSheard: SheardResult, distanceSheard: SheardResult) => PatternMatch | null;

const checkConvergenceInsufficiency: PatternCheck = (data, nearSheard) => {
  const near = data.nearPhoria;
  if (!near || near.type !== 'exo' || near.amount === undefined) return null;
  const distanceExo = data.distancePhoria?.type === 'exo' ? (data.distancePhoria.amount ?? 0) : 0;
  if (near.amount - distanceExo <= BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const supporting = [`Near exophoria (${near.amount}Δ) greater than distance (${distanceExo}Δ)`];
  const npcReceded = data.npcBreakCm !== undefined && data.npcBreakCm > BINOCULAR_NORMS.npcBreakNotableCm;
  if (npcReceded) supporting.push(`Receded NPC (break at ${data.npcBreakCm}cm)`);
  if (nearSheard.applicable && nearSheard.compensatingDirection === 'bo' && nearSheard.pass === false) {
    supporting.push(`Near Sheard's criterion failed (BO ${nearSheard.reserveSource} ${nearSheard.reserveUsed}Δ)`);
  }
  // Suppressed if NPC is normal and near Sheard's clearly passes — the two usual corroborating findings both argue against it.
  if (!npcReceded && data.npcBreakCm !== undefined && nearSheard.applicable && nearSheard.pass === true) return null;

  return { id: 'ci', label: 'Convergence Insufficiency', supportingFindings: supporting };
};

const checkConvergenceExcess: PatternCheck = (data, nearSheard) => {
  const near = data.nearPhoria;
  if (!near || near.type !== 'eso' || near.amount === undefined) return null;
  const distanceEso = data.distancePhoria?.type === 'eso' ? (data.distancePhoria.amount ?? 0) : 0;
  if (near.amount - distanceEso <= BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const supporting = [`Near esophoria (${near.amount}Δ) greater than distance (${distanceEso}Δ)`];
  const nearSymptomatic = ['nearStrain', 'headache', 'nearBlur'].some((k) => data.symptoms.has(k));
  if (nearSymptomatic) supporting.push('Near-specific symptoms reported');
  if (nearSheard.applicable && nearSheard.compensatingDirection === 'bi' && nearSheard.pass === false) {
    supporting.push(`Near Sheard's criterion failed (BI ${nearSheard.reserveSource} ${nearSheard.reserveUsed}Δ)`);
  }
  if (data.acaGradient !== undefined && data.acaGradient > BINOCULAR_NORMS.acaHighAboveRatio) {
    supporting.push(`Elevated AC/A ratio (${data.acaGradient}Δ/D)`);
  }

  return { id: 'ce', label: 'Convergence Excess', supportingFindings: supporting };
};

const checkDivergenceInsufficiency: PatternCheck = (data, _near, distanceSheard) => {
  const distance = data.distancePhoria;
  if (!distance || distance.type !== 'eso' || distance.amount === undefined) return null;
  const nearEso = data.nearPhoria?.type === 'eso' ? (data.nearPhoria.amount ?? 0) : 0;
  if (distance.amount - nearEso <= BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const supporting = [`Distance esophoria (${distance.amount}Δ) greater than near (${nearEso}Δ)`];
  if (distanceSheard.applicable && distanceSheard.compensatingDirection === 'bi' && distanceSheard.pass === false) {
    supporting.push(`Distance Sheard's criterion failed (BI ${distanceSheard.reserveSource} ${distanceSheard.reserveUsed}Δ)`);
  }

  return { id: 'di', label: 'Divergence Insufficiency', supportingFindings: supporting };
};

const checkDivergenceExcess: PatternCheck = (data, nearSheard) => {
  const distance = data.distancePhoria;
  if (!distance || distance.type !== 'exo' || distance.amount === undefined) return null;
  const nearExo = data.nearPhoria?.type === 'exo' ? (data.nearPhoria.amount ?? 0) : 0;
  if (distance.amount - nearExo <= BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const supporting = [`Distance exophoria (${distance.amount}Δ) greater than near (${nearExo}Δ)`];
  if (data.npcBreakCm !== undefined && data.npcBreakCm <= BINOCULAR_NORMS.npcBreakNotableCm) {
    supporting.push(`Normal NPC (break at ${data.npcBreakCm}cm)`);
  }
  if (nearSheard.applicable && nearSheard.compensatingDirection === 'bo' && nearSheard.pass === true) {
    supporting.push('Good near BO reserve relative to near phoria');
  }

  return { id: 'de', label: 'Divergence Excess', supportingFindings: supporting };
};

/**
 * Basic Exo/Esophoria requires more than "distance and near roughly match, and the patient has
 * symptoms" — a small, well-compensated phoria is often physiologic/incidental. Require
 * independent evidence the phoria itself is clinically relevant: either it fails Sheard's
 * (poorly compensated) or its magnitude meets the same "notable" bar Quick Screen itself uses —
 * being symptomatic is never enough on its own to cross that line.
 */
function checkBasicPhoria(data: ParsedBinocularData, type: 'exo' | 'eso', nearSheard: SheardResult): PatternMatch | null {
  const near = data.nearPhoria;
  const distance = data.distancePhoria;
  if (!near || near.type !== type || near.amount === undefined) return null;
  if (!distance || distance.type !== type || distance.amount === undefined) return null;
  if (Math.abs(near.amount - distance.amount) > BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const sheardFailed = nearSheard.applicable && nearSheard.pass === false;
  const notableMagnitude = near.amount >= BINOCULAR_NORMS.nearPhoriaNotableDelta;
  if (!sheardFailed && !notableMagnitude) return null;

  const label = type === 'exo' ? 'Basic Exophoria' : 'Basic Esophoria';
  const supporting = [`Similar ${type}phoria at distance (${distance.amount}Δ) and near (${near.amount}Δ)`];
  if (sheardFailed) {
    supporting.push(`Near Sheard's criterion failed (${nearSheard.compensatingDirection?.toUpperCase()} ${nearSheard.reserveSource} ${nearSheard.reserveUsed}Δ)`);
  }
  if (notableMagnitude) {
    supporting.push(`Near phoria (${near.amount}Δ) meets the notable-magnitude threshold`);
  }
  if (data.symptoms.size > 0 && !data.symptoms.has('none')) {
    supporting.push('Symptomatic');
  }

  return { id: type === 'exo' ? 'basic-exo' : 'basic-eso', label, supportingFindings: supporting };
}

const checkFusionalVergenceDysfunction: PatternCheck = (data) => {
  const near = data.nearPhoria;
  const distance = data.distancePhoria;
  const nearOrtho = !near || near.type === 'ortho' || (near.amount ?? 0) <= BINOCULAR_NORMS.nearOrthoMaxDelta;
  const distanceOrtho = !distance || distance.type === 'ortho' || (distance.amount ?? 0) <= BINOCULAR_NORMS.nearOrthoMaxDelta;
  if (!near || !nearOrtho || !distanceOrtho) return null;

  const bi = data.nearVergence?.bi;
  const bo = data.nearVergence?.bo;
  const biReduced = bi?.break !== undefined && bi.break < BINOCULAR_NORMS.nearBiBreakLowDelta;
  const boReduced = bo?.break !== undefined && bo.break < BINOCULAR_NORMS.nearBoBreakLowDelta;
  // Both directions reduced is the finding that distinguishes FVD from a single-direction
  // pattern like CI/CE — see the Clinical Source citation for this pattern.
  if (!biReduced || !boReduced) return null;

  const supporting = ['Near-ortho alignment at both distance and near'];
  if (biReduced) supporting.push(`Reduced near BI break (${bi!.break}Δ)`);
  if (boReduced) supporting.push(`Reduced near BO break (${bo!.break}Δ)`);

  return { id: 'fvd', label: 'Fusional Vergence Dysfunction', supportingFindings: supporting };
};

function checkAccommodativeInsufficiency(data: ParsedBinocularData): PatternMatch | null {
  if (data.age === undefined) return null;
  const minExpected = BINOCULAR_NORMS.hofstetterMinimumAA(data.age);
  const odLow = data.aaOD !== undefined && data.aaOD < minExpected;
  const osLow = data.aaOS !== undefined && data.aaOS < minExpected;
  if (!odLow && !osLow) return null;

  const mafCorroborates = data.maf?.difficulty === 'minus' || data.maf?.difficulty === 'both';
  const bafCorroborates = data.baf?.difficulty === 'minus' || data.baf?.difficulty === 'both';
  // A reduced amplitude alone is one abnormal sign; a second, independent sign is required
  // before suggesting the pattern — see the Clinical Source citation for this pattern.
  if (!mafCorroborates && !bafCorroborates) return null;

  const supporting: string[] = [];
  if (odLow) supporting.push(`AA OD ${data.aaOD}D below age-expected minimum (~${minExpected.toFixed(1)}D)`);
  if (osLow) supporting.push(`AA OS ${data.aaOS}D below age-expected minimum (~${minExpected.toFixed(1)}D)`);
  if (mafCorroborates) supporting.push('Difficulty clearing −2.00 D on MAF');
  if (bafCorroborates) supporting.push('Difficulty clearing −2.00 D on BAF');

  return { id: 'ai', label: 'Accommodative Insufficiency', supportingFindings: supporting };
}

function checkAccommodativeExcess(data: ParsedBinocularData): PatternMatch | null {
  const mafPlus = data.maf?.difficulty === 'plus' || data.maf?.difficulty === 'both';
  const bafPlus = data.baf?.difficulty === 'plus' || data.baf?.difficulty === 'both';
  // Both MAF and BAF showing plus-side difficulty is the best-supported description found —
  // see the Clinical Source citation for this pattern (RxKit's own conservative reading).
  if (!mafPlus || !bafPlus) return null;

  const supporting: string[] = [];
  if (mafPlus) supporting.push('Difficulty clearing +2.00 D on MAF');
  if (bafPlus) supporting.push('Difficulty clearing +2.00 D on BAF');
  if (data.symptoms.has('nearBlur') || data.symptoms.has('headache')) supporting.push('Near blur/headache symptoms reported');

  return { id: 'ae', label: 'Accommodative Excess', supportingFindings: supporting };
}

function checkAccommodativeInfacility(data: ParsedBinocularData): PatternMatch | null {
  const mafBoth = data.maf?.difficulty === 'both';
  const bafBoth = data.baf?.difficulty === 'both';
  // Both MAF and BAF showing both-direction difficulty is the best-supported description found —
  // see the Clinical Source citation for this pattern (RxKit's own conservative reading).
  if (!mafBoth || !bafBoth) return null;

  const supporting: string[] = [];
  if (mafBoth) supporting.push('MAF difficulty clearing both +2.00 and −2.00');
  if (bafBoth) supporting.push('BAF difficulty clearing both +2.00 and −2.00');
  if (data.symptoms.has('slowRefocusNearToDistance') || data.symptoms.has('slowRefocusDistanceToNear')) supporting.push('Slow refocusing reported');
  if (data.maf?.od !== undefined && data.maf.od < BINOCULAR_NORMS.mafNotableBelowCpm) supporting.push(`Reduced MAF OD (${data.maf.od} cycles/min)`);
  if (data.maf?.os !== undefined && data.maf.os < BINOCULAR_NORMS.mafNotableBelowCpm) supporting.push(`Reduced MAF OS (${data.maf.os} cycles/min)`);

  return { id: 'ainfac', label: 'Accommodative Infacility', supportingFindings: supporting };
}

const VERGENCE_CHECKS: PatternCheck[] = [
  checkConvergenceInsufficiency,
  checkConvergenceExcess,
  checkDivergenceInsufficiency,
  checkDivergenceExcess,
  (data, nearSheard) => checkBasicPhoria(data, 'exo', nearSheard),
  (data, nearSheard) => checkBasicPhoria(data, 'eso', nearSheard),
  checkFusionalVergenceDysfunction,
];

const ACCOMMODATIVE_CHECKS: ((data: ParsedBinocularData) => PatternMatch | null)[] = [
  checkAccommodativeInsufficiency,
  checkAccommodativeExcess,
  checkAccommodativeInfacility,
];

/** True once enough core data exists to be worth evaluating at all — distinct from "nothing was suggested." */
export function hasCoreBinocularData(data: ParsedBinocularData): boolean {
  return !!data.distancePhoria || !!data.nearPhoria || data.npcBreakCm !== undefined;
}

/**
 * Runs every pattern's own independent check and returns every one whose
 * defining condition was met, in a fixed display order — vergence patterns
 * first, then accommodative. There is no arbitration between them: more
 * than one pattern can and does appear at once, and none is picked as
 * "primary" over another. Each returned match carries exactly the findings
 * that led to it, for the clinician to weigh — this function suggests, it
 * never diagnoses or scores.
 */
export function evaluateBinocularPatterns(data: ParsedBinocularData): PatternMatch[] {
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);

  const vergenceMatches = VERGENCE_CHECKS.map((check) => check(data, nearSheard, distanceSheard)).filter((m): m is PatternMatch => m !== null);
  const accommodativeMatches = ACCOMMODATIVE_CHECKS.map((check) => check(data)).filter((m): m is PatternMatch => m !== null);

  return [...vergenceMatches, ...accommodativeMatches];
}
