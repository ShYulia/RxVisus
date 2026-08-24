import { BINOCULAR_NORMS } from './binocularNorms';
import type { ParsedBinocularData } from './binocularFindings';
import { evaluateDistanceSheard, evaluateNearSheard } from './binocularSheard';

/**
 * Short, plain-language reasons to consider a specific optional test —
 * shown above the optional-tests menu so it reads as "here's why this
 * might help" rather than an unexplained wall of buttons. Never mandatory,
 * never blocks reaching the Summary.
 */
export function suggestOptionalTests(data: ParsedBinocularData): string[] {
  const hints: string[] = [];

  const distance = data.distancePhoria;
  const near = data.nearPhoria;
  if (distance && near && distance.type !== 'ortho' && near.type !== 'ortho' && distance.type !== near.type) {
    hints.push('Distance and near phoria differ in direction — Gradient AC/A may help characterize this.');
  }

  const symptomatic = data.symptoms.size > 0 && !data.symptoms.has('none');
  const nearSheard = evaluateNearSheard(data);
  const distanceSheard = evaluateDistanceSheard(data);
  const npcReceded = data.npcBreakCm !== undefined && data.npcBreakCm > BINOCULAR_NORMS.npcBreakNotableCm;
  const coreFindingsExplainSymptoms = nearSheard.pass === false || distanceSheard.pass === false || npcReceded;
  if (symptomatic && !coreFindingsExplainSymptoms) {
    hints.push('Symptoms are present but not clearly explained by the core findings so far — additional vergence testing (Distance Fusional Vergence, Vergence Facility) may help.');
  }

  if (data.maf?.difficulty && data.maf.difficulty !== 'neither') {
    hints.push('Accommodative difficulty noted on MAF — NRA/PRA and/or MEM/Nott retinoscopy may help clarify it.');
  }

  return hints;
}
