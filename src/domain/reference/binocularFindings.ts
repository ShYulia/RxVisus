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

/**
 * Cover Test, Maddox Rod, Schober Test, and the Von Graefe Technique are all valid ways to
 * arrive at a Phoria value — the field is method-agnostic by design, so citing more than one
 * test on the same pathway step (see 'distance-phoria-type'/'near-phoria-type' in
 * clinicalPathways.ts) never risks double-counting: it's one number regardless of which test
 * produced it, not multiple independent findings to add together.
 */
export interface Phoria {
  type: PhoriaType;
  /** Δ, undefined for ortho (no meaningful amount) or if left blank. */
  amount?: number;
}

export interface VergenceFinding {
  blur?: number;
  /** True when the clinician explicitly recorded "no blur point" rather than leaving blur untested — a genuine clinical result, distinct from missing data. */
  blurAbsent?: boolean;
  break?: number;
  /** True when the clinician explicitly recorded "exceeds the testable range" (e.g. prism bar limit, commonly written ">40") for Break rather than a fabricated in-range number or leaving it untested — a genuine clinical result, distinct from both a numeric break and missing data. */
  breakExceedsRange?: boolean;
  recovery?: number;
  /** Same as breakExceedsRange, for Recovery. */
  recoveryExceedsRange?: boolean;
}

export interface VergencePair {
  bi?: VergenceFinding;
  bo?: VergenceFinding;
}

export interface FacilityFinding {
  cyclesPerMin?: number;
  difficulty?: MafDifficulty;
}

/**
 * MEM/Nott lag or lead, per eye, in diopters — signed so it can eventually be classified without
 * regex-parsing free text: positive = lag (the neutralizing lens was plus), negative = lead (the
 * neutralizing lens was minus), matching the sign convention on the mem-retinoscopy-test/
 * nott-retinoscopy-test cards. Not yet consumed by the pattern-matching layer — see
 * binocularPatterns.ts — pending a clinically validated notability threshold.
 */
export interface MemNottFinding {
  od?: number;
  os?: number;
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
  memNott?: MemNottFinding;
  stereoacuity?: string;
  entryMode?: 'quick' | 'full';
  diplopiaNew?: boolean;
}

/**
 * Strict numeric parse for a clinical measurement field: unlike parseFloat, this rejects
 * trailing garbage ("6cm" is not a number) so entered-but-unparseable text can never be
 * silently misread as a clean value. The entry-side form (TextEntryForm) is expected to block
 * Continue on exactly this same check, so in practice this only ever sees a blank string, a
 * clean number, or one of the field's own sentinel values (see NO_BLUR_VALUE,
 * EXCEEDS_RANGE_VALUE) — this parser stays strict regardless, as the single source of truth for
 * "does this look like a number", so a future entry path can't silently regress the guarantee.
 * Returns undefined for blank/whitespace-only input (not entered) or anything that isn't a
 * finite number — never 0, never a guess.
 */
export function parseStrictNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : undefined;
}

function num(findings: Record<string, string>, key: string): number | undefined {
  const raw = findings[key];
  if (raw === undefined) return undefined;
  return parseStrictNumber(raw);
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

/** Sentinel recorded for a field explicitly marked as having no numeric result (e.g. TextEntryForm's "No blur" toggle) — see NO_BLUR_VALUE. */
export const NO_BLUR_VALUE = 'none';

/** Sentinel recorded for a Break/Recovery field explicitly marked as having exceeded the testable range (e.g. the prism bar's limit, commonly written ">40") instead of a fabricated in-range number — see the "Exceeds range" toggle on the fusional-vergence steps. */
export const EXCEEDS_RANGE_VALUE = 'exceeds-range';

function parseVergenceFinding(findings: Record<string, string>, prefix: string): VergenceFinding {
  return {
    blur: num(findings, `${prefix}.blur`),
    blurAbsent: str(findings, `${prefix}.blur`) === NO_BLUR_VALUE,
    break: num(findings, `${prefix}.break`),
    breakExceedsRange: str(findings, `${prefix}.break`) === EXCEEDS_RANGE_VALUE,
    recovery: num(findings, `${prefix}.recovery`),
    recoveryExceedsRange: str(findings, `${prefix}.recovery`) === EXCEEDS_RANGE_VALUE,
  };
}

function parseVergence(findings: Record<string, string>, prefix: string): VergencePair | undefined {
  const bi = parseVergenceFinding(findings, `${prefix}.bi`);
  const bo = parseVergenceFinding(findings, `${prefix}.bo`);
  const hasBi = bi.blur !== undefined || bi.blurAbsent || bi.break !== undefined || bi.breakExceedsRange || bi.recovery !== undefined || bi.recoveryExceedsRange;
  const hasBo = bo.blur !== undefined || bo.blurAbsent || bo.break !== undefined || bo.breakExceedsRange || bo.recovery !== undefined || bo.recoveryExceedsRange;
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

  const memNottOD = num(findings, 'memNott.OD');
  const memNottOS = num(findings, 'memNott.OS');
  const hasMemNott = memNottOD !== undefined || memNottOS !== undefined;

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
    memNott: hasMemNott ? { od: memNottOD, os: memNottOS } : undefined,
    stereoacuity: str(findings, 'stereoacuity.value'),
    entryMode: str(findings, 'entryMode') as 'quick' | 'full' | undefined,
    diplopiaNew: str(findings, 'diplopiaNew') === 'yes' ? true : str(findings, 'diplopiaNew') === 'no' ? false : undefined,
  };
}
