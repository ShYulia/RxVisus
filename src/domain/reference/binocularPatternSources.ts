/**
 * Compact, point-of-use clinical citations for each Binocular Status pattern — shown directly
 * under the "Why this pattern was suggested" findings, not only in docs/clinical/CLINICAL_SOURCES.md.
 * Each entry names a specific, verifiable source (author/title/publication/year, with a DOI or
 * ISBN where one exists) and states only what that source itself supports — the underlying
 * clinical association or classification, never RxKit's specific trigger/threshold as if the
 * source had validated it.
 *
 * Implementation-level detail — which parts of a trigger are drawn directly from a source versus
 * RxKit's own conservative interpretation where the literature doesn't settle on one combination
 * rule — is deliberately kept out of this patient-facing text and lives instead in
 * docs/clinical/CLINICAL_SOURCES.md, alongside the full verification/evidence-status record.
 */
export const PATTERN_SOURCES: Record<string, string> = {
  ci: "CITT Investigator Group. Ophthalmic Epidemiology. 2008;15(1):24–36 (doi:10.1080/09286580701772037) — diagnostic criteria for Convergence Insufficiency: near exophoria greater than distance, a receded near point of convergence, and reduced positive fusional vergence. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  ce: "Duane A. Ann Ophthalmol Otol. 1896 (repr. 1897) — classification of horizontal heterophoria by near/distance relationship and AC/A ratio, including a near-esophoria-greater-than-distance pattern associated with a high AC/A ratio. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  di: "Duane A. Ann Ophthalmol Otol. 1896 (repr. 1897) — classification of horizontal heterophoria by near/distance relationship and AC/A ratio, including a distance-esophoria-greater-than-near pattern. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  de: "Duane A. Ann Ophthalmol Otol. 1896 (repr. 1897) — classification of horizontal heterophoria by near/distance relationship and AC/A ratio, including a distance-exophoria-greater-than-near pattern associated with a high AC/A ratio. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  'basic-exo': "Duane A. Ann Ophthalmol Otol. 1896 (repr. 1897) — classification of horizontal heterophoria by near/distance relationship and AC/A ratio, including a pattern with similar exophoria at distance and near and a normal AC/A ratio. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  'basic-eso': "Duane A. Ann Ophthalmol Otol. 1896 (repr. 1897) — classification of horizontal heterophoria by near/distance relationship and AC/A ratio, including a pattern with similar esophoria at distance and near and a normal AC/A ratio. Sheard C. Am J Optom. 1930;7:9–25 — the compensating fusional reserve should be at least twice the phoria.",
  fvd: "Evans BJW. Ophthalmic Physiol Opt. 2025;45 (doi:10.1111/opo.13497); Evans BJW. Pickwell's Binocular Vision Anomalies (Elsevier). Fusional Vergence Dysfunction (binocular instability) is characterized by reduced fusional reserves in both the base-in and base-out directions, with normal near and distance phoria.",
  ai: "Enaholo ES, Gurnani B. StatPearls: Accommodative Insufficiency (NBK587363) — an accommodative amplitude below the age-expected minimum, together with a second abnormal accommodative sign (such as facility difficulty), supports the diagnosis. Hofstetter HW. Optometric World. 1950;38:42–45 — formula for age-expected minimum amplitude of accommodation.",
  ae: "Hilora M, Tripathy K. StatPearls: Accommodative Excess (NBK592379); Saikia M, Pant K, Dutta J. J Binocul Vis Ocul Motil. 2024;74(2):48–64 (doi:10.1080/2576117X.2024.2347663). Difficulty clearing plus lenses on accommodative facility testing (monocular or binocular) is a recognized finding associated with Accommodative Excess.",
  ainfac: "Griffin JR, Grisham JD. Binocular Anomalies: Diagnosis and Vision Therapy, 4th ed. Butterworth-Heinemann; 2002. Accommodative Infacility is characterized by difficulty with accommodative facility testing, assessed both monocularly (MAF) and binocularly (BAF).",
};

export function getPatternSource(patternId: string): string | undefined {
  return PATTERN_SOURCES[patternId];
}
