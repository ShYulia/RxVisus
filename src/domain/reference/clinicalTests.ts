/**
 * Canonical clinical test cards. Each test exists exactly once here and is
 * referenced (never duplicated) by clinical pathways via testIds — see
 * clinicalPathways.ts.
 *
 * Content is a reasonable starting draft, not yet clinically validated by
 * the intended real-world user — treat it the same way the calculators were
 * treated before shipping: check it against real clinical judgment first.
 */
export interface ClinicalTest {
  id: string;
  title: string;
  tags: string[];
  purpose: string;
  setup: string[];
  howTo: string[];
  whatToWatch: string[];
  record: string[];
  quickTip?: string;
  commonMistakes?: string[];
}

export const clinicalTests: ClinicalTest[] = [
  {
    id: 'cover-test',
    title: 'Cover Test',
    tags: ['diplopia', 'strabismus', 'binocular', 'alignment'],
    purpose: 'Detect and classify a manifest (tropia) or latent (phoria) deviation.',
    setup: ['Patient fixates a target at 6 m and again at 33-40 cm.', 'Room lit normally — do not dim for this test.'],
    howTo: [
      'Cover one eye and watch the UNCOVERED eye for a refixation movement.',
      'Uncover and watch the just-uncovered eye for any recovery movement.',
      'Repeat for the other eye, then alternate cover between the two eyes (alternate cover test) to reveal the total deviation.',
    ],
    whatToWatch: [
      'Direction of any refixation movement (in/out/up/down) on the uncovered eye — this is the tropia.',
      'Recovery movement on uncover — reveals a phoria.',
      'Speed and consistency of recovery.',
    ],
    record: ['Distance and near findings separately.', 'Direction and rough magnitude, e.g. "small exo phoria at near".'],
    quickTip: 'Do cover-uncover before alternate cover — alternating first can mask a small phoria.',
    commonMistakes: ['Covering too briefly to allow a full refixation.', 'Letting the patient peek around the occluder.'],
  },
  {
    id: 'maddox-rod',
    title: 'Maddox Rod',
    tags: ['diplopia', 'binocular', 'phoria'],
    purpose: 'Dissociate the eyes to measure a horizontal or vertical phoria.',
    setup: [
      'Maddox rod in trial frame or phoropter over one eye (grooves horizontal for a vertical line, vertical for a horizontal line).',
      'Muscle light or pen light as the fixation target, dimmed room.',
    ],
    howTo: [
      'Patient views the light through the rod — it appears as a streak, seen only by the rod eye.',
      'Ask whether the streak passes through the light or is offset, and in which direction.',
      'Neutralize the offset with prism to quantify the deviation.',
    ],
    whatToWatch: ['Whether the streak is broken or the patient loses fusion entirely (suppression).'],
    record: ['Streak orientation used and the neutralizing prism (base and amount) if measured.'],
    quickTip: 'A red Maddox rod over one eye is enough for most single-plane checks — reserve double Maddox for torsion.',
  },
  {
    id: 'double-maddox-rod',
    title: 'Double Maddox Rod',
    tags: ['diplopia', 'vertical', 'torsion', 'binocular'],
    purpose: 'Measure cyclotorsion (excyclo/incyclo) — most useful when a vertical deviation does not fully explain the symptoms.',
    setup: [
      'One red and one white Maddox rod, both grooves vertical (horizontal streaks), one over each eye.',
      'Single muscle light target, dim room.',
    ],
    howTo: [
      'Patient sees two horizontal streaks (one red, one white) and reports whether they are parallel or tilted relative to each other.',
      'Rotate the axis of each rod until the patient reports the streaks as parallel.',
      'Read the torsion directly off the trial-frame axis scale for each eye.',
    ],
    whatToWatch: ['Whether the tilt is the same in both eyes (comitant) or differs by gaze position.'],
    record: ['Degrees of excyclotorsion or incyclotorsion, per eye.'],
    quickTip: 'Excyclotorsion in a hypertropic eye is a classic superior oblique palsy sign — worth checking whenever vertical diplopia does not add up.',
    commonMistakes: ['Forgetting to check torsion in multiple gaze positions when the history suggests a variable deviation.'],
  },
  {
    id: 'hess-lancaster',
    title: 'Hess / Lancaster Screen',
    tags: ['diplopia', 'strabismus', 'muscle-palsy'],
    purpose: 'Map ocular motility to identify a paretic or restrictive muscle and follow it over time.',
    setup: ['Hess screen or Lancaster projector at 50 cm-1 m.', 'Red/green (or red lens) dissociation, dim room.'],
    howTo: [
      'Patient (or examiner, in the projected version) matches a colored target to the position seen by each eye in turn, across the 9 cardinal positions.',
      'Plot the two eyes’ fields on the chart.',
    ],
    whatToWatch: ['Which field is smaller — that eye has the underacting muscle.', 'Pattern of over/under-action to localize the affected muscle(s).'],
    record: ['The completed Hess/Lancaster chart — keep for comparison on follow-up.'],
    quickTip: 'Compare against a prior chart before concluding a deviation is new or progressive.',
  },
  {
    id: 'parks-3-step',
    title: 'Parks 3-Step Test',
    tags: ['diplopia', 'vertical', 'muscle-palsy'],
    purpose: 'Localize a single cyclovertical (vertical) muscle palsy — not valid for horizontal-only or combined palsies.',
    setup: ['Cover test results in primary gaze, right gaze, and left gaze already available.'],
    howTo: [
      'Step 1: Which eye is hypertropic in primary position?',
      'Step 2: Is the hypertropia worse in right or left gaze?',
      'Step 3: Is the hypertropia worse on head tilt right or left (Bielschowsky head-tilt test)?',
    ],
    whatToWatch: ['Consistency of the hypertropic eye across all three steps — that consistency is what localizes the muscle.'],
    record: ['Answers to all three steps — the muscle is read off the standard 3-step chart.'],
    quickTip: 'Only reach for this test once you know the deviation is a single cyclovertical palsy, not a combined or horizontal one.',
    commonMistakes: ['Applying the 3-step test to a combined horizontal-and-vertical deviation, where it does not give a valid answer.'],
  },
];

export function getClinicalTest(id: string): ClinicalTest | undefined {
  return clinicalTests.find((test) => test.id === id);
}

/** Case-insensitive match against title and tags. */
export function searchClinicalTests(query: string): ClinicalTest[] {
  const q = query.trim().toLowerCase();
  if (!q) return clinicalTests;
  return clinicalTests.filter(
    (test) => test.title.toLowerCase().includes(q) || test.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}
