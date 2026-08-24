import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData } from './binocularFindings';

/**
 * Quick Screen must never diagnose — only decide whether Full Assessment is
 * warranted, and say why. Symptoms and objective screening findings are
 * independent reasons to recommend further assessment (see the 4-branch
 * logic in binocularStatus.md-equivalent spec): either alone is enough,
 * neither is required to be "severe" — a single notable finding does not
 * become a diagnosis here, it's just a reason to look further.
 */
export interface QuickScreenResult {
  recommendFullAssessment: boolean;
  /** Symptom-based reasons (e.g. "Near eye strain / fatigue reported"). */
  symptomReasons: string[];
  /** Objective screening findings outside the draft expected range (e.g. "Near phoria 10Δ exo"). */
  objectiveReasons: string[];
}

/** Human-readable labels for recordedFindings symptom keys — the only place clinician-facing text should read a raw key, everywhere else (Summary, etc.) should import this rather than showing e.g. "nearStrain" directly. */
export const SYMPTOM_LABELS: Record<string, string> = {
  nearStrain: 'Near eye strain / fatigue',
  headache: 'Headache with visual work',
  nearBlur: 'Near blur',
  distanceBlur: 'Distance blur',
  slowRefocusNearToDistance: 'Slow refocusing near → distance',
  slowRefocusDistanceToNear: 'Slow refocusing distance → near',
  readingDifficulty: 'Reading difficulty / losing place',
  diplopia: 'Intermittent diplopia',
};

export function evaluateQuickScreen(data: ParsedBinocularData): QuickScreenResult {
  const symptomReasons = [...data.symptoms].filter((key) => key !== 'none').map((key) => SYMPTOM_LABELS[key] ?? key);

  const objectiveReasons: string[] = [];

  if (data.distancePhoria && data.distancePhoria.type !== 'ortho' && (data.distancePhoria.amount ?? 0) >= BINOCULAR_NORMS.distancePhoriaNotableDelta) {
    objectiveReasons.push(`Distance phoria ${data.distancePhoria.amount}Δ ${data.distancePhoria.type}`);
  }
  if (data.nearPhoria && data.nearPhoria.type !== 'ortho' && (data.nearPhoria.amount ?? 0) >= BINOCULAR_NORMS.nearPhoriaNotableDelta) {
    objectiveReasons.push(`Near phoria ${data.nearPhoria.amount}Δ ${data.nearPhoria.type}`);
  }
  if (data.npcBreakCm !== undefined && data.npcBreakCm > BINOCULAR_NORMS.npcBreakNotableCm) {
    objectiveReasons.push(`NPC break at ${data.npcBreakCm}cm`);
  }
  if (data.maf?.difficulty === 'minus') {
    objectiveReasons.push('Difficulty clearing −2.00 D (MAF)');
  } else if (data.maf?.difficulty === 'plus') {
    objectiveReasons.push('Difficulty clearing +2.00 D (MAF)');
  } else if (data.maf?.difficulty === 'both') {
    objectiveReasons.push('Difficulty clearing both +2.00 D and −2.00 D (MAF)');
  }
  if (data.maf?.od !== undefined && data.maf.od < BINOCULAR_NORMS.mafNotableBelowCpm) {
    objectiveReasons.push(`MAF OD ${data.maf.od} cycles/min`);
  }
  if (data.maf?.os !== undefined && data.maf.os < BINOCULAR_NORMS.mafNotableBelowCpm) {
    objectiveReasons.push(`MAF OS ${data.maf.os} cycles/min`);
  }

  return {
    recommendFullAssessment: symptomReasons.length > 0 || objectiveReasons.length > 0,
    symptomReasons,
    objectiveReasons,
  };
}
