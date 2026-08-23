/**
 * Clinical pathways: symptom/problem-first navigation into the canonical
 * test cards in clinicalTests.ts. A node is either a branch (more choices)
 * or a leaf (guidance + relevant tests, referenced by id — never duplicated).
 *
 * A leaf's `steps` form a small step graph — one question/action shown at a
 * time (see PathwayWizard), not an article. Two kinds of step:
 *   - 'question': a question with tappable DecisionOutcomes. Each outcome
 *     either points to another step via `next`, or — with `next` omitted —
 *     ends the flow at that outcome's `action` (a real clinical endpoint,
 *     e.g. "refer" or "trial unsuccessful", not just "ran out of tree").
 *   - 'measurement': a structured numeric entry (prism amount + base, +
 *     eye where relevant), not a tap choice — see PrismMeasurement.
 * This keeps the workflow to HISTORY -> EXAMINE -> MEASURE -> TRIAL PRISM ->
 * PRESCRIBE/FURTHER ASSESSMENT, matching how the exam actually happens,
 * rather than a differential-diagnosis tree.
 *
 * Content is a reasonable starting draft, not yet clinically validated.
 */

/** One branch of a DecisionStep: a specific finding and what it leads to. */
export interface DecisionOutcome {
  /** The finding, kept short — this is what the clinician observed/decided. */
  label: string;
  /** Clinical term for this option, shown as small secondary text — never required reading to use the pathway. */
  secondaryLabel?: string;
  /**
   * Short next action or interpretation, shown once this outcome ends the
   * flow (no `next`). Avoid stating a diagnosis this single finding cannot
   * establish on its own.
   */
  action: string;
  /** Canonical test(s) this outcome leads to, if any. */
  testIds?: string[];
  /** A red flag specific to this particular finding — interrupts the flow with an alert before continuing. */
  redFlag?: string;
  /** Glossary term (see glossary.ts) explaining this option's wording, surfaced via a tap-to-reveal "?". */
  infoTerm?: string;
  /** Pathway node(s) worth linking to once this outcome ends the flow (e.g. Prism Prescribing Guidance after a successful trial). */
  seeAlso?: string[];
  /** Id of the next DecisionStep within the same node. Omit to end the flow at this outcome. */
  next?: string;
}

/** One question/action, answered one at a time, with tappable outcomes. */
export interface QuestionStep {
  kind: 'question';
  /** Stable id, targeted by DecisionOutcome.next and used for wizard navigation/history. */
  id: string;
  question: string;
  /** Compact label for the choice-history trail (falls back to `question` if omitted). */
  shortLabel?: string;
  /** Short framing line shown above the question, e.g. exam-technique instructions. */
  instruction?: string;
  /** Show the currently recorded PrismMeasurement above the question (e.g. at the trial step). */
  showMeasurement?: boolean;
  /** Test(s) relevant to this question, if any (e.g. the cover test itself) — shown as reference chip(s) before the choices. */
  testIds?: string[];
  outcomes: DecisionOutcome[];
}

/** A structured prism-measurement entry point — not a tap choice, see PrismMeasurement. */
export interface MeasurementStep {
  kind: 'measurement';
  id: string;
  question: string;
  /** Id of the step to continue to once a measurement is recorded. */
  next: string;
}

export type DecisionStep = QuestionStep | MeasurementStep;

export interface ClinicalPathwayNode {
  id: string;
  title: string;
  kind: 'branch' | 'leaf';
  /** Short framing text — a sentence or two, shown once at the start of the flow, not an article. */
  overview?: string;
  /** Plain, non-branching reference notes (e.g. the prism-splitting reminders) — not part of a decision flow. */
  keySteps?: string[];
  /** The node's step graph — leaf only. First array element is the entry point. */
  steps?: DecisionStep[];
  /** Red flags that apply to the node generally (vs. a specific DecisionOutcome). */
  redFlags?: string[];
  /** Branch only: child ClinicalPathwayNode ids. */
  children?: string[];
  /** Leaf only: ClinicalTest ids this situation calls for, when not tied to a specific step/outcome. */
  testIds?: string[];
  /** Other pathway nodes worth linking to — shown once the flow ends, unless a specific outcome already sets its own seeAlso. */
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
    overview: 'Persists with the fellow eye covered — points to that eye, not to alignment. Test each eye separately; it may affect one eye or occur independently in both.',
    steps: [
      {
        kind: 'question',
        id: 'field-defect',
        shortLabel: 'Field defect?',
        question: 'Visual field defect or metamorphopsia?',
        outcomes: [
          {
            label: 'Yes',
            action: 'Refer for retinal/macular assessment.',
            redFlag: 'New monocular diplopia with a visual field defect or metamorphopsia — refer for retinal/macular assessment.',
            next: 'pinhole',
          },
          { label: 'No', action: '', next: 'pinhole' },
        ],
      },
      {
        kind: 'question',
        id: 'pinhole',
        shortLabel: 'Pinhole',
        question: 'Pinhole: does it resolve or improve?',
        testIds: ['pinhole-test'],
        outcomes: [
          {
            label: 'Resolves / improves',
            action: 'Optical cause more likely — check refraction and astigmatism (incl. irregular), and the tear film/ocular surface.',
          },
          {
            label: 'No change',
            action: 'Consider non-refractive ocular causes — examine cornea, lens, and macula/retina.',
          },
        ],
      },
    ],
  },
  {
    id: 'diplopia-binocular',
    title: 'Binocular diplopia',
    kind: 'leaf',
    overview: 'Resolves when either eye is covered. History -> Examine -> Measure -> Trial prism -> Prescribe or refer.',
    steps: [
      // HISTORY
      {
        kind: 'question',
        id: 'onset',
        shortLabel: 'Onset',
        question: 'When did it start?',
        outcomes: [
          { label: 'Sudden / recent', action: '', next: 'onset-flag' },
          { label: 'Long-standing', action: '', next: 'pattern' },
        ],
      },
      {
        kind: 'question',
        id: 'onset-flag',
        shortLabel: 'Red flags',
        question: 'Any pain, ptosis, or pupil involvement?',
        outcomes: [
          {
            label: 'Yes',
            action: '',
            redFlag: 'Sudden diplopia with pain, ptosis, or pupil involvement — urgent medical/neuro-ophthalmic referral.',
            next: 'pattern',
          },
          { label: 'No', action: '', next: 'pattern' },
        ],
      },
      {
        kind: 'question',
        id: 'pattern',
        shortLabel: 'Pattern',
        question: 'How often?',
        outcomes: [
          { label: 'Constant', action: '', next: 'distance-near' },
          { label: 'Intermittent', action: '', next: 'distance-near' },
        ],
      },
      {
        kind: 'question',
        id: 'distance-near',
        shortLabel: 'Distance/near',
        question: 'When is it worse?',
        outcomes: [
          { label: 'Distance', action: '', next: 'cover-test' },
          { label: 'Near', action: '', next: 'cover-test' },
          { label: 'Both', action: '', next: 'cover-test' },
        ],
      },

      // EXAMINE
      {
        kind: 'question',
        id: 'cover-test',
        shortLabel: 'Cover Test',
        question: 'Cover Test result?',
        instruction: 'Check alignment.',
        testIds: ['cover-test'],
        outcomes: [
          { label: 'No deviation', action: '', next: 'symptomatic-now' },
          { label: 'Phoria', action: '', next: 'direction' },
          { label: 'Tropia', action: '', next: 'direction' },
          { label: 'Not sure', action: '', next: 'symptomatic-now' },
        ],
      },
      {
        kind: 'question',
        id: 'symptomatic-now',
        shortLabel: 'Symptomatic now?',
        question: 'Is the patient symptomatic right now?',
        outcomes: [
          { label: 'Yes', action: '', next: 'sensory-check' },
          {
            label: 'No',
            action: 'Deviation not demonstrated today — reassess when symptomatic / further assessment as appropriate.',
          },
        ],
      },
      {
        kind: 'question',
        id: 'direction',
        shortLabel: 'Direction',
        question: 'Direction?',
        outcomes: [
          { label: 'Eso', action: '', next: 'gaze-dependence' },
          { label: 'Exo', action: '', next: 'gaze-dependence' },
          { label: 'Hyper', action: '', next: 'gaze-dependence' },
          { label: 'Combined', action: '', next: 'gaze-dependence' },
        ],
      },
      {
        kind: 'question',
        id: 'gaze-dependence',
        shortLabel: 'Gaze-dependent?',
        question: 'Does the deviation change with gaze direction?',
        outcomes: [
          {
            label: 'Yes',
            secondaryLabel: 'incomitant',
            infoTerm: 'incomitant',
            action:
              'Gaze-dependent deviation can make permanent prism management less straightforward. Consider further assessment/referral according to the overall presentation.',
            testIds: ['parks-3-step', 'double-maddox-rod'],
          },
          { label: 'No', secondaryLabel: 'comitant', infoTerm: 'comitant', action: '', next: 'sensory-check' },
          { label: 'Not sure', action: '', next: 'gaze-instruction' },
        ],
      },
      {
        kind: 'question',
        id: 'gaze-instruction',
        shortLabel: 'Check gaze positions',
        question: 'Compare alignment in primary, right, left, up and down gaze.',
        outcomes: [{ label: 'Continue', action: '', next: 'gaze-dependence' }],
      },

      // Optional sensory check — reached whenever there's no confirmed deviation to
      // characterize (symptomatic-now: Yes) or once a deviation is confirmed comitant.
      {
        kind: 'question',
        id: 'sensory-check',
        shortLabel: 'Sensory status',
        question: 'Check sensory status? (optional)',
        testIds: ['worth-4-dot'],
        outcomes: [
          { label: 'Fusion', action: '', next: 'measure' },
          { label: 'Suppression OD', action: '', next: 'sensory-suppression-note' },
          { label: 'Suppression OS', action: '', next: 'sensory-suppression-note' },
          { label: 'Diplopia', action: '', next: 'measure' },
          { label: 'Skip', action: '', next: 'measure' },
        ],
      },
      {
        kind: 'question',
        id: 'sensory-suppression-note',
        shortLabel: 'Suppression noted',
        question: 'Prism may relieve symptomatic diplopia but is unlikely to restore fusion while suppression persists.',
        outcomes: [{ label: 'Continue', action: '', next: 'measure' }],
      },

      // MEASURE
      {
        kind: 'question',
        id: 'measure',
        shortLabel: 'Measure',
        question: 'Measure deviation.',
        testIds: ['schober-test', 'maddox-rod'],
        outcomes: [{ label: 'Enter measurement', action: '', next: 'record-measurement' }],
      },
      {
        kind: 'measurement',
        id: 'record-measurement',
        question: 'Record measurement.',
        next: 'trial',
      },

      // TRIAL PRISM
      {
        kind: 'question',
        id: 'trial',
        shortLabel: 'Trial prism',
        question: 'With best correction + trial prism:',
        instruction: 'Place the proposed prism in a trial frame together with the patient’s best correction.',
        showMeasurement: true,
        outcomes: [
          {
            label: 'Single comfortable vision',
            action: 'Trial successful.',
            seeAlso: ['diplopia-prism-prescribing'],
          },
          { label: 'Improved but not fully comfortable', action: '', next: 'record-measurement' },
          {
            label: 'No meaningful improvement',
            action: 'Prism trial unsuccessful — reassess / further assessment as appropriate.',
          },
        ],
      },
    ],
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
