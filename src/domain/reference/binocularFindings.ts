/**
 * Parses the flat recordedFindings string map (the shared wizard data store —
 * see PathwayWizard) into typed Binocular Status data. Every field is
 * optional: a clinician may skip any test, and the pattern-matching layer
 * treats missing data as "insufficient data for this check", never as zero
 * or normal. Field keys here must match the keys used in the
 * 'binocular-status' step graph (clinicalPathways.ts) exactly — see that
 * file's step definitions for the canonical key list.
 */

export type PhoriaType = 'ortho' | 'exo' | 'eso';
export type MafDifficulty = 'plus' | 'minus' | 'both' | 'neither';

export interface Phoria {
  type: PhoriaType;
  /** Δ, undefined for ortho (no meaningful amount) or if left blank. */
  amount?: number;
}

export interface VergenceFinding {
  blur?: number;
  break?: number;
  recovery?: number;
}

export interface VergencePair {
  bi?: VergenceFinding;
  bo?: VergenceFinding;
}

export interface FacilityFinding {
  cyclesPerMin?: number;
  difficulty?: MafDifficulty;
}

export interface ParsedBinocularData {
  age?: number;
  /** Symptom keys the clinician selected — see SYMPTOM_OPTIONS in clinicalPathways.ts. */
  symptoms: Set<string>;
  distancePhoria?: Phoria;
  nearPhoria?: Phoria;
  npcBreakCm?: number;
  npcRecoveryCm?: number;
  /** OD/OS monocular accommodative facility, cycles/min, plus one shared difficulty finding. */
  maf?: FacilityFinding & { od?: number; os?: number };
  nearVergence?: VergencePair;
  distanceVergence?: VergencePair;
  aaOD?: number;
  aaOS?: number;
  baf?: FacilityFinding;
  acaGradient?: number;
  nra?: number;
  pra?: number;
  vergenceFacilityCpm?: number;
  vergenceFacilityUnavailable?: boolean;
  memNott?: string;
  stereoacuity?: string;
  entryMode?: 'quick' | 'full';
  diplopiaNew?: boolean;
}

function num(findings: Record<string, string>, key: string): number | undefined {
  const raw = findings[key];
  if (raw === undefined || raw.trim() === '') return undefined;
  const value = parseFloat(raw);
  return Number.isNaN(value) ? undefined : value;
}

function str(findings: Record<string, string>, key: string): string | undefined {
  const raw = findings[key];
  return raw && raw.trim() !== '' ? raw : undefined;
}

function parsePhoria(findings: Record<string, string>, typeKey: string, amountKey: string): Phoria | undefined {
  const type = str(findings, typeKey) as PhoriaType | undefined;
  if (!type) return undefined;
  return { type, amount: type === 'ortho' ? undefined : num(findings, amountKey) };
}

function parseVergence(findings: Record<string, string>, prefix: string): VergencePair | undefined {
  const bi: VergenceFinding = {
    blur: num(findings, `${prefix}.bi.blur`),
    break: num(findings, `${prefix}.bi.break`),
    recovery: num(findings, `${prefix}.bi.recovery`),
  };
  const bo: VergenceFinding = {
    blur: num(findings, `${prefix}.bo.blur`),
    break: num(findings, `${prefix}.bo.break`),
    recovery: num(findings, `${prefix}.bo.recovery`),
  };
  const hasBi = bi.blur !== undefined || bi.break !== undefined || bi.recovery !== undefined;
  const hasBo = bo.blur !== undefined || bo.break !== undefined || bo.recovery !== undefined;
  if (!hasBi && !hasBo) return undefined;
  return { bi: hasBi ? bi : undefined, bo: hasBo ? bo : undefined };
}

export function parseBinocularFindings(findings: Record<string, string>): ParsedBinocularData {
  const symptomsRaw = str(findings, 'symptoms');
  const symptoms = new Set(symptomsRaw ? symptomsRaw.split(',').filter(Boolean) : []);

  const mafOD = num(findings, 'maf.OD');
  const mafOS = num(findings, 'maf.OS');
  const mafDifficulty = str(findings, 'maf.difficulty') as MafDifficulty | undefined;
  const hasMaf = mafOD !== undefined || mafOS !== undefined || mafDifficulty !== undefined;

  const bafCpm = num(findings, 'baf.cyclesPerMin');
  const bafDifficulty = str(findings, 'baf.difficulty') as MafDifficulty | undefined;
  const hasBaf = bafCpm !== undefined || bafDifficulty !== undefined;

  return {
    age: num(findings, 'age.value'),
    symptoms,
    distancePhoria: parsePhoria(findings, 'distancePhoria.type', 'distancePhoria.amount'),
    nearPhoria: parsePhoria(findings, 'nearPhoria.type', 'nearPhoria.amount'),
    npcBreakCm: num(findings, 'npc.break'),
    npcRecoveryCm: num(findings, 'npc.recovery'),
    maf: hasMaf ? { od: mafOD, os: mafOS, difficulty: mafDifficulty } : undefined,
    nearVergence: parseVergence(findings, 'nearVergence'),
    distanceVergence: parseVergence(findings, 'distanceVergence'),
    aaOD: num(findings, 'aa.OD'),
    aaOS: num(findings, 'aa.OS'),
    baf: hasBaf ? { cyclesPerMin: bafCpm, difficulty: bafDifficulty } : undefined,
    acaGradient: num(findings, 'acaGradient.value'),
    nra: num(findings, 'nra.value'),
    pra: num(findings, 'pra.value'),
    vergenceFacilityCpm: num(findings, 'vergenceFacility.cyclesPerMin'),
    vergenceFacilityUnavailable: str(findings, 'vergenceFacility.status') === 'unavailable',
    memNott: str(findings, 'memNott.value'),
    stereoacuity: str(findings, 'stereoacuity.value'),
    entryMode: str(findings, 'entryMode') as 'quick' | 'full' | undefined,
    diplopiaNew: str(findings, 'diplopiaNew') === 'yes' ? true : str(findings, 'diplopiaNew') === 'no' ? false : undefined,
  };
}
