/**
 * One-sentence, plain-language definitions for clinical terms used in
 * Clinical Guide pathways. Surfaced via a tap-to-reveal "?" affordance next
 * to the term — never inline in the main flow. Keyed by a short id
 * referenced from a DecisionStep/DecisionOutcome's `infoTerm(s)`.
 */
export const glossaryTerms: Record<string, string> = {
  comitant: 'The deviation stays about the same size in different gaze positions.',
  incomitant: 'The deviation changes size depending on which direction the patient looks.',
  torsion: "One eye's image is rotated relative to the other, rather than just shifted up/down or side to side.",
  suppression: 'The brain ignores the input from one eye to avoid seeing double.',
  restriction: 'A muscle or tissue mechanically blocks eye movement, rather than the muscle itself being weak.',
};

export function getGlossaryTerm(id: string): string | undefined {
  return glossaryTerms[id];
}
