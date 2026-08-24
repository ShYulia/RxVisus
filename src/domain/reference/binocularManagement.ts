/**
 * Short, clinically cautious "what next?" management considerations per pattern id (see
 * binocularPatterns.ts's PatternMatch.id) — support for clinical decision-making, never a
 * substitute for it, and never an automatic prescription. `summary` is what the Summary screen
 * shows directly (keep to 2-3 short lines); `moreDetails` sits behind a "How to manage →"
 * expansion for the nuance that would otherwise slow down a fast scan. Content here is a
 * reasonable draft, not yet clinically validated — treat it the same way the calculators and
 * clinical thresholds elsewhere in this app were treated before shipping: check it against
 * real clinical judgment first.
 */
export interface ManagementConsiderations {
  summary: string[];
  moreDetails?: string[];
}

const BEST_CORRECTION_NOTE = 'Confirm distance and near refractive correction is optimized before attributing findings definitively to a binocular/accommodative cause.';

const MANAGEMENT_BY_PATTERN: Record<string, ManagementConsiderations> = {
  ci: {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider vergence/accommodative therapy as an important option, particularly in younger/symptomatic patients — prism is not the default first recommendation.',
      'Reassess symptoms, NPC, and positive fusional (BO) reserve after a course of therapy.',
    ],
    moreDetails: [
      'Near base-in (BI) relieving prism may be considered for symptom relief when therapy is unsuitable, unsuccessful, or when more immediate relief is needed — not as automatic first-line treatment.',
      'BO exercises train/build the positive fusional convergence reserve; BI prism instead reduces the convergence demand — these are different mechanisms, not interchangeable.',
      "If prism is considered, trial it over the patient's best correction and verify comfort before prescribing.",
      'Age alone should not determine therapy vs. prism (e.g. no simplistic "under 40 = therapy, over 40 = prism") — base the decision on the full clinical picture, patient motivation, and access to therapy.',
    ],
  },
  ce: {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider whether a plus addition at near (if the excess is accommodatively/AC-A driven) or vergence therapy better fits the presentation.',
      'Gradient AC/A (if not already measured) helps clarify how accommodatively driven the near eso is.',
    ],
    moreDetails: [
      'Reassess near symptoms and the near BI (compensating) reserve after any correction change or therapy.',
      'A plus addition, when appropriate, reduces the accommodative convergence demand rather than directly training a reserve.',
    ],
  },
  di: {
    summary: [BEST_CORRECTION_NOTE, 'Consider distance base-in vergence therapy where appropriate; distance prism is a symptomatic option, not a default.'],
  },
  de: {
    summary: [BEST_CORRECTION_NOTE, 'Consider distance vergence therapy; correlate with near findings before attributing symptoms to this alone.'],
  },
  'basic-exo': {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider vergence therapy targeting the base-out (compensating) reserve when the phoria and symptoms are genuinely linked.',
      'Near BI relieving prism is a symptomatic option when therapy is unsuitable or unsuccessful, not a default first step.',
    ],
  },
  'basic-eso': {
    summary: [BEST_CORRECTION_NOTE, 'Consider vergence therapy targeting the base-in (compensating) reserve; a plus addition may also be appropriate if accommodatively driven.'],
  },
  fvd: {
    summary: [BEST_CORRECTION_NOTE, 'Consider vergence therapy addressing both BI and BO reserves; reassess symptoms after a course of therapy before considering prism.'],
  },
  ai: {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider plus lens support at near and/or accommodative therapy, guided by symptoms and near visual demands.',
      'Reassess amplitude and MAF/BAF facility after any correction change or therapy.',
    ],
  },
  ae: {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider accommodative therapy targeting facility/relaxation at near; review near add power and near working habits if relevant.',
    ],
  },
  ainfac: {
    summary: [
      BEST_CORRECTION_NOTE,
      'Consider accommodative facility therapy (both plus and minus sides); correlate with vergence facility if also reduced.',
    ],
  },
};

/** No pattern-specific match — still worth a short, generic note rather than nothing. */
export const NO_PATTERN_MANAGEMENT: ManagementConsiderations = {
  summary: ['No specific binocular/accommodative management is indicated from these findings. Reassess if symptoms persist or change.'],
};

export function getManagementConsiderations(patternId: string): ManagementConsiderations | undefined {
  return MANAGEMENT_BY_PATTERN[patternId];
}
