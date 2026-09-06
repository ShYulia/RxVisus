/**
 * Centralized screening/interpretation thresholds for Binocular Status —
 * kept in one place, separate from navigation/UI code, specifically so they
 * can be reviewed and changed without touching the wizard or the pattern
 * logic. These are a reasonable starting point, NOT clinically validated —
 * same convention as clinicalTests.ts/clinicalPathways.ts: review against
 * real clinical judgment before relying on them. Nothing in the wizard or
 * pattern-matching code should hard-code a number outside this file.
 */
export const BINOCULAR_NORMS = {
  /** NPC break beyond this (cm) is treated as receded/notable. Commonly cited range is ~5-10cm. */
  npcBreakNotableCm: 6,
  /** Near phoria magnitude (either direction) beyond this (Δ) is treated as notable on Quick Screen. */
  nearPhoriaNotableDelta: 8,
  /** Distance phoria magnitude beyond this (Δ) is treated as notable on Quick Screen. */
  distancePhoriaNotableDelta: 3,
  /** MAF cycles/min below this is treated as notable on Quick Screen (adult monocular facility). */
  mafNotableBelowCpm: 6,
  /**
   * Sheard's criterion: compensating reserve must be at least this multiple of the phoria to pass.
   * Source: Sheard C. "Zones of Ocular Comfort." American Journal of Optometry. 1930;7:9–25.
   */
  sheardMultiplier: 2,
  /**
   * Hofstetter's formula for expected minimum amplitude of accommodation by age (D) —
   * a standard textbook reference formula, not a novel threshold. Still flagged as a
   * draft interpretation aid pending clinical review of how it's applied here.
   */
  hofstetterMinimumAA(age: number): number {
    return 15 - 0.25 * age;
  },
  /** Distance/near phoria magnitudes within this margin (Δ) of each other are treated as "similar" (Basic patterns), rather than one being clearly greater (CI/CE/DI/DE patterns). */
  phoriaSimilarMarginDelta: 3,
  /** Phoria magnitude at/near this (Δ) or below is treated as "near ortho" for Fusional Vergence Dysfunction purposes. */
  nearOrthoMaxDelta: 2,
  /** Gradient AC/A above this (Δ/D) is treated as elevated, supporting a Convergence Excess pattern. */
  acaHighAboveRatio: 6,
  /** Near BI break below this (Δ) is treated as reduced (Fusional Vergence Dysfunction supporting finding only — not a hard cutoff for any pass/fail). */
  nearBiBreakLowDelta: 10,
  /** Near BO break below this (Δ) is treated as reduced (Fusional Vergence Dysfunction supporting finding only). */
  nearBoBreakLowDelta: 15,
};
