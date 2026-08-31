export type StreakFinding = 'through' | 'left' | 'right' | 'above' | 'below';

/** Shared offset/label vocabulary for any two-element dissociated-image diagram (a rod/light pair, a red cross in green circles, or Von Graefe's two letter blocks) — one fixed reference element, one offset per finding. */
export const OFFSET: Record<StreakFinding, number> = {
  through: 0,
  left: -16,
  above: -16,
  right: 16,
  below: 16,
};

export const FINDING_LABEL: Record<StreakFinding, string> = {
  through: 'through',
  left: 'to the left of',
  right: 'to the right of',
  above: 'above',
  below: 'below',
};
