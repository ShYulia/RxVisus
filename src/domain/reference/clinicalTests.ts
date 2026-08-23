/**
 * Canonical clinical test cards. Each test exists exactly once here and is
 * referenced (never duplicated) by clinical pathways via testIds — see
 * clinicalPathways.ts.
 *
 * Point-of-care shape: a clinician reads this while the patient is in the
 * chair, so every field is a short scannable fragment, not a paragraph.
 * `moreDetails` is the one place for background that isn't needed mid-exam
 * (rendered behind a collapsed disclosure) — everything else should answer
 * in a few seconds.
 *
 * Content is a reasonable starting draft, not yet clinically validated by
 * the intended real-world user — treat it the same way the calculators were
 * treated before shipping: check it against real clinical judgment first.
 */
export interface ClinicalTest {
  id: string;
  title: string;
  tags: string[];
  /** One line: what this test is for. */
  purpose: string;
  /** Equipment, as short nouns. */
  youNeed: string[];
  /** Where things go / room conditions. */
  setup: string[];
  /** What to ask the patient / do, as short imperative steps. */
  doSteps: string[];
  /** What the patient reports seeing, if relevant to interpretation. */
  patientSees?: string[];
  /** Common findings and what each one means — kept as short finding/meaning pairs, not prose. */
  interpret: { finding: string; meaning: string }[];
  /** Exactly how to neutralize/measure, and the endpoint — only for tests where this applies. */
  neutralize?: string[];
  /** Background not needed mid-exam: tips, common mistakes, what to record. Shown behind a collapsed disclosure. */
  moreDetails?: string[];
}

export const clinicalTests: ClinicalTest[] = [
  {
    id: 'cover-test',
    title: 'Cover Test',
    tags: ['diplopia', 'strabismus', 'binocular', 'alignment'],
    purpose: 'Detect and classify a manifest (tropia) or latent (phoria) deviation.',
    youNeed: ['Occluder'],
    setup: ['Fixation target at 6 m, then at 33–40 cm.', 'Room lit normally — do not dim.'],
    doSteps: [
      'Cover one eye — watch the UNCOVERED eye for a refixation movement.',
      'Uncover — watch the just-uncovered eye for a recovery movement.',
      'Alternate cover between the two eyes to reveal the total deviation.',
    ],
    interpret: [
      { finding: 'Refixation movement on cover', meaning: 'Manifest tropia, in that direction.' },
      { finding: 'Recovery movement on uncover', meaning: 'Phoria.' },
      { finding: 'Same in all gaze positions', meaning: 'Comitant.' },
      { finding: 'Differs by gaze position', meaning: 'Incomitant.' },
    ],
    moreDetails: [
      'Do cover-uncover before alternate cover — alternating first can mask a small phoria.',
      'Common mistake: covering too briefly for a full refixation, or letting the patient peek.',
      'Record distance and near separately, with direction and rough magnitude.',
    ],
  },
  {
    id: 'maddox-rod',
    title: 'Maddox Rod',
    tags: ['diplopia', 'binocular', 'phoria'],
    purpose: 'Dissociate the eyes to measure a horizontal or vertical phoria.',
    youNeed: ['Maddox rod', 'Muscle light or pen light', 'Prism bar or loose prisms'],
    setup: ['Rod over one eye, in trial frame or phoropter.', 'Dim the room.'],
    doSteps: ['Patient views the light through the rod.', 'Ask if the streak passes through the light, or is offset — and which direction.'],
    patientSees: ['A single streak of light, separate from the white light source.'],
    interpret: [
      { finding: 'Streak through the light', meaning: 'No measurable deviation on this axis.' },
      { finding: 'Streak offset', meaning: 'A phoria — neutralize to quantify.' },
      { finding: 'Streak broken or lost', meaning: 'Suppression.' },
    ],
    neutralize: ['Add prism until the streak passes through the light. Read the amount and base directly off the bar/lens.'],
    moreDetails: ['A single rod over one eye is enough for most single-plane checks — reserve double Maddox for torsion.'],
  },
  {
    id: 'double-maddox-rod',
    title: 'Double Maddox Rod',
    tags: ['diplopia', 'vertical', 'torsion', 'binocular'],
    purpose: 'Measure cyclotorsion (excyclo/incyclo) — most useful when a vertical deviation does not fully explain the symptoms.',
    youNeed: ['Two Maddox rods (one red, one white)'],
    setup: ['Both grooves vertical (horizontal streaks), one rod over each eye.', 'Single muscle-light target, dim room.'],
    doSteps: ['Ask if the two streaks are parallel or tilted relative to each other.', "Rotate each rod's axis until the patient reports them parallel."],
    patientSees: ['Two horizontal streaks, one red and one white.'],
    interpret: [
      { finding: 'Streaks parallel from the start', meaning: 'No significant torsion.' },
      { finding: 'Tilted, same in all gaze positions', meaning: 'Comitant torsion.' },
      { finding: 'Tilt varies by gaze position', meaning: 'Incomitant torsion.' },
    ],
    neutralize: ['Endpoint: streaks reported parallel. Read excyclo/incyclotorsion directly off each eye’s trial-frame axis scale.'],
    moreDetails: [
      'Excyclotorsion in a hypertropic eye is a classic superior oblique palsy sign.',
      'Check more than one gaze position if the history suggests a variable deviation.',
    ],
  },
  {
    id: 'parks-3-step',
    title: 'Parks 3-Step Test',
    tags: ['diplopia', 'vertical', 'muscle-palsy'],
    purpose: 'Localize a single cyclovertical (vertical) muscle palsy — not valid for horizontal-only or combined palsies.',
    youNeed: ['Cover test findings in primary, right, and left gaze (already on hand)'],
    setup: [],
    doSteps: [
      'Step 1 — which eye is hypertropic in primary position?',
      'Step 2 — worse in right or left gaze?',
      'Step 3 — worse on head tilt right or left (Bielschowsky)?',
    ],
    interpret: [{ finding: 'Same eye hypertropic and consistent across all 3 steps', meaning: 'Localizes the palsied muscle — read off the standard 3-step chart.' }],
    moreDetails: ['Only valid for a single cyclovertical palsy — not horizontal-only or combined deviations.'],
  },
  {
    id: 'pinhole-test',
    title: 'Pinhole Test',
    tags: ['diplopia', 'monocular', 'refraction', 'visual-acuity'],
    purpose: 'Distinguish a refractive/optical cause of blur or monocular diplopia from a non-refractive ocular cause.',
    youNeed: ['Multi-hole pinhole occluder'],
    setup: ["Patient's habitual correction in place, if worn."],
    doSteps: ['View the target through the pinhole, one eye at a time.', 'Compare with and without the pinhole.'],
    interpret: [
      { finding: 'Resolves / improves', meaning: 'Optical cause more likely.' },
      { finding: 'No change', meaning: 'Non-refractive ocular cause more likely.' },
    ],
    moreDetails: [
      'A multi-hole pinhole is easier for patients to align than a single-hole occluder.',
      'Test each eye separately — the result must be attributed to a single eye.',
    ],
  },
  {
    id: 'hess-lancaster',
    title: 'Hess / Lancaster Screen',
    tags: ['diplopia', 'strabismus', 'muscle-palsy'],
    purpose: 'Map ocular motility to identify a paretic or restrictive muscle and follow it over time. Specialist equipment — not typically in a standard exam room.',
    youNeed: ['Hess screen or Lancaster projector (specialist equipment)'],
    setup: ['50 cm–1 m working distance.', 'Red/green dissociation, dim room.'],
    doSteps: ['Match a colored target to the position seen by each eye, across the 9 cardinal positions.', "Plot both eyes' fields on the chart."],
    interpret: [
      { finding: 'One field smaller than the other', meaning: 'That eye has the underacting muscle.' },
      { finding: 'Pattern of over/under-action', meaning: 'Localizes the affected muscle(s).' },
    ],
    moreDetails: [
      'Consider for further/specialist assessment, not as a routine chair-side next step.',
      'Compare against a prior chart before concluding a deviation is new or progressive.',
    ],
  },
  {
    id: 'worth-4-dot',
    title: 'Worth 4 Dot',
    tags: ['diplopia', 'binocular', 'fusion', 'suppression', 'sensory', 'projector'],
    purpose: 'Assess binocular sensory status — fusion, suppression, or diplopia — with dissociated colored targets.',
    youNeed: ['Worth 4 Dot projector target', 'Red/green glasses'],
    setup: ['Distance, dim room.'],
    doSteps: ['Patient wears red/green glasses and views the projected four-dot target.', 'Ask how many dots, what colors, and their arrangement.'],
    patientSees: ['Up to 4 dots: 2 green, 1 red, 1 white — seen as red or green depending on the filter.'],
    interpret: [
      { finding: '4 dots, steady', meaning: 'Normal fusion.' },
      { finding: '2 red dots only', meaning: 'Suppression of the eye behind the green filter.' },
      { finding: '3 green dots only', meaning: 'Suppression of the eye behind the red filter.' },
      { finding: '5 dots, or dots swap/alternate', meaning: 'Diplopia (crossed or uncrossed) — note the pattern.' },
    ],
    moreDetails: ["Near Worth 4 Dot needs a separate dedicated near target — don't assume the projector target covers it."],
  },
  {
    id: 'schober-test',
    title: 'Schober Test (Cross Test)',
    tags: ['diplopia', 'binocular', 'phoria', 'projector', 'dissociation'],
    purpose: 'Chair-side subjective measurement of horizontal/vertical deviation using the standard projector cross-and-circle target.',
    youNeed: ['Projector Schober/cross target', 'Red/green glasses', 'Prism bar or loose prisms'],
    setup: ['Dim room, patient at the projector chart distance.'],
    doSteps: ['Patient wears red/green glasses and views the projected target.', 'Ask where the red cross appears relative to the green circles.'],
    patientSees: ['A red cross inside green concentric circles — centered or displaced.'],
    interpret: [
      { finding: 'Horizontal displacement', meaning: 'Horizontal deviation.' },
      { finding: 'Vertical displacement', meaning: 'Vertical deviation.' },
    ],
    neutralize: ['Add prism, increasing toward the side the cross needs to move. Endpoint: cross reported centered. Read the prism directly off the bar/lens.'],
    moreDetails: [
      'Uses the same projector slide as Worth 4 Dot dissociation — no extra equipment.',
      "Don't stop before the patient confirms it's centered — a rough estimate understates the deviation.",
    ],
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
