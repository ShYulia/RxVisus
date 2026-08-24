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
   * Compact single-line setup summary (distance, laterality, correction, lighting — whichever
   * apply), e.g. ['40 cm', 'BINOCULAR', 'BEST CORRECTION']. Preferred over `setup` whenever the
   * setup fits in one glanceable line; falls back to `setup` when it doesn't.
   */
  meta?: string[];
  /**
   * Where things go / room conditions, what to ask/do, and short finding -> meaning pairs.
   * Optional: a test with a bespoke visual quick-reference card (see TestCard's QUICK_CARDS,
   * e.g. Schober/Maddox Rod) covers this ground with diagrams instead and omits these fields.
   */
  setup?: string[];
  /**
   * The procedure as short action fragments, rendered as a vertical arrow sequence (see
   * ActionFlow) — the dominant "what do I do" element, not a paragraph. Each step should be a
   * single explicit action or patient report, e.g. 'PATIENT REPORTS: blur', not a full sentence
   * explaining why.
   */
  doSteps?: string[];
  /** What the patient reports seeing, if relevant to interpretation. */
  patientSees?: string[];
  /** Common findings and what each one means — kept as short finding/meaning pairs, not prose. */
  interpret?: { finding: string; meaning: string }[];
  /** Exactly how to neutralize/measure, and the endpoint — only for tests where this applies. */
  neutralize?: string[];
  /**
   * A short formula or pass/fail rule the clinician applies to already-measured numbers (e.g.
   * 'Reserve ≥ 2 × Phoria = PASS', 'Δ phoria ÷ Δ lens (D) = AC/A') — rendered large/bold.
   * Reserved for calculation/reference cards (Gradient AC/A, Sheard's, Percival's); a test with
   * a hands-on-patient procedure should express that procedure via `doSteps`/ActionFlow
   * instead, not restate it here — the two would just duplicate each other.
   */
  keyAnchor?: string;
  /** Small line under keyAnchor giving just enough procedural context (timing, endpoint). */
  keyAnchorCaption?: string;
  /** One short clarifying note worth a visual callout of its own (e.g. a cycle definition) — not a place for general background. */
  quickReminder?: string;
  /** Short checklist of what to record, as a reminder only — the actual measurement is entered on the assessment step that launched this card, never re-entered here. */
  whatToNote?: string[];
  /** One short line translating a finding into its clinical meaning — for when a full `interpret` table would be overkill. */
  quickInterpretReminder?: string;
  /** Background not needed mid-exam: norms, theory, pitfalls, common mistakes. Shown behind a collapsed "More / Interpretation" disclosure. */
  moreDetails?: string[];
}

export const clinicalTests: ClinicalTest[] = [
  {
    id: 'cover-test',
    title: 'Cover Test',
    tags: ['diplopia', 'strabismus', 'binocular', 'alignment'],
    purpose: 'Detect and classify a manifest (tropia) or latent (phoria) deviation.',
    youNeed: ['Occluder (paddle or card)'],
    meta: ['6 m, THEN 33–40 cm', 'ROOM LIT NORMALLY — DO NOT DIM'],
    doSteps: [
      'Cover one eye',
      'WATCH the uncovered eye for a refixation movement',
      'Uncover',
      'WATCH the just-uncovered eye for a recovery movement',
      'Alternate cover between the two eyes to reveal the total deviation',
    ],
    whatToNote: ['Direction of any movement (eso/exo/hyper), at distance and near, separately', 'Whether it holds across gaze positions'],
    interpret: [
      { finding: 'Refixation movement on cover', meaning: 'Manifest tropia, in that direction.' },
      { finding: 'Recovery movement on uncover', meaning: 'Phoria.' },
      { finding: 'Same in all gaze positions', meaning: 'Comitant.' },
      { finding: 'Differs by gaze position', meaning: 'Incomitant.' },
    ],
    moreDetails: [
      'Do cover-uncover before alternate cover — alternating first can mask a small phoria.',
      'Common mistake: covering too briefly for a full refixation, or letting the patient peek.',
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
    moreDetails: [
      'Tilt that stays the same across gaze positions is comitant torsion; tilt that varies by gaze position is incomitant.',
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
    doSteps: [
      'Step 1 — which eye is hypertropic in primary position?',
      'Step 2 — worse in right gaze or left gaze?',
      'Step 3 — worse on head tilt right or left (Bielschowsky)?',
    ],
    whatToNote: ['Which eye is hypertropic at each of the 3 steps'],
    interpret: [{ finding: 'Same eye hypertropic and consistent across all 3 steps', meaning: 'Localizes the palsied muscle — read off the standard 3-step chart.' }],
    moreDetails: ['Only valid for a single cyclovertical palsy — not horizontal-only or combined deviations.'],
  },
  {
    id: 'pinhole-test',
    title: 'Pinhole Test',
    tags: ['diplopia', 'monocular', 'refraction', 'visual-acuity'],
    purpose: 'Distinguish a refractive/optical cause of blur or monocular diplopia from a non-refractive ocular cause.',
    youNeed: ['Multi-hole pinhole occluder'],
    meta: ['ONE EYE AT A TIME', 'HABITUAL CORRECTION IN PLACE, IF WORN'],
    doSteps: ['View the target through the pinhole', 'Compare with and without the pinhole'],
    whatToNote: ['Whether vision resolves/improves or stays unchanged, per eye'],
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
    meta: ['50 cm – 1 m', 'RED/GREEN DISSOCIATION', 'DIM ROOM'],
    doSteps: ['Match a colored target to the position seen by each eye', 'Repeat across the 9 cardinal positions', "Plot both eyes' fields on the chart"],
    whatToNote: ["Each eye's field shape across the 9 positions"],
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
    meta: ['DISTANCE (SEPARATE NEAR TARGET NEEDED FOR NEAR)', 'DIM ROOM'],
    moreDetails: [
      "Near Worth 4 Dot needs a separate dedicated near target — don't assume the projector target covers it.",
      'A pattern that swaps or alternates between arrangements is still diplopia — note whether it swaps, which suggests alternating suppression rather than a fixed one.',
    ],
  },
  {
    id: 'schober-test',
    title: 'Schober Test (Cross Test)',
    tags: ['diplopia', 'binocular', 'phoria', 'projector', 'dissociation'],
    purpose: 'Chair-side subjective measurement of horizontal/vertical deviation using the standard projector cross-and-circle target.',
    youNeed: ['Projector Schober/cross target', 'Red/green glasses', 'Prism bar or loose prisms'],
    meta: ['DIM ROOM', 'PATIENT AT THE PROJECTOR CHART DISTANCE'],
    moreDetails: [
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
    meta: ['TARGET AT EYE LEVEL', 'MOVE STRAIGHT TOWARD THE BRIDGE OF THE NOSE'],
    doSteps: [
      'Move the target slowly toward the patient',
      'PATIENT REPORTS: it becomes two (break) — stop and note the distance',
      'Move the target away',
      'PATIENT REPORTS: it becomes one again (recovery) — note the distance',
      'Repeat 2–3 times',
    ],
    quickReminder: 'NPC can fatigue with repetition — a break that recedes on repeat trials is itself a relevant finding.',
    whatToNote: ['At what distance does the target first become double (break)?', 'At what distance does it become single again (recovery)?'],
    quickInterpretReminder: 'Break beyond ~6 cm is notable — correlate with symptoms and other findings, not a standalone diagnosis.',
    moreDetails: [
      'Some clinicians also note an objective break (examiner sees one eye lose fixation) separate from the patient’s subjective report — either is valid, just be consistent with which you record.',
    ],
  },
  {
    id: 'fusional-vergence-test',
    title: 'Fusional Vergence Ranges (BI/BO)',
    tags: ['binocular', 'vergence', 'phoria', 'prism-bar'],
    purpose: 'Measure the base-in and base-out fusional reserves at distance and/or near — the raw data Sheard’s criterion is evaluated against.',
    youNeed: ['Prism bar or rotary prism', 'Accommodative target'],
    meta: ['DISTANCE (6 m) AND/OR NEAR (33–40 cm)', 'ONE DIRECTION AT A TIME (BI, THEN BO)'],
    doSteps: [
      'Increase prism smoothly',
      'PATIENT REPORTS: blur — note the amount',
      'Continue increasing',
      'PATIENT REPORTS: break, target doubles — note the amount',
      'Reduce prism',
      'PATIENT REPORTS: single again (recovery) — note the amount',
    ],
    whatToNote: [
      'At what prism amount does the target first blur?',
      'At what amount does it break (double)?',
      'At what amount does it recover to single?',
      'Repeat for BI and BO separately',
    ],
    quickInterpretReminder: 'Reduced reserve opposing the phoria direction is the relevant Sheard’s comparison — see Sheard’s Criterion.',
    moreDetails: [
      'Record blur when reported — it’s the preferred (more conservative) endpoint for Sheard’s criterion; fall back to break only if blur wasn’t reported.',
      'A jump straight to break with no blur reported is worth a repeat — it can mean the increments were too coarse.',
    ],
  },
  {
    id: 'amplitude-of-accommodation-test',
    title: 'Amplitude of Accommodation (Push-Up)',
    tags: ['binocular', 'accommodation'],
    purpose: 'Measure the maximum accommodative response per eye — compared against the age-expected minimum (Hofstetter’s formula).',
    youNeed: ['Accommodative target', 'Centimeter ruler or reduced Snellen card with a distance scale'],
    meta: ['ONE EYE AT A TIME', 'HABITUAL CORRECTION IN PLACE'],
    doSteps: ['Move the target toward the eye', 'PATIENT REPORTS: sustained blur — stop', 'Read the amplitude in diopters off the card’s scale', 'Repeat with the other eye'],
    whatToNote: ['Amplitude in diopters, OD and OS separately'],
    quickInterpretReminder: 'Below the age-expected minimum is notable — correlate with symptoms and MAF before concluding Accommodative Insufficiency.',
    moreDetails: ['The push-up technique tends to slightly overestimate true amplitude versus push-down/minus-lens methods — stay consistent with the same technique across visits.'],
  },
  {
    id: 'monocular-accommodative-facility-test',
    title: 'Monocular Accommodative Facility (MAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Measure how quickly each eye alone can shift accommodative demand — distinguishes a facility (speed) problem from an amplitude problem.',
    youNeed: ['±2.00 D flipper', 'Near target at 40 cm'],
    moreDetails: [
      'Habitual near correction in place; occlude the fellow eye.',
      'Starting with +2.00 is the common convention, not a strict requirement — what matters is that a full cycle (both signs cleared) is counted consistently.',
      'Note which side (plus/minus/both) is difficult, not just the cycles/min count — the pattern-matching relies on which side failed.',
    ],
  },
  {
    id: 'binocular-accommodative-facility-test',
    title: 'Binocular Accommodative Facility (BAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Same as MAF but performed binocularly — a difficulty here that wasn’t present monocularly points toward a binocular vergence-accommodation interaction rather than a purely accommodative one.',
    youNeed: ['±2.00 D flipper', 'Near target at 40 cm'],
    moreDetails: [
      'Habitual near correction in place; both eyes open.',
      'The comparison against MAF is the useful part, not either number alone — a difficulty that appears binocularly but not monocularly is the notable pattern.',
    ],
  },
  {
    id: 'gradient-aca-test',
    title: 'Gradient AC/A Ratio',
    tags: ['binocular', 'accommodation', 'vergence', 'phoria'],
    purpose: 'Measure how much the near phoria shifts per diopter of induced accommodative change — clarifies whether a phoria difference is accommodatively driven.',
    youNeed: ['Near phoria already measured (habitual correction)', 'Loose lenses or phoropter', 'Prism bar or Maddox rod for the repeat phoria'],
    meta: ['NEAR', 'BINOCULAR', 'HABITUAL CORRECTION IN PLACE'],
    doSteps: ['Measure near phoria with habitual correction', 'Add +1.00 D (or −1.00 D) over both eyes', 'Re-measure the near phoria with the lens in place'],
    keyAnchor: 'Δ phoria ÷ Δ lens (D) = AC/A',
    keyAnchorCaption: 'Change in phoria (Δ), divided by the lens power added (D).',
    whatToNote: ['Phoria before the lens', 'Phoria after the lens', 'Which lens power was used (+1.00 or −1.00)'],
    quickInterpretReminder: 'High ratio → near findings are more accommodatively driven — relevant to Convergence Excess.',
    moreDetails: ['Keep the target equally clear/legible before and after the lens change, or the comparison is invalid.'],
  },
  {
    id: 'nra-pra-test',
    title: 'NRA / PRA (Relative Accommodation)',
    tags: ['binocular', 'accommodation', 'phoropter'],
    purpose: 'Measure how much accommodation can be relaxed (NRA) or stimulated (PRA) while binocular fixation is held — a binocularly-constrained accommodative range.',
    youNeed: ['Phoropter', 'Near accommodative target'],
    meta: ['BINOCULAR', 'NEAR', 'BEST NEAR CORRECTION IN PLACE'],
    doSteps: [
      'NRA: add plus lenses binocularly, in small steps',
      'PATIENT REPORTS: sustained first blur — stop, read the total power added',
      'PRA: add minus lenses binocularly, in small steps',
      'PATIENT REPORTS: sustained first blur — stop, read the total power added',
    ],
    whatToNote: ['Total plus power added before sustained blur (NRA)', 'Total minus power added before sustained blur (PRA)'],
    quickInterpretReminder: 'Low PRA with plus-side MAF difficulty tend to corroborate each other — read them together, not in isolation.',
    moreDetails: ['Always start from a validated distance/near Rx — an uncorrected refractive error invalidates both values.'],
  },
  {
    id: 'vergence-facility-test',
    title: 'Vergence Facility',
    tags: ['binocular', 'vergence', 'facility', 'flippers', 'prism-bar'],
    purpose: 'Measure how quickly the patient can alternate fusing through base-in and base-out prism — a facility (speed) analogue of the fusional vergence ranges.',
    youNeed: ['3Δ BI / 12Δ BO prism flipper (or equivalent loose prisms)', 'Near accommodative target'],
    moreDetails: [
      'Near fixation distance, habitual correction in place.',
      'This test specifically needs prism flippers — a chair without them should skip it rather than substitute the fusional vergence ranges result.',
    ],
  },
  {
    id: 'mem-retinoscopy-test',
    title: 'MEM Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'Estimate the accommodative response (lag/lead) while the patient reads a near target held at the retinoscope — an objective cross-check on subjective near findings.',
    youNeed: ['Retinoscope', 'Near target with small text, attached near the retinoscope light'],
    meta: ['HABITUAL CORRECTION IN PLACE', 'PATIENT READING THE TARGET ALOUD'],
    doSteps: [
      'Observe the retinoscopic reflex while the patient reads',
      'Briefly interpose a plus or minus lens (under a second)',
      'Find the power that neutralizes the reflex (motion stops)',
    ],
    whatToNote: ['Lag or lead amount, in diopters', 'Whether OD and OS differ'],
    interpret: [
      { finding: 'With-motion (needs plus to neutralize)', meaning: 'Accommodative lag — under-accommodating for the target.' },
      { finding: 'Against-motion (needs minus to neutralize)', meaning: 'Accommodative lead — over-accommodating for the target.' },
    ],
    quickInterpretReminder: 'Compare with Nott — the two should roughly agree.',
    moreDetails: ['A longer dwell with the interposed lens lets accommodation adapt to the lens itself — keep it under a second.'],
  },
  {
    id: 'nott-retinoscopy-test',
    title: 'Nott Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'Same purpose as MEM (estimate near accommodative lag/lead) but by physically moving the retinoscope rather than interposing lenses.',
    youNeed: ['Retinoscope', 'Near target with small text', 'Working-distance scale (tape measure or marked rod)'],
    meta: ['HABITUAL CORRECTION IN PLACE', 'PATIENT READING THE TARGET ALOUD'],
    doSteps: ['Move the retinoscope toward/away from the target', 'Find the working distance where the reflex neutralizes (motion stops)', 'Read the working distance at that point'],
    whatToNote: ['Working distance at neutral', 'Lag or lead amount'],
    interpret: [
      { finding: 'Neutral point beyond the target', meaning: 'Accommodative lag — under-accommodating for the target.' },
      { finding: 'Neutral point short of the target', meaning: 'Accommodative lead — over-accommodating for the target.' },
    ],
    quickInterpretReminder: 'Compare with MEM — the two should roughly agree.',
    moreDetails: ['Needs a working-distance scale rather than the fixed retinoscope distance MEM uses.'],
  },
  {
    id: 'stereoacuity-test',
    title: 'Stereoacuity',
    tags: ['binocular', 'sensory', 'fusion'],
    purpose: 'Quantify depth-perception/fine binocular sensory fusion — a sensory-status data point alongside the vergence/accommodative findings, not a substitute for them.',
    youNeed: ['Stereo test book/plates (e.g. random-dot or contour targets)', 'Polarized glasses if required by the test'],
    meta: ['USUALLY NEAR — SOME TESTS ALSO HAVE A DISTANCE VERSION'],
    doSteps: ['Present targets from coarsest to finest', 'PATIENT REPORTS what they see at each level', 'Stop at the finest level correctly identified'],
    whatToNote: ['Finest level identified, in arc seconds', 'Which specific test/plates were used'],
    quickInterpretReminder: 'A sensory finding to correlate with the motor/accommodative findings — not diagnostic alone.',
    moreDetails: ['Note which specific test/plates were used — normative cutoffs differ between tests.'],
  },
  {
    id: 'sheard-criterion',
    title: "Sheard's Criterion",
    tags: ['binocular', 'vergence', 'phoria', 'reference'],
    purpose: 'Reference: the compensating fusional reserve (opposite the phoria) should be at least twice the phoria — the standard check for whether a phoria is adequately compensated.',
    youNeed: ['A measured phoria (Maddox Rod/cover test)', 'The corresponding fusional vergence range'],
    doSteps: [
      'Identify the compensating direction: BO for exophoria, BI for esophoria',
      'Compare the compensating reserve against 2 × the phoria',
      'Use the blur point when recorded; break as a fallback',
    ],
    keyAnchor: 'Reserve ≥ 2 × Phoria = PASS',
    quickInterpretReminder: 'FAIL is a finding to weigh alongside symptoms — not a prescribing rule by itself.',
    moreDetails: ["A stated multiplier and blur-preferred method are a specific clinical convention — this card and Binocular Status's evaluation use the same one, deliberately, so they never silently disagree."],
  },
  {
    id: 'percival-criterion',
    title: "Percival's Criterion",
    tags: ['binocular', 'accommodation', 'vergence', 'reference'],
    purpose: 'Reference: the accommodative posture should sit within the middle third of the total relative accommodation range (NRA + PRA) — an accommodative analogue to Sheard’s criterion.',
    youNeed: ['NRA and PRA already measured'],
    doSteps: ['Add NRA + PRA to get the total range', 'Check whether the resting point (habitual correction) falls within the middle third of that range'],
    keyAnchor: 'Resting point within middle ⅓ of (NRA + PRA)',
    quickInterpretReminder: 'Outside the middle third is a finding to weigh alongside symptoms and MAF/BAF — not a prescribing rule by itself.',
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
