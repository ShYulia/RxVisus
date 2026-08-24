import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData } from './binocularFindings';
import { evaluateDistanceSheard, evaluateNearSheard, type SheardResult } from './binocularSheard';

/**
 * Each pattern below is its own bespoke clinical check — a required
 * condition specific to that pattern, its own supporting findings, and (for
 * most) its own contradicting condition that suppresses the match. There is
 * deliberately no generic "N findings = pattern" rule: a pattern with weak
 * or no corroborating evidence beyond its required condition is reported as
 * "Possible...", never with the same confidence as one with multiple
 * concordant findings. This module never infers treatment or a prism
 * amount — only a conservatively-worded finding plus the evidence for it.
 */
export interface PatternMatch {
  id: string;
  label: string;
  confidence: 'consistent' | 'possible';
  supportingFindings: string[];
}

export type InterpretationCategory = 'pattern' | 'mixed' | 'no-pattern' | 'insufficient-data';

export interface BinocularInterpretation {
  category: InterpretationCategory;
  headline: string;
  patterns: PatternMatch[];
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
  // Contradicted if NPC is normal and near Sheard's clearly passes — the two usual corroborating findings both argue against it.
  if (!npcReceded && data.npcBreakCm !== undefined && nearSheard.applicable && nearSheard.pass === true) return null;

  return { id: 'ci', label: 'Convergence Insufficiency', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
};

const checkConvergenceExcess: PatternCheck = (data) => {
  const near = data.nearPhoria;
  if (!near || near.type !== 'eso' || near.amount === undefined) return null;
  const distanceEso = data.distancePhoria?.type === 'eso' ? (data.distancePhoria.amount ?? 0) : 0;
  if (near.amount - distanceEso <= BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const supporting = [`Near esophoria (${near.amount}Δ) greater than distance (${distanceEso}Δ)`];
  const nearSymptomatic = ['nearStrain', 'headache', 'nearBlur'].some((k) => data.symptoms.has(k));
  if (nearSymptomatic) supporting.push('Near-specific symptoms reported');
  if (data.acaGradient !== undefined && data.acaGradient > BINOCULAR_NORMS.acaHighAboveRatio) {
    supporting.push(`Elevated AC/A ratio (${data.acaGradient}Δ/D)`);
  }

  return { id: 'ce', label: 'Convergence Excess', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
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

  return { id: 'di', label: 'Divergence Insufficiency', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
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

  return { id: 'de', label: 'Divergence Excess', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
};

function checkBasicPhoria(data: ParsedBinocularData, type: 'exo' | 'eso', nearSheard: SheardResult): PatternMatch | null {
  const near = data.nearPhoria;
  const distance = data.distancePhoria;
  if (!near || near.type !== type || near.amount === undefined) return null;
  if (!distance || distance.type !== type || distance.amount === undefined) return null;
  if (Math.abs(near.amount - distance.amount) > BINOCULAR_NORMS.phoriaSimilarMarginDelta) return null;

  const label = type === 'exo' ? 'Basic Exophoria' : 'Basic Esophoria';
  const supporting = [`Similar ${type}phoria at distance (${distance.amount}Δ) and near (${near.amount}Δ)`];
  if (data.symptoms.size > 0 && !data.symptoms.has('none')) supporting.push('Symptomatic');
  if (nearSheard.applicable && nearSheard.pass === false) supporting.push("Near Sheard's criterion failed");

  return { id: type === 'exo' ? 'basic-exo' : 'basic-eso', label, confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
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
  if (!biReduced && !boReduced) return null;

  const supporting = ['Near-ortho alignment at both distance and near'];
  if (biReduced) supporting.push(`Reduced near BI break (${bi!.break}Δ)`);
  if (boReduced) supporting.push(`Reduced near BO break (${bo!.break}Δ)`);

  return {
    id: 'fvd',
    label: 'Fusional Vergence Dysfunction',
    confidence: biReduced && boReduced ? 'consistent' : 'possible',
    supportingFindings: supporting,
  };
};

function checkAccommodativeInsufficiency(data: ParsedBinocularData): PatternMatch | null {
  if (data.age === undefined) return null;
  const minExpected = BINOCULAR_NORMS.hofstetterMinimumAA(data.age);
  const odLow = data.aaOD !== undefined && data.aaOD < minExpected;
  const osLow = data.aaOS !== undefined && data.aaOS < minExpected;
  if (!odLow && !osLow) return null;

  const supporting: string[] = [];
  if (odLow) supporting.push(`AA OD ${data.aaOD}D below age-expected minimum (~${minExpected.toFixed(1)}D)`);
  if (osLow) supporting.push(`AA OS ${data.aaOS}D below age-expected minimum (~${minExpected.toFixed(1)}D)`);
  if (data.maf?.difficulty === 'minus' || data.maf?.difficulty === 'both') supporting.push('Difficulty clearing minus lenses (MAF)');

  return { id: 'ai', label: 'Accommodative Insufficiency', confidence: odLow && osLow ? 'consistent' : 'possible', supportingFindings: supporting };
}

function checkAccommodativeExcess(data: ParsedBinocularData): PatternMatch | null {
  const plusDifficulty = data.maf?.difficulty === 'plus' || data.maf?.difficulty === 'both' || data.baf?.difficulty === 'plus' || data.baf?.difficulty === 'both';
  if (!plusDifficulty) return null;

  const supporting = ['Difficulty clearing plus lenses'];
  if (data.symptoms.has('nearBlur') || data.symptoms.has('headache')) supporting.push('Near blur/headache symptoms reported');

  return { id: 'ae', label: 'Accommodative Excess', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
}

function checkAccommodativeInfacility(data: ParsedBinocularData): PatternMatch | null {
  const mafBoth = data.maf?.difficulty === 'both';
  const bafBoth = data.baf?.difficulty === 'both';
  if (!mafBoth && !bafBoth) return null;

  const supporting: string[] = [];
  if (mafBoth) supporting.push('MAF difficulty clearing both +2.00 and −2.00');
  if (bafBoth) supporting.push('BAF difficulty clearing both +2.00 and −2.00');
  if (data.symptoms.has('slowRefocusNearToDistance') || data.symptoms.has('slowRefocusDistanceToNear')) supporting.push('Slow refocusing reported');
  if (data.maf?.od !== undefined && data.maf.od < BINOCULAR_NORMS.mafNotableBelowCpm) supporting.push(`Reduced MAF OD (${data.maf.od} cpm)`);
  if (data.maf?.os !== undefined && data.maf.os < BINOCULAR_NORMS.mafNotableBelowCpm) supporting.push(`Reduced MAF OS (${data.maf.os} cpm)`);

  return { id: 'ainfac', label: 'Accommodative Infacility', confidence: supporting.length > 1 ? 'consistent' : 'possible', supportingFindings: supporting };
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

/**
 * Runs every pattern's own independent check and combines the results
 * conservatively: a single vergence match -> that pattern; a single
 * accommodative match -> that pattern; both categories matching -> "mixed";
 * more than one match within the same category (an unusual/conflicting
 * combination) -> reported as no single clear pattern rather than guessing;
 * nothing matched but core data exists -> "no clear pattern" (the Full
 * Assessment stop condition); too little data entered at all ->
 * "insufficient data".
 */
export function interpretBinocularAssessment(data: ParsedBinocularData): BinocularInterpretation {
  const hasCoreData = !!data.distancePhoria || !!data.nearPhoria || data.npcBreakCm !== undefined;
  if (!hasCoreData) {
    return { category: 'insufficient-data', headline: 'Insufficient data to interpret — complete the core Alignment/Convergence steps first.', patterns: [] };
  }

  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);

  const vergenceMatches = VERGENCE_CHECKS.map((check) => check(data, nearSheard, distanceSheard)).filter((m): m is PatternMatch => m !== null);
  const accommodativeMatches = ACCOMMODATIVE_CHECKS.map((check) => check(data)).filter((m): m is PatternMatch => m !== null);

  if (vergenceMatches.length > 1 || accommodativeMatches.length > 1) {
    return {
      category: 'no-pattern',
      headline: 'Findings do not cluster into a single clear pattern — review the individual results below.',
      patterns: [...vergenceMatches, ...accommodativeMatches],
    };
  }

  if (vergenceMatches.length === 1 && accommodativeMatches.length === 1) {
    return { category: 'mixed', headline: 'Mixed binocular/accommodative findings', patterns: [vergenceMatches[0], accommodativeMatches[0]] };
  }
  if (vergenceMatches.length === 1) {
    const match = vergenceMatches[0];
    const prefix = match.confidence === 'consistent' ? 'Findings consistent with' : 'Possible';
    return { category: 'pattern', headline: `${prefix} ${match.label} pattern`, patterns: [match] };
  }
  if (accommodativeMatches.length === 1) {
    const match = accommodativeMatches[0];
    const prefix = match.confidence === 'consistent' ? 'Findings consistent with' : 'Possible';
    return { category: 'pattern', headline: `${prefix} ${match.label}`, patterns: [match] };
  }

  return {
    category: 'no-pattern',
    headline: 'No significant binocular or accommodative dysfunction demonstrated. Current findings do not explain the reported symptoms.',
    patterns: [],
  };
}
