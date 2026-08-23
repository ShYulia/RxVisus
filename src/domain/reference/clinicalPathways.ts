/**
 * Clinical pathways: symptom/problem-first navigation into the canonical
 * test cards in clinicalTests.ts. A node is either a branch (more choices)
 * or a leaf (guidance + relevant tests, referenced by id — never duplicated).
 *
 * A leaf's `steps` encode the actual clinical reasoning as short
 * finding -> action decision points (see DecisionStep) — this is the part
 * that should read fast at the point of care. `keySteps` is reserved for
 * plain, non-branching notes (a pre-test checklist, a reference list) that
 * don't change the next action depending on the answer.
 *
 * Content is a reasonable starting draft, not yet clinically validated.
 */

/** One branch of a DecisionStep: a specific finding and what it leads to. */
export interface DecisionOutcome {
  /** The finding, kept short — this is what the clinician observed. */
  label: string;
  /** Short next action or interpretation. Avoid stating a diagnosis this single finding cannot establish on its own. */
  action: string;
  /** Canonical test(s) this outcome leads to, if any. */
  testIds?: string[];
  /** A red flag specific to this particular finding (not the whole node). */
  redFlag?: string;
}

/** One point in a pathway's decision flow: a question and its possible findings. */
export interface DecisionStep {
  question: string;
  /** Test(s) used to answer this question, if any (e.g. the cover test itself). */
  testIds?: string[];
  outcomes: DecisionOutcome[];
}

export interface ClinicalPathwayNode {
  id: string;
  title: string;
  kind: 'branch' | 'leaf';
  /** Short framing text — a sentence or two, not an article. */
  overview?: string;
  /** Plain, non-branching notes — a pre-test checklist or reference list. */
  keySteps?: string[];
  /** The node's decision flow — leaf only. */
  steps?: DecisionStep[];
  /** Red flags that apply to the node generally (vs. a specific DecisionOutcome). */
  redFlags?: string[];
  /** Branch only: child ClinicalPathwayNode ids. */
  children?: string[];
  /** Leaf only: ClinicalTest ids this situation calls for, when not tied to a specific step/outcome. */
  testIds?: string[];
  /** Other pathway nodes worth linking to from here (e.g. a shared guidance leaf). */
  seeAlso?: string[];
}

export const clinicalPathways: ClinicalPathwayNode[] = [
  {
    id: 'diplopia',
    title: 'Diplopia',
    kind: 'branch',
    overview:
      'Does the second image persist with one eye viewing alone, or disappear when either eye is covered? Test each eye separately first — this determines the entire workup.',
    children: ['diplopia-monocular', 'diplopia-binocular'],
  },
  {
    id: 'diplopia-monocular',
    title: 'Monocular diplopia',
    kind: 'leaf',
    overview: 'Persists with the fellow eye covered — points to that eye, not to alignment. May affect one eye or occur independently in both.',
    keySteps: ['Confirm: does the second image persist with the fellow eye covered? Test each eye separately.'],
    steps: [
      {
        question: 'Pinhole: does it resolve or improve?',
        testIds: ['pinhole-test'],
        outcomes: [
          {
            label: 'Resolves / improves significantly',
            action: 'Optical cause more likely — check refraction and astigmatism (incl. irregular), and the tear film/ocular surface.',
          },
          {
            label: 'No change',
            action: 'Consider non-refractive ocular causes — examine cornea, lens, and macula/retina.',
          },
        ],
      },
    ],
    redFlags: ['New monocular diplopia with a visual field defect or metamorphopsia — refer for retinal/macular assessment.'],
  },
  {
    id: 'diplopia-binocular',
    title: 'Binocular diplopia',
    kind: 'leaf',
    overview:
      'Resolves when either eye is covered. Reported direction (horizontal / vertical / oblique) is a descriptor, not a diagnosis — oblique means a combined horizontal + vertical separation and is carried through the steps below, not a separate path.',
    keySteps: [
      'Note onset/urgency, constant vs. intermittent, and distance vs. near vs. both — clues to combine with the findings below, not conclusions on their own.',
    ],
    redFlags: ['Sudden onset with pain, ptosis, or pupil involvement — urgent medical/neuro-ophthalmic referral.'],
    steps: [
      {
        question: 'Cover test: comitant or incomitant across gaze positions?',
        testIds: ['cover-test'],
        outcomes: [
          { label: 'Comitant', action: 'Continue to quantify below if precision is needed.' },
          { label: 'Incomitant (varies with gaze)', action: 'Assess motility next.' },
          { label: 'Not reproducible', action: 'Reconsider intermittency — retest when symptomatic.' },
        ],
      },
      {
        question: 'Motility / versions & ductions: what limits movement?',
        outcomes: [
          {
            label: 'Single muscle underacts, vertical component present',
            action: 'Localize with Parks 3-Step — only when an isolated cyclovertical palsy is suspected.',
            testIds: ['parks-3-step'],
          },
          {
            label: 'Limitation suggestive of restriction',
            action: 'Consider restrictive/orbital causes; assess and refer as appropriate.',
            redFlag: 'Limitation suggestive of mechanical restriction (e.g. thyroid eye disease, orbital pathology) — assess and refer as appropriate.',
          },
          {
            label: 'Incomitant, no clear single-muscle localization',
            action: "Track over time; if it doesn't clarify, consider further/specialist assessment (e.g. Hess/Lancaster mapping).",
          },
        ],
      },
      {
        question: 'Torsion: are the images tilted relative to each other?',
        outcomes: [
          {
            label: 'Torsion present or suspected (incl. oblique diplopia)',
            action: 'Quantify with Double Maddox Rod.',
            testIds: ['double-maddox-rod'],
          },
          { label: 'No torsional component', action: 'Skip — continue below.' },
        ],
      },
      {
        question: 'Does the deviation need precise quantification (e.g. for prism)?',
        outcomes: [
          {
            label: 'Yes',
            action: 'Measure subjectively with what the room already has set up — Schober (projector cross target) or Maddox Rod.',
            testIds: ['schober-test', 'maddox-rod'],
          },
          { label: 'Already quantified', action: 'Continue to prism guidance below.' },
        ],
      },
      {
        question: 'Do symptoms and alignment findings fully agree?',
        outcomes: [
          {
            label: "No — findings don't fully explain symptoms, or fusion/suppression status matters",
            action: 'Assess binocular sensory status with Worth 4 Dot (distance, standard projector target).',
            testIds: ['worth-4-dot'],
          },
          { label: 'Yes — alignment and symptoms agree', action: 'Not routinely needed.' },
        ],
      },
    ],
    seeAlso: ['diplopia-prism-prescribing'],
  },
  {
    id: 'diplopia-prism-prescribing',
    title: 'Prism Prescribing Guidance',
    kind: 'leaf',
    overview: 'Once prism is measured, decide how to split it into the final Rx. A distribution reminder to avoid base-direction mistakes — not a calculator.',
    keySteps: [
      'Horizontal: split between the eyes on the same base direction. E.g. 6Δ BO → 3Δ BO OD + 3Δ BO OS.',
      'Vertical: split with opposite base directions between the eyes. E.g. 6Δ BU OS → 3Δ BD OD + 3Δ BU OS.',
      'Combined H+V: split each component separately. E.g. 6Δ BO OD + 6Δ BU OS → OD: 3Δ BO + 3Δ BD; OS: 3Δ BO + 3Δ BU.',
      'This is an equal/balanced split, not necessarily the optimal lens thickness — that depends on the full Rx, frame, lens design/material, and lab implementation.',
    ],
  },
];

export function getPathwayNode(id: string): ClinicalPathwayNode | undefined {
  return clinicalPathways.find((node) => node.id === id);
}
