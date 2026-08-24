import { NO_BLUR_VALUE } from './binocularFindings';

/**
 * Clinical pathways: symptom/problem-first navigation into the canonical
 * test cards in clinicalTests.ts. A node is either a branch (more choices)
 * or a leaf (guidance + relevant tests, referenced by id — never duplicated).
 *
 * A leaf's `steps` form a small step graph — one question/action shown at a
 * time (see PathwayWizard), not an article. Kinds of step:
 *   - 'question': a question with tappable DecisionOutcomes. Each outcome
 *     either points to another step via `next`, or — with `next` omitted —
 *     ends the flow at that outcome's `action` (a real clinical endpoint,
 *     e.g. "refer" or "trial unsuccessful", not just "ran out of tree").
 *     An outcome can also tag a `recordAs` finding (key/value) that later
 *     steps can read back — see consistencyCheck below.
 *   - 'measurement': a structured prism entry (amount + base, + eye where
 *     relevant), not a tap choice — see PrismMeasurement. `target` picks
 *     which measurement this writes to: 'proposed' (default) is the prism
 *     being determined by the shared Measure -> Trial flow below; 'existing'
 *     is a one-off recording (e.g. what's already in the patient's glasses)
 *     that never feeds the Trial step, so it can't be confused with it.
 *     `consistencyCheck` cross-checks the entered value against an earlier
 *     recorded finding (see domain/reference/consistencyChecks.ts) and, on
 *     a mismatch, shows a non-blocking warning before continuing.
 *   - 'text-entry': one or more short free-text fields (e.g. VA per eye),
 *     recorded as context — never used as a branching decision.
 *   - 'rx-entry': the patient's best refractive correction (SPH/CYL/AXIS
 *     per eye), entered before a prism trial — see BestCorrection.
 *   - 'final-rx': always terminal. Shows the measured/trialled prism, an
 *     equal/balanced split between the two lenses (Prism Prescribing
 *     Guidance's own reasoning, reused inline — see PRISM_DISTRIBUTION_NOTES),
 *     and the resulting Final Rx per eye (best correction + assigned prism).
 *   - 'symptom-select': a multi-select symptom checklist (Binocular Status),
 *     recorded as one comma-joined `recordedFindings` entry — see
 *     binocularFindings.ts for the parser this feeds.
 *   - 'quick-screen-result': the Quick Screen checkpoint (Binocular Status
 *     only) — shown with Continue/Finish when entered via Quick Screen;
 *     PathwayWizard skips it transparently (no history entry) when entered
 *     directly via Full Assessment, so Back/breadcrumb behave as if it never
 *     existed for that path.
 *   - 'optional-tests-menu': a loop-back menu of optional/targeted tests
 *     (same loop pattern as Diplopia's gaze-instruction step) — never
 *     mandatory, always skippable.
 *   - 'binocular-summary': always terminal. Runs the pattern-interpretation
 *     engine (binocularPatterns.ts) over the recorded findings and shows the
 *     actual measurements alongside the interpretation, never labels alone.
 * This keeps the workflow to HISTORY -> EXAMINE -> MEASURE -> CONSISTENCY
 * CHECK -> BEST CORRECTION -> TRIAL PRISM -> PRESCRIBE/FURTHER ASSESSMENT,
 * matching how the exam actually happens, rather than a differential-
 * diagnosis tree.
 *
 * Measure -> Trial Prism -> Final Rx (sharedPrismSteps below) is defined
 * once and reused verbatim by every pathway that reaches a point where a
 * measured deviation needs trialling before prescribing (Diplopia,
 * Strabismus) — the same Test Cards, the same questions, one source of
 * truth, not a copy per guide.
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
  /** Overrides the alert's default "Urgent assessment may be indicated" title — for a caution that isn't itself an emergency (e.g. "use the Diplopia pathway instead"). */
  redFlagTitle?: string;
  /** Glossary term (see glossary.ts) explaining this option's wording, surfaced via a tap-to-reveal "?". */
  infoTerm?: string;
  /** Pathway node(s) worth linking to once this outcome ends the flow. */
  seeAlso?: string[];
  /** Id of the next DecisionStep within the same node. Omit to end the flow at this outcome. */
  next?: string;
  /** Tags this finding for later cross-checks (e.g. { key: 'horizontalDirection', value: 'eso' }) — see MeasurementStep.consistencyCheck. */
  recordAs?: { key: string; value: string };
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
  /** Show the currently recorded proposed PrismMeasurement above the question (e.g. at the trial step). */
  showMeasurement?: boolean;
  /** Show the currently recorded best-correction Rx above the question (e.g. at the trial step). */
  showBestCorrection?: boolean;
  /** Test(s) relevant to this question, if any (e.g. the cover test itself) — shown as reference chip(s) before the choices. */
  testIds?: string[];
  /** Label above testIds, e.g. "Additional tests (optional)" — omit for a primary "perform this now" chip. */
  testIdsLabel?: string;
  outcomes: DecisionOutcome[];
}

/** A structured prism-measurement entry point — not a tap choice, see PrismMeasurement. */
export interface MeasurementStep {
  kind: 'measurement';
  id: string;
  question: string;
  /** 'proposed' (default) feeds the shared Trial step; 'existing' is a one-off record that doesn't. */
  target?: 'proposed' | 'existing';
  /** Cross-check this measurement against an earlier recorded finding (see consistencyChecks.ts) before continuing. */
  consistencyCheck?: { findingKey: string; recheckStepId: string };
  /** Id of the step to continue to once a measurement is recorded. */
  next: string;
}

/** One free-text field within a TextEntryStep, e.g. { key: 'OD', label: 'OD' }. */
export interface TextEntryField {
  key: string;
  label: string;
  /** Must be filled (or satisfied via `absentOption`) before Continue is enabled — for clinically necessary results only, never context fields like age. */
  required?: boolean;
  /**
   * Lets this field be satisfied by an explicit non-numeric clinical result instead of forcing a
   * fake number — e.g. fusional vergence blur may genuinely never be reached. Rendered as a small
   * toggle; when set, the field's recorded value becomes `value` (see NO_BLUR_VALUE) rather than a
   * number, and the numeric input is disabled.
   */
  absentOption?: { label: string; value: string };
}

/** A short free-text recording point (e.g. best-corrected VA per eye) — context only, never a branch. */
export interface TextEntryStep {
  kind: 'text-entry';
  id: string;
  question: string;
  fields: TextEntryField[];
  /** Purely a rendering hint that reorganizes `fields` into labeled visual sections (e.g. "BI"/"BO") — `fields` above stays the source of truth for values. */
  groups?: { label: string; keys: string[] }[];
  /** Short caption shown below the fields, e.g. noting any notation is fine. */
  helperText?: string;
  /** Test(s) relevant to this entry, if any — shown as reference chip(s) before the fields. */
  testIds?: string[];
  /**
   * True for an optional/targeted test the clinician may decline entirely (e.g. reached from the
   * optional-tests menu) — offers an explicit "Skip test" action that discards whatever was typed
   * and jumps straight to `next` without recording anything. Never set on core screening steps:
   * those block on missing required fields instead, with no way around them.
   */
  skippable?: boolean;
  /** Id of the step to continue to once submitted. */
  next: string;
}

/** One symptom checkbox option within a SymptomSelectStep. */
export interface SymptomOption {
  key: string;
  label: string;
}

/** A multi-select symptom checklist — recorded as a single comma-joined `recordedFindings` entry, never a branch by itself. */
export interface SymptomSelectStep {
  kind: 'symptom-select';
  id: string;
  question: string;
  options: SymptomOption[];
  /** recordedFindings key the comma-joined selection is written to (e.g. 'symptoms') — see binocularFindings.ts. */
  recordAsKey: string;
  /** Selecting this option key clears every other selection (e.g. "No symptoms"). */
  exclusiveKey?: string;
  /** Default step to continue to once submitted. */
  next: string;
  /** If this specific option key is among the selections, route here instead of `next` (e.g. diplopia -> a follow-up question) — both eventually converge back to the same place. */
  branchOnKey?: { key: string; next: string };
}

/**
 * The Quick Screen checkpoint — always reached after the shared screening
 * steps, regardless of entry point. When entered via "Full Assessment"
 * directly, PathwayWizard skips it transparently (no diagnosis-adjacent
 * gate shown); when entered via "Quick Screen", it shows the recommendation
 * (see binocularQuickScreen.ts) with Continue/Finish actions.
 */
export interface QuickScreenResultStep {
  kind: 'quick-screen-result';
  id: string;
  /** Step id to continue to for the Full Assessment. */
  continueNext: string;
  /** Step id to jump to when the clinician ends the assessment here (interpretation still runs on whatever core data was gathered). */
  finishNext: string;
}

/** One entry in an OptionalTestsMenuStep. */
export interface OptionalTestOption {
  label: string;
  /** Step id to navigate to when chosen; that step's own `next` should point back to this same menu step. */
  stepId: string;
}

/** A loop-back menu of optional/targeted tests (same loop pattern as Diplopia's gaze-instruction step) — never mandatory, always skippable. */
export interface OptionalTestsMenuStep {
  kind: 'optional-tests-menu';
  id: string;
  options: OptionalTestOption[];
  /** Step id to continue to once done with optional testing. */
  skipNext: string;
}

/** Always terminal: runs the pattern-interpretation engine (binocularPatterns.ts) over the recorded findings. */
export interface BinocularSummaryStep {
  kind: 'binocular-summary';
  id: string;
}

/** The patient's best refractive correction (SPH/CYL/AXIS per eye) — see BestCorrection. */
export interface RxEntryStep {
  kind: 'rx-entry';
  id: string;
  question: string;
  /** Id of the step to continue to once submitted. */
  next: string;
}

/** Always terminal: measured/trialled prism, an equal split between the eyes, and the resulting Final Rx. */
export interface FinalRxStep {
  kind: 'final-rx';
  id: string;
}

export type DecisionStep =
  | QuestionStep
  | MeasurementStep
  | TextEntryStep
  | RxEntryStep
  | FinalRxStep
  | SymptomSelectStep
  | QuickScreenResultStep
  | OptionalTestsMenuStep
  | BinocularSummaryStep;

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

/**
 * The equal/balanced-split reasoning, shared verbatim between the standalone Prism
 * Prescribing Guidance leaf and the inline Final Rx step so a clinician sees the exact same
 * explanation regardless of where they reach it from.
 */
export const PRISM_DISTRIBUTION_NOTES: string[] = [
  'Horizontal: split between the eyes on the same base direction. E.g. 6Δ BO → 3Δ BO OD + 3Δ BO OS.',
  'Vertical: split with opposite base directions between the eyes. E.g. 6Δ BU OS → 3Δ BD OD + 3Δ BU OS.',
  'Combined H+V: split each component separately. E.g. 6Δ BO OD + 6Δ BU OS → OD: 3Δ BO + 3Δ BD; OS: 3Δ BO + 3Δ BU.',
  'This is an equal/balanced split, not necessarily the optimal lens thickness — that depends on the full Rx, frame, lens design/material, and lab implementation.',
];

/**
 * Measure -> Trial Prism -> Final Rx, shared verbatim by every pathway that reaches a point
 * where a measured deviation needs trialling before prescribing. Appended to the end of a
 * node's `steps` array; whatever leads into it should set its outcome's `next` to
 * 'best-correction'.
 */
const sharedPrismSteps: DecisionStep[] = [
  {
    kind: 'rx-entry',
    id: 'best-correction',
    question: "Patient's best correction",
    next: 'measure',
  },
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
    consistencyCheck: { findingKey: 'horizontalDirection', recheckStepId: 'cover-test' },
    next: 'trial',
  },
  {
    kind: 'question',
    id: 'trial',
    shortLabel: 'Trial prism',
    question: 'With best correction + trial prism:',
    instruction: 'Place the proposed prism in a trial frame together with the patient’s best correction.',
    showMeasurement: true,
    showBestCorrection: true,
    outcomes: [
      {
        label: 'Single comfortable vision',
        action: '',
        next: 'final-rx',
      },
      { label: 'Improved but not fully comfortable', action: '', next: 'record-measurement' },
      {
        label: 'No meaningful improvement',
        action: 'Prism trial unsuccessful — reassess / further assessment as appropriate.',
      },
    ],
  },
  {
    kind: 'final-rx',
    id: 'final-rx',
  },
];

/**
 * Binocular Status's symptom checklist — keys match SYMPTOM_LABELS in
 * binocularQuickScreen.ts exactly, since both read/write the same
 * `recordedFindings.symptoms` comma-joined set.
 */
const BINOCULAR_SYMPTOM_OPTIONS: SymptomOption[] = [
  { key: 'nearStrain', label: 'Eye strain / fatigue at near' },
  { key: 'headache', label: 'Headache with visual work' },
  { key: 'nearBlur', label: 'Blur at near' },
  { key: 'distanceBlur', label: 'Blur at distance' },
  { key: 'slowRefocusNearToDistance', label: 'Slow refocusing near → distance' },
  { key: 'slowRefocusDistanceToNear', label: 'Slow refocusing distance → near' },
  { key: 'readingDifficulty', label: 'Reading difficulty / losing place' },
  { key: 'diplopia', label: 'Intermittent diplopia' },
  { key: 'none', label: 'No symptoms' },
];

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
          { label: 'Eso', action: '', next: 'gaze-dependence', recordAs: { key: 'horizontalDirection', value: 'eso' } },
          { label: 'Exo', action: '', next: 'gaze-dependence', recordAs: { key: 'horizontalDirection', value: 'exo' } },
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
          { label: 'Fusion', action: '', next: 'best-correction' },
          { label: 'Suppression OD', action: '', next: 'sensory-suppression-note' },
          { label: 'Suppression OS', action: '', next: 'sensory-suppression-note' },
          { label: 'Diplopia', action: '', next: 'best-correction' },
          { label: 'Skip', action: '', next: 'best-correction' },
        ],
      },
      {
        kind: 'question',
        id: 'sensory-suppression-note',
        shortLabel: 'Suppression noted',
        question: 'Prism may relieve symptomatic diplopia but is unlikely to restore fusion while suppression persists.',
        outcomes: [{ label: 'Continue', action: '', next: 'best-correction' }],
      },

      ...sharedPrismSteps,
    ],
  },
  {
    id: 'strabismus',
    title: 'Strabismus',
    kind: 'leaf',
    overview: 'History -> Examine -> Sensory status -> Measure -> Trial prism -> Prescribe or further assessment. Strabismus, fusion, and suppression do not by themselves lead to prism — a symptomatic binocular problem does.',
    steps: [
      // HISTORY
      {
        kind: 'question',
        id: 'onset',
        shortLabel: 'Onset',
        question: 'New/recent or long-standing?',
        outcomes: [
          { label: 'New/recent', action: '', next: 'diplopia-check-new' },
          { label: 'Long-standing', action: '', next: 'diplopia-check-longstanding' },
        ],
      },
      {
        kind: 'question',
        id: 'diplopia-check-new',
        shortLabel: 'Diplopia?',
        question: 'Diplopia?',
        outcomes: [
          {
            label: 'Yes',
            action: '',
            redFlag: 'New/recent strabismus with diplopia — consider urgent medical/neuro-ophthalmic assessment.',
            next: 'va',
          },
          {
            label: 'Sometimes',
            action: '',
            redFlag: 'New/recent strabismus with diplopia — consider urgent medical/neuro-ophthalmic assessment.',
            next: 'va',
          },
          { label: 'No', action: '', next: 'va' },
        ],
      },
      {
        kind: 'question',
        id: 'diplopia-check-longstanding',
        shortLabel: 'Diplopia?',
        question: 'Diplopia?',
        outcomes: [
          { label: 'Yes', action: '', next: 'va' },
          { label: 'Sometimes', action: '', next: 'va' },
          { label: 'No', action: '', next: 'va' },
        ],
      },
      {
        kind: 'text-entry',
        id: 'va',
        question: 'Best-corrected VA',
        fields: [
          { key: 'OD', label: 'OD' },
          { key: 'OS', label: 'OS' },
        ],
        helperText: 'Any notation.',
        next: 'which-eye',
      },
      {
        kind: 'question',
        id: 'which-eye',
        shortLabel: 'Which eye deviates',
        question: 'Which eye deviates?',
        outcomes: [
          { label: 'OD', action: '', next: 'prior-prism' },
          { label: 'OS', action: '', next: 'prior-prism' },
          { label: 'Alternating', action: '', next: 'prior-prism' },
        ],
      },
      {
        kind: 'question',
        id: 'prior-prism',
        shortLabel: 'Prior prism?',
        question: 'Current glasses contain prism?',
        outcomes: [
          { label: 'Yes', action: '', next: 'prior-prism-measurement' },
          { label: 'No', action: '', next: 'cover-test' },
        ],
      },
      {
        kind: 'measurement',
        id: 'prior-prism-measurement',
        question: 'Record the existing prism.',
        target: 'existing',
        next: 'prior-prism-comfort',
      },
      {
        kind: 'question',
        id: 'prior-prism-comfort',
        shortLabel: 'Comfortable?',
        question: 'Comfortable with the current prism?',
        outcomes: [
          { label: 'Yes', action: '', next: 'cover-test' },
          { label: 'No', action: '', next: 'cover-test' },
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
          { label: 'Eso', action: '', next: 'gaze-dependence', recordAs: { key: 'horizontalDirection', value: 'eso' } },
          { label: 'Exo', action: '', next: 'gaze-dependence', recordAs: { key: 'horizontalDirection', value: 'exo' } },
          { label: 'Vertical', action: '', next: 'gaze-dependence' },
          { label: 'Combined', action: '', next: 'gaze-dependence' },
          {
            label: 'No clear deviation',
            action: 'Deviation not clearly demonstrated today — reassess when manifest/symptomatic as appropriate.',
          },
          {
            label: 'Not sure',
            action: 'Deviation not clearly demonstrated today — reassess when manifest/symptomatic as appropriate.',
          },
        ],
      },
      {
        kind: 'question',
        id: 'gaze-dependence',
        shortLabel: 'Gaze-dependent?',
        question: 'Does the deviation change with gaze direction?',
        outcomes: [
          { label: 'Yes', secondaryLabel: 'incomitant', infoTerm: 'incomitant', action: '', next: 'gaze-caution' },
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
      {
        kind: 'question',
        id: 'gaze-caution',
        shortLabel: 'Gaze-dependent noted',
        question:
          "One fixed prism may not work equally well in every gaze position. Trial for the patient's relevant functional viewing position (e.g. primary gaze), and verify comfort/single vision before prescribing.",
        testIds: ['parks-3-step', 'double-maddox-rod'],
        testIdsLabel: 'Additional tests (optional)',
        outcomes: [{ label: 'Continue', action: '', next: 'sensory-check' }],
      },

      // SENSORY
      {
        kind: 'question',
        id: 'sensory-check',
        shortLabel: 'Sensory status',
        question: 'Worth 4 Dot result?',
        instruction: 'Check sensory status.',
        testIds: ['worth-4-dot'],
        outcomes: [
          { label: 'Fusion', action: '', next: 'symptom-check' },
          { label: 'Suppression OD', action: '', next: 'symptom-check' },
          { label: 'Suppression OS', action: '', next: 'symptom-check' },
          { label: 'Diplopia', action: '', next: 'symptom-check' },
        ],
      },
      {
        kind: 'question',
        id: 'symptom-check',
        shortLabel: 'Diplopia now?',
        question: 'Does the patient currently experience diplopia?',
        outcomes: [
          { label: 'Yes', action: '', next: 'best-correction' },
          { label: 'Sometimes', action: '', next: 'best-correction' },
          {
            label: 'No',
            action: 'No current diplopia — prism is not indicated based on sensory testing alone. Continue routine management; reassess if symptoms change.',
          },
        ],
      },

      ...sharedPrismSteps,
    ],
  },
  {
    id: 'binocular-status',
    title: 'Binocular Status',
    kind: 'leaf',
    overview:
      'Quick Screen flags whether a fuller workup is warranted; Full Assessment characterizes the finding. Each pattern below (Convergence Insufficiency, Fusional Vergence Dysfunction, Accommodative Infacility, etc.) has its own required/supporting findings — no single value creates a diagnosis.',
    steps: [
      // ENTRY
      {
        kind: 'question',
        id: 'entry',
        shortLabel: 'Entry',
        question: 'How would you like to proceed?',
        outcomes: [
          { label: 'Quick Screen', action: '', next: 'age', recordAs: { key: 'entryMode', value: 'quick' } },
          { label: 'Full Assessment', action: '', next: 'age', recordAs: { key: 'entryMode', value: 'full' } },
        ],
      },
      {
        kind: 'text-entry',
        id: 'age',
        question: 'Patient age',
        fields: [{ key: 'age.value', label: 'Age (years)' }],
        helperText: 'Used only for the accommodative-amplitude age-expected minimum.',
        next: 'symptoms',
      },
      {
        kind: 'symptom-select',
        id: 'symptoms',
        question: 'Symptoms (select all that apply)',
        options: BINOCULAR_SYMPTOM_OPTIONS,
        recordAsKey: 'symptoms',
        exclusiveKey: 'none',
        next: 'distance-phoria-type',
        branchOnKey: { key: 'diplopia', next: 'diplopia-new-check' },
      },
      {
        kind: 'question',
        id: 'diplopia-new-check',
        shortLabel: 'Diplopia new?',
        question: 'Is the diplopia new or recent?',
        outcomes: [
          {
            label: 'Yes',
            action: '',
            recordAs: { key: 'diplopiaNew', value: 'yes' },
            redFlag: 'New/recent diplopia is better characterized by the Diplopia pathway (onset, red flags, direction, gaze-dependence) than by Binocular Status.',
            redFlagTitle: 'Consider the Diplopia pathway',
            seeAlso: ['diplopia'],
            next: 'distance-phoria-type',
          },
          { label: 'No', action: '', recordAs: { key: 'diplopiaNew', value: 'no' }, next: 'distance-phoria-type' },
        ],
      },

      // CORE SCREENING (shared by Quick Screen and Full Assessment)
      {
        kind: 'question',
        id: 'distance-phoria-type',
        shortLabel: 'Distance phoria',
        question: 'Distance phoria (cover test / Maddox rod)?',
        testIds: ['cover-test', 'maddox-rod'],
        outcomes: [
          { label: 'Ortho', action: '', next: 'near-phoria-type', recordAs: { key: 'distancePhoria.type', value: 'ortho' } },
          { label: 'Exo', action: '', next: 'distance-phoria-amount', recordAs: { key: 'distancePhoria.type', value: 'exo' } },
          { label: 'Eso', action: '', next: 'distance-phoria-amount', recordAs: { key: 'distancePhoria.type', value: 'eso' } },
        ],
      },
      {
        kind: 'text-entry',
        id: 'distance-phoria-amount',
        question: 'Distance phoria amount',
        fields: [{ key: 'distancePhoria.amount', label: 'Amount (Δ)', required: true }],
        next: 'near-phoria-type',
      },
      {
        kind: 'question',
        id: 'near-phoria-type',
        shortLabel: 'Near phoria',
        question: 'Near phoria (cover test / Maddox rod)?',
        testIds: ['cover-test', 'maddox-rod'],
        outcomes: [
          { label: 'Ortho', action: '', next: 'npc', recordAs: { key: 'nearPhoria.type', value: 'ortho' } },
          { label: 'Exo', action: '', next: 'near-phoria-amount', recordAs: { key: 'nearPhoria.type', value: 'exo' } },
          { label: 'Eso', action: '', next: 'near-phoria-amount', recordAs: { key: 'nearPhoria.type', value: 'eso' } },
        ],
      },
      {
        kind: 'text-entry',
        id: 'near-phoria-amount',
        question: 'Near phoria amount',
        fields: [{ key: 'nearPhoria.amount', label: 'Amount (Δ)', required: true }],
        next: 'npc',
      },
      {
        kind: 'text-entry',
        id: 'npc',
        question: 'Near Point of Convergence',
        fields: [
          { key: 'npc.break', label: 'Break (cm)', required: true },
          { key: 'npc.recovery', label: 'Recovery (cm)', required: true },
        ],
        testIds: ['npc-test'],
        next: 'maf-cycles',
      },
      {
        kind: 'text-entry',
        id: 'maf-cycles',
        question: 'Monocular Accommodative Facility',
        fields: [
          { key: 'maf.OD', label: 'OD (cycles/min)', required: true },
          { key: 'maf.OS', label: 'OS (cycles/min)', required: true },
        ],
        testIds: ['monocular-accommodative-facility-test'],
        next: 'maf-difficulty',
      },
      {
        kind: 'question',
        id: 'maf-difficulty',
        shortLabel: 'MAF difficulty',
        question: 'Which side was difficult to clear, if any?',
        outcomes: [
          { label: 'Minus lenses', action: '', next: 'quick-screen-result', recordAs: { key: 'maf.difficulty', value: 'minus' } },
          { label: 'Plus lenses', action: '', next: 'quick-screen-result', recordAs: { key: 'maf.difficulty', value: 'plus' } },
          { label: 'Both', action: '', next: 'quick-screen-result', recordAs: { key: 'maf.difficulty', value: 'both' } },
          { label: 'Neither', action: '', next: 'quick-screen-result', recordAs: { key: 'maf.difficulty', value: 'neither' } },
        ],
      },

      // QUICK SCREEN CHECKPOINT
      {
        kind: 'quick-screen-result',
        id: 'quick-screen-result',
        continueNext: 'near-vergence',
        finishNext: 'binocular-summary',
      },

      // FULL ASSESSMENT
      {
        kind: 'text-entry',
        id: 'near-vergence',
        question: 'Near Fusional Vergence Ranges',
        fields: [
          { key: 'nearVergence.bi.blur', label: 'Blur', required: true, absentOption: { label: 'No blur', value: NO_BLUR_VALUE } },
          { key: 'nearVergence.bi.break', label: 'Break', required: true },
          { key: 'nearVergence.bi.recovery', label: 'Recovery', required: true },
          { key: 'nearVergence.bo.blur', label: 'Blur', required: true, absentOption: { label: 'No blur', value: NO_BLUR_VALUE } },
          { key: 'nearVergence.bo.break', label: 'Break', required: true },
          { key: 'nearVergence.bo.recovery', label: 'Recovery', required: true },
        ],
        groups: [
          { label: 'BI', keys: ['nearVergence.bi.blur', 'nearVergence.bi.break', 'nearVergence.bi.recovery'] },
          { label: 'BO', keys: ['nearVergence.bo.blur', 'nearVergence.bo.break', 'nearVergence.bo.recovery'] },
        ],
        helperText: 'Δ. Use "No blur" if no blur point was found.',
        testIds: ['fusional-vergence-test'],
        next: 'aa',
      },
      {
        kind: 'text-entry',
        id: 'aa',
        question: 'Amplitude of Accommodation',
        fields: [
          { key: 'aa.OD', label: 'OD (D)', required: true },
          { key: 'aa.OS', label: 'OS (D)', required: true },
        ],
        testIds: ['amplitude-of-accommodation-test'],
        next: 'baf-cycles',
      },
      {
        kind: 'text-entry',
        id: 'baf-cycles',
        question: 'Binocular Accommodative Facility',
        fields: [{ key: 'baf.cyclesPerMin', label: 'Cycles/min', required: true }],
        testIds: ['binocular-accommodative-facility-test'],
        next: 'baf-difficulty',
      },
      {
        kind: 'question',
        id: 'baf-difficulty',
        shortLabel: 'BAF difficulty',
        question: 'Which side was difficult to clear, if any?',
        outcomes: [
          { label: 'Minus lenses', action: '', next: 'optional-menu', recordAs: { key: 'baf.difficulty', value: 'minus' } },
          { label: 'Plus lenses', action: '', next: 'optional-menu', recordAs: { key: 'baf.difficulty', value: 'plus' } },
          { label: 'Both', action: '', next: 'optional-menu', recordAs: { key: 'baf.difficulty', value: 'both' } },
          { label: 'Neither', action: '', next: 'optional-menu', recordAs: { key: 'baf.difficulty', value: 'neither' } },
        ],
      },

      // OPTIONAL / TARGETED TESTS
      {
        kind: 'optional-tests-menu',
        id: 'optional-menu',
        options: [
          { label: 'Distance Fusional Vergence', stepId: 'distance-vergence' },
          { label: 'Gradient AC/A', stepId: 'aca-gradient' },
          { label: 'NRA / PRA', stepId: 'nra-pra' },
          { label: 'Vergence Facility', stepId: 'vergence-facility-gate' },
          { label: 'MEM / Nott Retinoscopy', stepId: 'mem-nott' },
          { label: 'Stereoacuity', stepId: 'stereoacuity' },
        ],
        skipNext: 'binocular-summary',
      },
      {
        kind: 'text-entry',
        id: 'distance-vergence',
        question: 'Distance Fusional Vergence Ranges',
        fields: [
          { key: 'distanceVergence.bi.blur', label: 'Blur', required: true, absentOption: { label: 'No blur', value: NO_BLUR_VALUE } },
          { key: 'distanceVergence.bi.break', label: 'Break', required: true },
          { key: 'distanceVergence.bi.recovery', label: 'Recovery', required: true },
          { key: 'distanceVergence.bo.blur', label: 'Blur', required: true, absentOption: { label: 'No blur', value: NO_BLUR_VALUE } },
          { key: 'distanceVergence.bo.break', label: 'Break', required: true },
          { key: 'distanceVergence.bo.recovery', label: 'Recovery', required: true },
        ],
        groups: [
          { label: 'BI', keys: ['distanceVergence.bi.blur', 'distanceVergence.bi.break', 'distanceVergence.bi.recovery'] },
          { label: 'BO', keys: ['distanceVergence.bo.blur', 'distanceVergence.bo.break', 'distanceVergence.bo.recovery'] },
        ],
        helperText: 'Δ. Use "No blur" if no blur point was found.',
        testIds: ['fusional-vergence-test'],
        skippable: true,
        next: 'optional-menu',
      },
      {
        kind: 'text-entry',
        id: 'aca-gradient',
        question: 'Gradient AC/A',
        fields: [{ key: 'acaGradient.value', label: 'Ratio (Δ/D)', required: true }],
        testIds: ['gradient-aca-test'],
        skippable: true,
        next: 'optional-menu',
      },
      {
        kind: 'text-entry',
        id: 'nra-pra',
        question: 'NRA / PRA',
        fields: [
          { key: 'nra.value', label: 'NRA (+D)', required: true },
          { key: 'pra.value', label: 'PRA (−D)', required: true },
        ],
        testIds: ['nra-pra-test'],
        skippable: true,
        next: 'optional-menu',
      },
      {
        kind: 'question',
        id: 'vergence-facility-gate',
        shortLabel: 'Prism flippers?',
        question: 'Prism flippers available?',
        outcomes: [
          { label: 'Yes', action: '', next: 'vergence-facility' },
          { label: 'No', action: '', next: 'optional-menu', recordAs: { key: 'vergenceFacility.status', value: 'unavailable' } },
        ],
      },
      {
        kind: 'text-entry',
        id: 'vergence-facility',
        question: 'Vergence Facility',
        fields: [{ key: 'vergenceFacility.cyclesPerMin', label: 'Cycles/min', required: true }],
        testIds: ['vergence-facility-test'],
        skippable: true,
        next: 'optional-menu',
      },
      {
        kind: 'text-entry',
        id: 'mem-nott',
        question: 'MEM / Nott Dynamic Retinoscopy',
        fields: [{ key: 'memNott.value', label: 'Finding', required: true }],
        helperText: 'e.g. "+0.50 lag OU" or "plano".',
        testIds: ['mem-retinoscopy-test', 'nott-retinoscopy-test'],
        skippable: true,
        next: 'optional-menu',
      },
      {
        kind: 'text-entry',
        id: 'stereoacuity',
        question: 'Stereoacuity',
        fields: [{ key: 'stereoacuity.value', label: 'Finding', required: true }],
        helperText: 'e.g. "40 arc sec".',
        testIds: ['stereoacuity-test'],
        skippable: true,
        next: 'optional-menu',
      },

      // SUMMARY
      {
        kind: 'binocular-summary',
        id: 'binocular-summary',
      },
    ],
  },
  {
    id: 'prism-prescribing',
    title: 'Prism Prescribing Guidance',
    kind: 'leaf',
    overview: 'Once prism is measured, decide how to split it into the final Rx. A distribution reminder to avoid base-direction mistakes — not a calculator.',
    keySteps: PRISM_DISTRIBUTION_NOTES,
  },
];

export function getPathwayNode(id: string): ClinicalPathwayNode | undefined {
  return clinicalPathways.find((node) => node.id === id);
}
