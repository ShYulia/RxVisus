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
  /**
   * Where things go / room conditions, what to ask/do, and short finding -> meaning pairs.
   * Optional: a test with a bespoke visual quick-reference card (see TestCard's QUICK_CARDS,
   * e.g. Schober/Maddox Rod) covers this ground with diagrams instead and omits these fields.
   */
  setup?: string[];
  /** What to ask the patient / do, as short imperative steps. */
  doSteps?: string[];
  /** What the patient reports seeing, if relevant to interpretation. */
  patientSees?: string[];
  /** Common findings and what each one means — kept as short finding/meaning pairs, not prose. */
  interpret?: { finding: string; meaning: string }[];
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
    moreDetails: [
      'Grooves horizontal → vertical line (for horizontal deviation). Grooves vertical → horizontal line (for vertical deviation).',
      'Ask whether the line passes through the light and, if not, which direction it is offset — neutralize with prism until it does.',
      'A broken streak, or loss of the rod-eye/fellow-eye image together, indicates suppression rather than a measurable phoria.',
      'A single rod over one eye is enough for most single-plane checks — reserve double Maddox for torsion.',
      'This card documents rod over OD, light seen by OS. If your setup is reversed, mirror every left/right direction below.',
    ],
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
    moreDetails: [
      'Dim room, patient at the projector chart distance.',
      'Add prism, increasing toward the side the cross needs to move, until the patient reports it centered. Read the amount directly off the bar/lens.',
      'Uses the same projector slide as Worth 4 Dot dissociation — no extra equipment.',
      "Don't stop before the patient confirms it's centered — a rough estimate understates the deviation.",
      'This card documents red over OD, green over OS. If your setup is reversed, mirror every left/right direction below.',
    ],
  },
  {
    id: 'npc-test',
    title: 'Near Point of Convergence (NPC)',
    tags: ['binocular', 'convergence', 'vergence'],
    purpose: 'Measure how close a target can be brought before convergence breaks — the standard screen for convergence insufficiency.',
    youNeed: ['Accommodative target (small print or a penlight)', 'Centimeter ruler'],
    setup: ['Target at eye level, moving straight toward the bridge of the nose.'],
    doSteps: [
      'Move the target slowly toward the patient, asking them to report when it becomes two (break).',
      'Note the break distance, then move the target away and ask when it becomes one again (recovery).',
    ],
    interpret: [
      { finding: 'Break beyond ~6 cm', meaning: 'Receded NPC — notable, correlate with symptoms and other findings.' },
      { finding: 'Break normal, recovery markedly delayed', meaning: 'Still worth noting alongside other convergence findings.' },
    ],
    moreDetails: ['Repeat 2–3 times — NPC can fatigue with repetition, which is itself a relevant finding.'],
  },
  {
    id: 'fusional-vergence-test',
    title: 'Fusional Vergence Ranges (BI/BO)',
    tags: ['binocular', 'vergence', 'phoria', 'prism-bar'],
    purpose: 'Measure the base-in and base-out fusional reserves at distance and/or near — the raw data Sheard’s criterion is evaluated against.',
    youNeed: ['Prism bar or rotary prism', 'Accommodative target'],
    setup: ['Distance (6 m) and/or near (33–40 cm) target, as relevant.'],
    doSteps: [
      'Increase prism (BI, then BO) smoothly.',
      'Ask the patient to report blur, then break (loses fusion), then recovery as prism is reduced.',
    ],
    interpret: [{ finding: 'Reduced reserve in the direction opposing the phoria', meaning: 'The relevant Sheard’s comparison — see Sheard’s Criterion.' }],
    moreDetails: ['Record blur when reported — it’s the preferred (more conservative) endpoint for Sheard’s criterion; fall back to break only if blur wasn’t reported.'],
  },
  {
    id: 'amplitude-of-accommodation-test',
    title: 'Amplitude of Accommodation (Push-Up)',
    tags: ['binocular', 'accommodation'],
    purpose: 'Measure the maximum accommodative response per eye — compared against the age-expected minimum (Hofstetter’s formula).',
    youNeed: ['Accommodative target', 'Centimeter ruler or reduced Snellen card with a distance scale'],
    setup: ['Monocular, habitual correction in place.'],
    doSteps: ['Move the target toward the eye until it first sustains blur.', 'Read the amplitude in diopters directly off the card’s scale.'],
    interpret: [{ finding: 'Below the age-expected minimum', meaning: 'Notable — correlate with symptoms and MAF findings before concluding Accommodative Insufficiency.' }],
    moreDetails: ['Test OD and OS separately — a unilateral finding is as clinically meaningful as a bilateral one.'],
  },
  {
    id: 'monocular-accommodative-facility-test',
    title: 'Monocular Accommodative Facility (MAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Measure how quickly each eye alone can shift accommodative demand — distinguishes a facility (speed) problem from an amplitude problem.',
    youNeed: ['±2.00 D flipper', 'Near accommodative target'],
    setup: ['Monocular, near fixation distance, habitual correction in place.'],
    doSteps: ['Alternate +2.00/−2.00, asking the patient to report when the target clears each time.', 'Count cycles (one cycle = both sides cleared) per minute.'],
    interpret: [
      { finding: 'Difficulty clearing minus only', meaning: 'Suggests reduced accommodative amplitude/facility.' },
      { finding: 'Difficulty clearing plus only', meaning: 'Suggests accommodative excess or difficulty relaxing accommodation.' },
      { finding: 'Difficulty clearing both', meaning: 'Suggests accommodative infacility.' },
    ],
    moreDetails: ['Note which side (plus/minus/both) is difficult, not just the cycles/min count — the pattern-matching relies on which side failed.'],
  },
  {
    id: 'binocular-accommodative-facility-test',
    title: 'Binocular Accommodative Facility (BAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Same as MAF but performed binocularly — a difficulty here that wasn’t present monocularly points toward a binocular vergence-accommodation interaction rather than a purely accommodative one.',
    youNeed: ['±2.00 D flipper', 'Near accommodative target'],
    setup: ['Binocular, near fixation distance, habitual correction in place.'],
    doSteps: ['Alternate +2.00/−2.00 over both eyes together, asking the patient to report when the target clears.', 'Count cycles per minute.'],
    interpret: [{ finding: 'Difficulty binocularly but not monocularly (MAF normal)', meaning: 'Points toward a vergence-facility contribution rather than a purely accommodative one.' }],
    moreDetails: ['Compare directly against the MAF result for the same patient — the comparison is the useful part, not either number alone.'],
  },
  {
    id: 'gradient-aca-test',
    title: 'Gradient AC/A Ratio',
    tags: ['binocular', 'accommodation', 'vergence', 'phoria'],
    purpose: 'Measure how much the near phoria shifts per diopter of induced accommodative change — clarifies whether a phoria difference is accommodatively driven.',
    youNeed: ['Near phoria already measured (habitual correction)', 'Loose lenses or phoropter', 'Prism bar or Maddox rod for the repeat phoria'],
    setup: ['Near fixation distance, habitual correction in place.'],
    doSteps: [
      'Measure near phoria with habitual correction.',
      'Add +1.00 (or -1.00) over both eyes and re-measure the near phoria.',
      'Gradient AC/A = change in phoria (Δ) ÷ lens change (D).',
    ],
    interpret: [{ finding: 'High ratio (above the draft threshold)', meaning: 'Near findings are more accommodatively driven — relevant to Convergence Excess.' }],
    moreDetails: ['Keep the target equally clear/legible before and after the lens change, or the comparison is invalid.'],
  },
  {
    id: 'nra-pra-test',
    title: 'NRA / PRA (Relative Accommodation)',
    tags: ['binocular', 'accommodation', 'phoropter'],
    purpose: 'Measure how much accommodation can be relaxed (NRA) or stimulated (PRA) while binocular fixation is held — a binocularly-constrained accommodative range.',
    youNeed: ['Phoropter', 'Near accommodative target'],
    setup: ['Binocular, near fixation distance, best near correction in place.'],
    doSteps: [
      'NRA: add plus lenses binocularly in small steps until sustained first blur — read the total added power.',
      'PRA: add minus lenses binocularly the same way.',
    ],
    interpret: [{ finding: 'Low PRA with high MAF minus-side difficulty', meaning: 'Findings tend to corroborate each other — read them together, not in isolation.' }],
    moreDetails: ['Always start from a validated distance/near Rx — an uncorrected refractive error invalidates both values.'],
  },
  {
    id: 'vergence-facility-test',
    title: 'Vergence Facility',
    tags: ['binocular', 'vergence', 'facility', 'flippers', 'prism-bar'],
    purpose: 'Measure how quickly the patient can alternate fusing through base-in and base-out prism — a facility (speed) analogue of the fusional vergence ranges.',
    youNeed: ['3Δ BI / 12Δ BO prism flipper (or equivalent loose prisms)', 'Near accommodative target'],
    setup: ['Near fixation distance, habitual correction in place.', 'Requires a prism flipper — if unavailable, record that rather than a fabricated result.'],
    doSteps: ['Alternate BI/BO, asking the patient to report when single clear vision is regained each time.', 'Count cycles per minute.'],
    interpret: [{ finding: 'Reduced cycles/min', meaning: 'Supports further vergence testing — not a standalone diagnosis.' }],
    moreDetails: ['This test specifically needs prism flippers — a chair without them should skip it rather than substitute the fusional vergence ranges result.'],
  },
  {
    id: 'mem-retinoscopy-test',
    title: 'MEM Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'Estimate the accommodative response (lag/lead) while the patient reads a near target held at the retinoscope — an objective cross-check on subjective near findings.',
    youNeed: ['Retinoscope', 'Near target with small text, attached near the retinoscope light'],
    setup: ['Habitual correction in place, patient reading the near target aloud.'],
    doSteps: ['Observe the reflex neutrality; briefly interpose plus/minus lenses to bracket and estimate the neutralizing power.'],
    interpret: [
      { finding: 'With-motion (needs plus to neutralize)', meaning: 'Accommodative lag — under-accommodating for the target.' },
      { finding: 'Against-motion (needs minus to neutralize)', meaning: 'Accommodative lead — over-accommodating for the target.' },
    ],
    moreDetails: ['Keep the interposed lens in view for under a second — a longer dwell lets accommodation adapt to the lens itself.'],
  },
  {
    id: 'nott-retinoscopy-test',
    title: 'Nott Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'Same purpose as MEM (estimate near accommodative lag/lead) but by physically moving the retinoscope rather than interposing lenses.',
    youNeed: ['Retinoscope', 'Near target with small text'],
    setup: ['Habitual correction in place, patient reading the near target aloud.'],
    doSteps: ['Move the retinoscope toward/away from the target’s working distance until the reflex neutralizes.', 'Read the lag/lead directly off the distance moved.'],
    interpret: [
      { finding: 'Neutral point beyond the target', meaning: 'Accommodative lag.' },
      { finding: 'Neutral point short of the target', meaning: 'Accommodative lead.' },
    ],
    moreDetails: ['Needs a working-distance scale (tape measure or marked rod) rather than the fixed retinoscope distance MEM uses.'],
  },
  {
    id: 'stereoacuity-test',
    title: 'Stereoacuity',
    tags: ['binocular', 'sensory', 'fusion'],
    purpose: 'Quantify depth-perception/fine binocular sensory fusion — a sensory-status data point alongside the vergence/accommodative findings, not a substitute for them.',
    youNeed: ['Stereo test book/plates (e.g. random-dot or contour targets)', 'Polarized glasses if required by the test'],
    setup: ['Test at its specified distance (usually near, some tests also have a distance version).'],
    doSteps: ['Present targets from coarsest to finest, recording the finest level correctly identified.'],
    interpret: [{ finding: 'Reduced stereoacuity', meaning: 'A sensory finding to correlate with the motor/accommodative findings — not diagnostic alone.' }],
    moreDetails: ['Note which specific test/plates were used — normative cutoffs differ between tests.'],
  },
  {
    id: 'sheard-criterion',
    title: "Sheard's Criterion",
    tags: ['binocular', 'vergence', 'phoria', 'reference'],
    purpose: 'Reference: the compensating fusional reserve (opposite the phoria) should be at least twice the phoria — the standard check for whether a phoria is adequately compensated.',
    youNeed: ['A measured phoria (Maddox Rod/cover test) and the corresponding fusional vergence range'],
    doSteps: [
      'Identify the compensating direction: BO for exophoria, BI for esophoria.',
      'Compare 2 × phoria against the compensating reserve (blur point preferred; break if blur wasn’t recorded).',
    ],
    interpret: [
      { finding: 'Reserve ≥ 2 × phoria', meaning: 'PASS — phoria is adequately compensated by fusional reserve.' },
      { finding: 'Reserve < 2 × phoria', meaning: 'FAIL — a finding worth weighing alongside symptoms, not a prescribing rule by itself.' },
    ],
    moreDetails: ["A stated multiplier and blur-preferred method are a specific clinical convention — this card and Binocular Status's evaluation use the same one, deliberately, so they never silently disagree."],
  },
  {
    id: 'percival-criterion',
    title: "Percival's Criterion",
    tags: ['binocular', 'accommodation', 'vergence', 'reference'],
    purpose: 'Reference: the accommodative posture should sit within the middle third of the total relative accommodation range (NRA + PRA) — an accommodative analogue to Sheard’s criterion.',
    youNeed: ['NRA and PRA already measured'],
    doSteps: ['Total range = NRA + PRA.', 'Check whether the resting point falls outside the middle third of that range.'],
    interpret: [{ finding: 'Posture outside the middle third', meaning: 'A finding worth weighing alongside symptoms and MAF/BAF results, not a prescribing rule by itself.' }],
    moreDetails: ['Less commonly applied chairside than Sheard’s — included here as a reference, not part of the standard Binocular Status flow.'],
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
