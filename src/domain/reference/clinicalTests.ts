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
  /**
   * True for a formula/rule applied to findings already measured by other tests (e.g. Sheard's,
   * Percival's) rather than a technique performed on the patient. Excluded from the default
   * "All Tests" browse listing and Clinical Guide's own default search listing (see
   * searchClinicalTests) so it doesn't read as one more examination to perform — still fully
   * reachable by id (getClinicalTest), by an explicit search matching its title/tags, and via
   * the "Related tests" cross-reference on the test card(s) whose measurements it interprets.
   */
  interpretationCriterion?: boolean;
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
  /**
   * Background not needed mid-exam: norms, theory, pitfalls, common mistakes. Shown behind a
   * collapsed "More / Interpretation" disclosure, as a flat bullet list. Prefer `moreSections`
   * for a new/reworked card — this flat form is kept only so existing entries don't need to be
   * migrated.
   */
  moreDetails?: string[];
  /**
   * The same "More / Interpretation" disclosure as `moreDetails`, but organized into labeled
   * subsections (e.g. "What is this test?", "Common mistakes") — the detailed teaching/refresher
   * layer for someone who wants to actually understand the test, as opposed to the point-of-care
   * fields above which only answer "what do I do right now." Takes precedence over `moreDetails`
   * when both are present (a card should use one or the other, not both).
   */
  moreSections?: { heading: string; items: string[] }[];
}

export const clinicalTests: ClinicalTest[] = [
  {
    id: 'cover-test',
    title: 'Cover Test',
    tags: ['diplopia', 'strabismus', 'binocular', 'alignment'],
    purpose: 'Detect and classify a manifest (tropia) or latent (phoria) deviation.',
    youNeed: ['Occluder (paddle or card)', 'Prism bar or loose prisms (for Alternate Cover magnitude)'],
    meta: ['6 m, THEN 33–40 cm', 'ROOM LIT NORMALLY — DO NOT DIM'],
    moreSections: [
      {
        heading: 'What is this test?',
        items: [
          'The primary clinical test for ocular misalignment — the deviation is inferred purely from eye movement as fixation is interrupted and restored, with no instrumentation beyond an occluder (and, for the alternate/prism version, a prism bar).',
          "Two related techniques answer two different questions: Cover-Uncover asks 'is there a manifest deviation?' (tropia); Alternate Cover asks 'what is the total deviation, including any latent component?' (tropia + phoria).",
        ],
      },
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'Motor alignment of the visual axes — whether both eyes are directed at the same point when fusion is intact (phoria, actively controlled) versus when fusion is prevented (tropia, uncontrolled).',
          "It's the foundation most other binocular findings build on: phoria magnitude (Maddox Rod/Schober), fusional reserves, Sheard's/Percival's criteria, and any strabismus workup all start from a documented cover test.",
        ],
      },
      {
        heading: 'Procedure in detail',
        items: [
          'Cover-Uncover: patient fixates a well-seen, accommodative target at distance (6 m); cover one eye smoothly without letting the patient peek; watch the OTHER, uncovered eye for a refixation movement (direction identifies the type — outward/temporal was esotropic, inward/nasal was exotropic, downward was hypertropic, upward was hypotropic); uncover and watch that same eye for a recovery movement (reveals a phoria, not a tropia); repeat covering the other eye; repeat the whole sequence at near (33–40 cm).',
          'Alternate Cover: move the occluder rapidly eye to eye, never leaving both eyes uncovered together, so fusion never re-engages; watch each eye as it is uncovered for a shift — that shift is the total deviation. For magnitude (Prism Alternate Cover Test), place prism base opposite the shift and increase until no movement is seen on alternation; that amount, in prism diopters, is the deviation.',
        ],
      },
      {
        heading: 'What the patient sees / what to watch',
        items: [
          "The patient reports nothing for this test — unlike Maddox Rod or Schober, the finding comes entirely from the clinician's observation of eye movement.",
          'Watch the direction of movement, its speed and completeness (a slow, incomplete recovery suggests fatiguing fusion even with a small deviation), and whether the finding holds across gaze positions (comitant) or changes (incomitant — raises suspicion for a muscle palsy or restriction).',
        ],
      },
      {
        heading: 'Record & interpret',
        items: [
          'Record, separately for distance and near: presence/absence of a tropia (Cover-Uncover), and the total deviation with direction and magnitude in prism diopters (Alternate Cover), plus comitant vs incomitant.',
          "Notation: eso/exo for horizontal, hyper/hypo for vertical — named for the eye that's higher, so always state which eye ('right hyper' and 'left hypo' can describe the same finding).",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Doing Alternate Cover before Cover-Uncover — alternating first can mask the manifest/latent distinction, since it never isolates the tropia alone. Always do Cover-Uncover first.',
          'Covering too briefly for a full refixation, or letting the patient peek — both understate the deviation.',
          "A blurry, too-small, or non-accommodative fixation target lets attention drift, producing an inconsistent result.",
          "Cover test alone doesn't measure torsion or identify which specific muscle is at fault in an incomitant finding — see Double Maddox Rod and Parks 3-Step Test.",
        ],
      },
      {
        heading: 'Related tests in this guide',
        items: [
          "Maddox Rod, Schober Test, and the Von Graefe Technique all measure a phoria's magnitude from the patient's subjective report of a dissociated image, rather than clinician-observed movement — useful when the movement here is too small to see reliably.",
          'An incomitant finding with a vertical component is the trigger to move to Parks 3-Step Test.',
        ],
      },
    ],
  },
  {
    id: 'maddox-rod',
    title: 'Maddox Rod',
    tags: ['diplopia', 'binocular', 'phoria'],
    purpose: 'Dissociate the eyes to measure a horizontal or vertical phoria.',
    youNeed: ['Maddox rod', 'Muscle light or pen light', 'Prism bar or loose prisms'],
    moreSections: [
      {
        heading: 'What is this test / what it assesses',
        items: [
          "A lens of fine parallel cylindrical ridges dissociates one eye's image into a thin streak of light, breaking fusion without otherwise disturbing vision — this isolates a phoria that fusion would otherwise hold latent.",
          "Measures alignment subjectively, from the patient's own report of the streak/light relationship — complementary to Cover Test's clinician-observed movement, not a replacement for it.",
        ],
      },
      {
        heading: 'Optics: why the streak appears where it does',
        items: [
          'Grooves horizontal → the rod eye sees a vertical streak (for horizontal deviations). Grooves vertical → a horizontal streak (for vertical deviations) — same principle Double Maddox Rod uses in both eyes at once.',
          "The fellow (non-rod) eye sees the plain fixation light normally — the two eyes' separate images (streak vs. light) can only be compared because dissociation has broken fusion.",
        ],
      },
      {
        heading: 'Procedure in detail',
        items: [
          'Rod over OD (this card\'s documented setup — mirror every left/right direction below if your convention places the rod over OS instead), fixation light at distance and/or near.',
          "Ask whether the light is on the line, or to one side of it. Horizontal: line right of the light → esophoria (neutralize with BO over OD); line left → exophoria (BI over OD). Vertical: line below the light → OD hyper (BD over OD, or equivalently BU over OS); line above → OD hypo (BU over OD, or BD over OS).",
          'Increase prism smoothly until the patient reports the line passes through the light — the neutralization endpoint.',
        ],
      },
      {
        heading: 'What the patient sees / what to watch',
        items: [
          "The patient sees a colored streak and a separate plain light; the test depends entirely on their subjective report of one relative to the other — there's no clinician-observed movement.",
          'A broken/interrupted streak, or the loss of one image entirely rather than the two relating spatially, indicates suppression rather than a measurable phoria — the neutralization can\'t proceed as usual in that case.',
        ],
      },
      {
        heading: 'Record & interpret',
        items: [
          "Record the neutralizing prism as diopters + base direction (e.g. '6Δ BO'), separately for distance/near and horizontal/vertical as checked.",
          'The directional rules above (esophoria → BO, exophoria → BI; hyper eye → BD over that eye) were checked against independent optics references and match this standard convention exactly for a rod-over-OD setup.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "A single rod measures a linear (horizontal or vertical) phoria only — it doesn't measure torsion; use Double Maddox Rod for cyclotorsion.",
          "If your clinic's convention places the rod over OS instead of OD, every left/right direction on this card must be mirrored before use — don't apply the OD rule to an OS-rod setup unreversed.",
          'Full dissociation can occasionally read a slightly larger phoria than partial-dissociation techniques (e.g. Von Graefe) — note which technique was used if comparing across visits.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Schober Test uses the same red/green dissociation principle with a projector target instead of a rod/light — same direction conventions, different equipment.',
          'Von Graefe Technique measures the identical phoria in-phoropter, using Risley prisms to dissociate instead of a colored rod — interchangeable with this test; use whichever your chair is set up for.',
          'Double Maddox Rod is the torsional analogue of this same rod, used in pairs.',
          "The measured phoria feeds directly into Fusional Vergence Ranges and Sheard's Criterion.",
        ],
      },
    ],
  },
  {
    id: 'von-graefe-test',
    title: 'Von Graefe Technique',
    tags: ['diplopia', 'binocular', 'phoria', 'phoropter', 'dissociation'],
    purpose: 'Phoropter-based subjective measurement of horizontal/vertical phoria with Risley prisms — the standard in-refraction phoria technique.',
    youNeed: ['Phoropter with Risley prisms', 'Isolated letter target one line above the worse eye’s best-corrected acuity (distance chart or near card)'],
    meta: ['6 M (DISTANCE) OR 40 CM (NEAR)', 'HABITUAL OR BEST-CORRECTION Rx IN PLACE'],
    moreSections: [
      {
        heading: 'What is this test / what it assesses',
        items: [
          'A phoropter-based subjective phoria technique: two Risley (rotary) prisms dissociate the eyes and the deviation is read directly off the prism scale in diopters — the standard in-refraction way to obtain a phoria, alongside Maddox Rod and Schober Test.',
          "Measures the same thing those two do (horizontal and vertical phoria magnitude) via a third dissociation principle — prism-induced diplopia of a single plain letter target, rather than a colored streak or a red/green cross. The three are interchangeable citations for the same distance/near phoria finding, not three separate findings.",
        ],
      },
      {
        heading: 'Prism roles: measuring vs dissociating',
        items: [
          'Two prisms are used together, one per eye, and their roles swap depending on which axis is being measured — this is the one thing that trips people up first learning the test.',
          'Horizontal phoria: 12Δ base-in over OD is the MEASURING prism (varied); 6Δ base-up over OS is the DISSOCIATING prism (held fixed) — it displaces OS’s view vertically so the two eyes’ images can’t fuse horizontally, letting the horizontal deviation show as a sideways offset.',
          'Vertical phoria: the same 6Δ prism over OS becomes the MEASURING prism (varied up/down from its 6Δ BU start); the 12Δ base-in over OD becomes the DISSOCIATING prism (held fixed) — it now separates the images sideways instead, so the vertical deviation shows as an up/down offset.',
          "12Δ BI OD / 6Δ BU OS is the standard starting convention, not a rule with no exceptions — increase the dissociating prism further first if it doesn't fully separate the images for a given patient, before starting to vary the measuring prism.",
        ],
      },
      {
        heading: 'Procedure in detail',
        items: [
          'Isolated line/letter block one line above the worse eye’s best-corrected acuity, at 6 m for distance or a near card at 40 cm — habitual or best-correction Rx in place, correct PD dialed in.',
          "Horizontal: with the 6Δ BU OS dissociator in place, reduce the OD measuring prism smoothly (roughly 2Δ/sec) while the patient watches the target; ASK them to report when the two letter blocks line up directly one under the other — ‘like buttons on a shirt’ is the classic instruction.",
          'Vertical: swap roles — hold 12Δ BI fixed over OD, and rotate the OS prism away from its 6Δ BU start until the patient reports the two (now side-by-side) blocks are level with each other.',
          'For a more precise endpoint, pass through alignment, let the images separate again on the far side, then bring the prism back to the endpoint a second time from that direction — average the two readings.',
          'Repeat the whole sequence at near (40 cm) with a near vertical-line target.',
        ],
      },
      {
        heading: 'What the patient sees / what to watch',
        items: [
          "The patient sees one letter block, then two as the dissociating prism separates them — a concrete instruction ('tell me when they line up like buttons on a shirt' for horizontal; 'tell me when they're side by side and level' for vertical) works better than an abstract 'tell me when aligned'.",
          'No color filters are involved — a plain letter target, unlike Maddox Rod/Schober’s colored dissociation — so this technique doesn’t depend on the patient reliably distinguishing red from green.',
          "Suppression of one eye's image, or an inability to reliably localize the offset, means the endpoint can't be obtained this way — fall back to Maddox Rod, Schober Test, or Cover Test.",
        ],
      },
      {
        heading: 'Record & interpret',
        items: [
          'Record the measuring prism’s diopters and base direction at the averaged endpoint, separately for distance/near and horizontal/vertical: base-in = exophoria, base-out = esophoria; base-up/base-down on the measuring prism = a hyperphoria/hypophoria — state which eye, same eye-labeling convention as Maddox Rod and Schober Test.',
          'Typical normal ranges (a starting reference point, not a substitute for symptoms and the rest of the exam): distance lateral phoria roughly orthophoria to 2Δ exophoria; near lateral phoria roughly 3–6Δ exophoria; vertical phoria ≤1Δ in either direction.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Moving the measuring prism too fast — a rushed endpoint reads differently from a deliberate one; move smoothly and wait for the patient's actual report, don't anticipate it from their expression.",
          'Taking only one endpoint instead of bracketing and averaging two, as above — a single-pass reading is measurably less repeatable.',
          'The phoropter setting itself can induce proximal convergence not present in free space, and reliability studies consistently find Von Graefe the least repeatable of the standard phoria techniques (though it remains a universally accepted standard) — treat one reading as an estimate, not a precise fixed number, and prefer Cover Test when the two disagree materially.',
          'Measures the phoria only, not fusional reserves — pair with Fusional Vergence Ranges (BI/BO), typically measured next with the same Risley prisms.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Maddox Rod and Schober Test measure the identical phoria via different dissociation principles (colored streak, red/green cross) — the three are interchangeable citations for the same distance/near phoria finding, not three separate findings to add together.',
          "The measured phoria feeds into Fusional Vergence Ranges and Sheard's/Percival's Criteria exactly as a Maddox Rod or Schober Test reading would.",
        ],
      },
    ],
  },
  {
    id: 'double-maddox-rod',
    title: 'Double Maddox Rod',
    tags: ['diplopia', 'vertical', 'torsion', 'binocular'],
    purpose: 'Measure cyclotorsion (excyclo/incyclo) — most useful when a vertical deviation does not fully explain the symptoms.',
    youNeed: ['Two Maddox rods (one red, one white)'],
    moreSections: [
      {
        heading: 'What is this test / what it assesses',
        items: [
          'Measures cyclotorsion — a rotational misalignment around the visual axis (excyclotorsion or incyclotorsion) — rather than a linear (horizontal/vertical) deviation.',
          'Most useful when a vertical deviation doesn\'t fully explain the symptoms, or as part of localizing a suspected superior oblique palsy alongside Parks 3-Step Test.',
        ],
      },
      {
        heading: 'Setup — verified convention',
        items: [
          'By convention, the red rod goes over OD and the white/clear rod over OS (verified against AAO EyeWiki/Stanford teaching material). Be aware this specific setup has a documented bias — patients tend to over-attribute torsion to the eye with the red rod — so if a result seems borderline or inconsistent with the rest of the exam, consider repeating with both rods the same color (adding a base-down prism over one eye to separate the two images) to rule the bias out.',
          'Both rods start with grooves vertical (axis 90°), so both eyes initially see a horizontal streak — same single-eye optics as Maddox Rod, doubled and made rotatable.',
        ],
      },
      {
        heading: 'Procedure in detail',
        items: [
          'Patient fixates a single muscle light/point source at near, through both rods.',
          'Ask whether the two horizontal streaks are parallel to each other (and to the floor), or tilted relative to one another.',
          "If tilted, rotate each rod's axis in the trial frame until the patient reports the streaks are parallel — the neutralization endpoint, the same principle as Maddox Rod's prism neutralization.",
          "Read each eye's rotation directly off the trial frame's axis scale at that endpoint.",
        ],
      },
      {
        heading: 'Reading the result — verified sign convention',
        items: [
          "Excyclotorsion = that eye's 12 o'clock position (superior pole) rotated temporally (away from the nose) to reach the parallel endpoint. Incyclotorsion = it rotated nasally (toward the nose). This is an absolute per-eye rule — apply it separately to OD and OS; the physical nasal/temporal directions are mirrored between the two eyes, but the excyclo/incyclo label is not.",
          "Record torsion per eye (e.g. '3° excyclotorsion OD, 3° incyclotorsion OS'), not just one combined number — the pattern between the two eyes is part of the finding.",
        ],
      },
      {
        heading: 'Common patterns',
        items: [
          'Excyclotorsion of the hypertropic eye is the classic finding in superior oblique palsy — the superior oblique is an incyclotorter, so a weak one lets that eye rotate into excyclotorsion.',
          'Torsion greater than roughly 10° (combined) is more typical of a bilateral superior oblique palsy than a unilateral one, though both can present with excyclotorsion — treat this as a guideline to correlate with the rest of the exam, not a strict cutoff (per StatPearls).',
          'Torsion that stays the same across gaze positions is comitant; torsion that varies by gaze position is incomitant.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Checking only one gaze position — repeat in more than one if the history suggests a variable deviation.',
          'Not considering the red-rod attribution bias noted above when a result seems inconsistent with the rest of the exam.',
          "Measures torsion only — it doesn't localize which muscle is responsible; pair it with Parks 3-Step Test when a vertical component is also present.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Single Maddox Rod is the same optical principle applied to a linear phoria rather than torsion.',
          "Torsion findings here are typically interpreted alongside Cover Test's vertical finding and Parks 3-Step Test's muscle localization, not in isolation.",
        ],
      },
    ],
  },
  {
    id: 'parks-3-step',
    title: 'Parks 3-Step Test',
    tags: ['diplopia', 'vertical', 'muscle-palsy'],
    purpose: 'Localize a single cyclovertical (vertical) muscle palsy — not valid for horizontal-only or combined palsies.',
    youNeed: ['Cover test findings in primary gaze, right gaze, left gaze, right head tilt, and left head tilt (already on hand)'],
    moreSections: [
      {
        heading: 'What is this test / why the 3 steps work',
        items: [
          'A stepwise elimination: primary-gaze hypertropia narrows the weak muscle to 4 candidates (the higher eye\'s two depressors, or the lower eye\'s two elevators); gaze position narrows those 4 to 2; head tilt narrows the 2 to 1. Each step exploits a different piece of extraocular-muscle physiology, not an arbitrary rule.',
        ],
      },
      {
        heading: 'Step 1 — why primary-gaze hypertropia narrows to 4 muscles',
        items: [
          'A hypertropia means the higher eye is under-depressed, or the lower eye is under-elevated (or both) — so the weak muscle must be one of the higher eye\'s two depressors (inferior rectus, superior oblique) or the lower eye\'s two elevators (superior rectus, inferior oblique).',
        ],
      },
      {
        heading: 'Step 2 — why gaze position narrows to 2 muscles',
        items: [
          'The vertical recti (superior/inferior rectus) generate their strongest vertical pull with the eye ABDUCTED (looking away from the nose); the obliques (superior/inferior oblique) generate theirs with the eye ADDUCTED (looking toward the nose). Whichever gaze direction worsens the hypertropia identifies which pair — recti-dominant or oblique-dominant — is doing the vertical work in that gaze, narrowing Step 1\'s 4 candidates to 2.',
        ],
      },
      {
        heading: 'Step 3 — why head tilt (Bielschowsky) resolves the final muscle',
        items: [
          'Tilting the head engages a reflex torsional response to keep the retinal image upright: the eye on the side of the tilt intorts (via its superior rectus + superior oblique); the other eye extorts (via its inferior rectus + inferior oblique).',
          'When one of a pair of torting muscles is weak, its partner overacts to complete the torsional duty, adding an unwanted vertical deviation on that tilt — so a superior-muscle palsy (superior rectus or superior oblique) worsens on head tilt TOWARD the affected eye, and an inferior-muscle palsy (inferior rectus or inferior oblique) worsens on head tilt AWAY from the affected eye. That rule is what the interactive selector above applies to reach the final muscle.',
        ],
      },
      {
        heading: 'Verification status of the muscle table — please read',
        items: [
          "Steps 1–3's underlying mechanism (vertical-rectus-in-abduction/oblique-in-adduction; head-tilt torsional pairing) is confirmed against two independent reputable sources (AAO EyeWiki and Wikipedia, cross-checked against each other) and is standard, non-controversial physiology.",
          "The specific 8-row lookup table the selector above uses was deduced by applying that verified mechanism systematically, then checked for internal self-consistency and left/right mirror symmetry (see parksThreeStep.test.ts) — it was not copied verbatim from a single published table, since no source fetched during verification published the full 8-row table as plain text. Cross-check it against a primary reference (e.g. a textbook plate) before relying on it clinically, even though the mechanism it's built from is solid.",
        ],
      },
      {
        heading: 'Common abnormal pattern — classic example',
        items: [
          'Right hypertropia in primary gaze, worse in left gaze, worse on right head tilt → localizes to the right superior oblique — the single most common presentation this test is used for (classic superior oblique palsy).',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Applying the test to a deviation that isn\'t a single isolated cyclovertical palsy — it becomes unreliable with more than one paretic muscle, restrictive strabismus (e.g. thyroid eye disease, orbital fracture), skew deviation, myasthenia gravis, prior strabismus surgery, or a long-standing/decompensated deviation where the pattern may have spread or normalized (per AAO EyeWiki and StatPearls).',
          'Forcing an answer from a borderline or inconsistent gaze/tilt measurement — repeat the measurement rather than guessing which position was "worse."',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Cover Test in multiple gaze and head-tilt positions is the actual source of the findings this test interprets — Parks 3-Step doesn't replace cover test, it reads the pattern cover test already produced.",
          "Double Maddox Rod's torsion finding (excyclotorsion of the hyper eye) often corroborates the muscle this test localizes, particularly for superior oblique palsy.",
        ],
      },
    ],
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
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'A fast first triage step whenever acuity is worse than expected: is the reduction likely explained by an uncorrected/miscorrected refractive error, or does it point toward a non-refractive ocular cause (media opacity, macular/retinal or optic nerve disease)?',
          "Also used on a monocular diplopia complaint — true monocular diplopia (still double with the fellow eye covered) is almost always optical (irregular cornea, early cataract, uncorrected astigmatism) rather than neurological, and pinhole resolving the doubling supports that.",
        ],
      },
      {
        heading: 'The optical principle',
        items: [
          'The pinhole admits only a narrow central bundle of rays close to the visual axis, drastically reducing the blur circle any given ray-bundle can form on the retina — the same effect as stopping down a camera aperture to extend depth of focus.',
          "It narrows nearly any degree/type of refractive error's blur circle (sphere, cylinder, or irregular astigmatism alike), which is why it can approximate best-corrected acuity without needing to know the actual refractive error first.",
        ],
      },
      {
        heading: 'Setup & important conditions',
        items: [
          'Habitual correction stays in place if worn — pinhole is added on top, not used as a substitute for the patient\'s glasses/contacts.',
          'A multi-hole occluder is easier for patients to self-align than a single aperture and is the standard chairside choice; a single pinhole works but is less forgiving of small movements.',
          'Test one eye at a time, with the fellow eye occluded — the result must be attributed to a single eye.',
        ],
      },
      {
        heading: 'Procedure',
        items: [
          'Have the patient read the acuity chart with best correction, without the pinhole, and note the acuity.',
          'Add the pinhole in front of the same eye and have them read again, allowing a few seconds to find the hole(s).',
          'Compare the two acuities for that eye, then repeat on the other eye.',
        ],
      },
      {
        heading: 'Interpreting the result',
        items: [
          'Improves/resolves to normal (or to the expected acuity): supports an optical/refractive explanation — the patient likely needs a refraction update, or has an optical media issue the pinhole is narrowing around (e.g. irregular astigmatism).',
          'No change, or only slight improvement: makes a purely refractive explanation less likely and raises suspicion for a non-refractive cause — media opacity (cataract, corneal scarring), or retinal/macular/optic nerve pathology — and should prompt further workup rather than being treated as reassuring.',
          'A small pinhole can occasionally reduce acuity in an eye with significant media opacity (the aperture is small enough to be blocked by a central opacity) or in high refractive error where too little light reaches the retina — a paradoxical worsening is itself informative, not a test failure.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Pinhole result is not diagnostic by itself — it's a triage sign, not a substitute for refraction or a dilated exam. A positive (improving) result still warrants confirming with an actual refraction; a negative result still warrants investigating the ocular cause, not just being noted and left.",
          'Poor alignment (patient not looking through a hole) or too little light reaching the eye through the aperture can produce a false "no improvement" — check technique before concluding a non-refractive cause.',
          "Doesn't localize or characterize a non-refractive cause — it only flags that one is likely present.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'A resolving pinhole on a monocular diplopia complaint points toward the same optical/refractive workup as the Cover Test does for binocular diplopia — the two are the branch point between monocular and binocular causes.',
        ],
      },
    ],
  },
  {
    id: 'worth-4-dot',
    title: 'Worth 4 Dot',
    tags: ['diplopia', 'binocular', 'fusion', 'suppression', 'sensory', 'projector'],
    purpose: 'Assess binocular sensory status — fusion, suppression, or diplopia — with dissociated colored targets.',
    youNeed: ['Worth 4 Dot projector target', 'Red/green glasses'],
    meta: ['DISTANCE (SEPARATE NEAR TARGET NEEDED FOR NEAR)', 'DIM ROOM'],
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "Assesses binocular sensory status — whether the two eyes' images are being combined (fusion), one is being actively ignored (suppression), or both are seen but not combined (diplopia) — under conditions that dissociate the eyes by color rather than by fully occluding one.",
          'Useful wherever sensory adaptation is a concern: strabismus (does the deviated eye suppress, or does the patient experience diplopia?), amblyopia workup, and correlating a motor finding (Cover Test/Maddox Rod) with what the patient is actually experiencing perceptually.',
        ],
      },
      {
        heading: 'The dissociation principle',
        items: [
          'Red and green filters each pass their own color and block (or heavily attenuate) the opposite color, so which lens an eye wears determines which of the illuminated dots that eye can see — a color-based analogue of the rod-based dissociation in Maddox Rod/Schober.',
          "The target has 4 lit dots: one red, two green, one white. The white dot has no dedicated color filter to exclude it, so it is visible to whichever eye(s) are open — it's the one dot both eyes can potentially see, which is exactly what makes it diagnostic.",
        ],
      },
      {
        heading: 'Setup & important conditions',
        items: [
          'This card documents red filter over OD, green filter over OS — mirror every eye assignment below if your setup is reversed.',
          'Dim room — the colored dots need to stand out clearly against the background for the dissociation to work cleanly.',
          'The distance projector target and the near target are different physical targets — a dedicated near card/flashlight target is needed for near testing; don\'t assume the distance projector slide covers both.',
          'Habitual correction in place.',
        ],
      },
      {
        heading: 'Procedure',
        items: [
          'Patient wears the red/green glasses (red over OD, green over OS, per this card\'s convention).',
          'Present the 4-dot target at distance and/or near.',
          "Ask how many lights they see, what colors, and how they're arranged (rather than leading with a yes/no question).",
        ],
      },
      {
        heading: 'What the patient reports and what it means',
        items: [
          '2 red dots only: OD (red-lens eye) suppressing — only the red-visible dots are seen, so the single red dot and the white dot (defaulting to appear red through the red lens the patient is attending with) are reported, i.e. 2 dots total.',
          '3 green dots only: OS (green-lens eye) suppressing — the two green dots plus the white dot (appearing green) are seen, i.e. 3 dots.',
          '4 dots, with the bottom one flickering or appearing pink/mixed: normal fusion — both eyes are contributing, and the white dot alternates or blends between red and green because both eyes see it simultaneously.',
          '5 dots, or a stable arrangement that doesn\'t match the true target: diplopia — both eyes are seeing their own set without being combined, so the red dot and the two green dots are seen in two separate, non-overlapping arrangements (2 + 3 = 5, or the two sets appear displaced from one another).',
        ],
      },
      {
        heading: 'Suppression vs diplopia — the key distinction',
        items: [
          'Suppression (2 or 3 dots) means the visual system is actively ignoring one eye\'s input to avoid diplopia — common and often adaptive in longstanding strabismus/amblyopia.',
          "Diplopia (5 dots) means both eyes' input is being perceived, unreconciled — relevant in recent-onset or decompensating deviations where suppression hasn't (or can't) develop.",
          'A pattern that swaps or alternates between the suppression arrangements (sometimes 2, sometimes 3 dots on repeat trials) still indicates suppression, but specifically alternating suppression rather than suppression fixed to one eye — worth noting which, since it has a different prognostic implication (alternating suppression rarely amblyopes as deeply as fixed suppression).',
        ],
      },
      {
        heading: 'Distance vs near implications',
        items: [
          'Fusion at near but suppression/diplopia at distance (or vice versa) is a real and clinically meaningful pattern, not noise — some deviations (e.g. intermittent exotropia) are much more likely to break down at one distance than the other, so both should be checked and recorded separately rather than assuming the near result generalizes.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "A room that isn't dim enough lets the white background compete with the dots, muddying the colors patients report — don't skip dimming the room.",
          "The test only samples the specific dissociated angle of the target used (usually within the fovea/parafovea for the near target, or subtending a larger visual angle at distance) — a small central suppression scotoma can be missed at one testing distance and caught at another, which is part of why both are checked.",
          "Doesn't measure the deviation's magnitude or direction — it's a sensory status test, not a motor measurement; pair it with Cover Test/Maddox Rod/Schober for the motor finding.",
          "A patient who can't reliably describe colors or counts (young children, cognitive impairment) may need a modified/simplified version or may not be a good candidate for this test.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Cover Test and Maddox Rod/Schober establish the motor finding (is there a deviation, and how large); Worth 4 Dot adds the sensory correlate (is the patient suppressing, fusing, or diplopic given that deviation) — the two are read together, not as substitutes for one another.',
          'Stereoacuity is a finer-grained sensory fusion test; a patient who fuses on Worth 4 Dot may still have reduced or absent stereopsis worth checking separately.',
        ],
      },
    ],
  },
  {
    id: 'schober-test',
    title: 'Schober Test (Cross Test)',
    tags: ['diplopia', 'binocular', 'phoria', 'projector', 'dissociation'],
    purpose: 'Chair-side subjective measurement of horizontal/vertical deviation using the standard projector cross-and-circle target.',
    youNeed: ['Projector Schober/cross target', 'Red/green glasses', 'Prism bar or loose prisms'],
    meta: ['DIM ROOM', 'PATIENT AT THE PROJECTOR CHART DISTANCE'],
    moreSections: [
      {
        heading: 'What is this test / what it assesses',
        items: [
          'A projector-based subjective phoria/tropia measurement using red/green dissociation instead of a Maddox rod streak — measures the same thing (horizontal and vertical deviation magnitude) via a different dissociating principle, and is often preferred chairside because the target (a cross inside circles) is easier for patients to describe precisely than a streak-vs-light relationship.',
          "Complementary to Cover Test's clinician-observed movement, in the same way Maddox Rod is — the finding here comes from the patient's own report, not an observed refixation.",
        ],
      },
      {
        heading: 'The dissociation principle',
        items: [
          'The red filter and green filter each pass their own color and exclude the other, so the red-filtered eye sees only the red element of the target (the cross) and the green-filtered eye sees only the green element (the circles) — each eye is shown a different piece of one combined image, exactly as red/green glasses do for Worth 4 Dot, just with a cross/circle target instead of 4 dots.',
          "Because each eye's percept is a different color, the two can only be compared spatially (is the cross centered in the circles, or displaced?) because the filters have prevented fusion from locking them together — displacement of the cross relative to the circles is the phoria/tropia made visible.",
        ],
      },
      {
        heading: 'Setup & important conditions',
        items: [
          'This card documents red filter over OD (sees the cross), green filter over OS (sees the circles) — mirror every left/right direction below if your setup is reversed.',
          'Uses the same projector and red/green glasses as Worth 4 Dot — no extra equipment beyond what a Worth 4 Dot setup already has, plus a prism bar/loose prisms for neutralization.',
          'Dim room, patient seated at the standard projector chart distance (per your chart\'s calibration — typically 6 m for distance testing), habitual correction in place.',
        ],
      },
      {
        heading: 'Procedure',
        items: [
          "Present the cross-and-circle target; ask the patient where the cross appears relative to the circles (centered, or off to a side/up/down).",
          "If displaced, add prism (base toward the side the cross needs to move to reach center — see the neutralize rules below) and increase smoothly.",
          "Don't stop at a rough estimate — continue until the patient confirms the cross is centered in the circles; that endpoint is the measurement.",
          'Read the neutralizing prism amount directly off the bar/lens at that endpoint.',
        ],
      },
      {
        heading: 'What each eye sees / interpreting displacement',
        items: [
          "OD (red filter) sees only the cross; OS (green filter) sees only the circles — the patient is reporting the cross's position relative to a frame only OS can see, so the direction of displacement is a direct readout of OD's positional error relative to OS.",
          'Horizontal: cross displaced right of center (uncrossed diplopia direction) → esophoria, neutralize with base-out (BO); cross displaced left (crossed) → exophoria, neutralize base-in (BI).',
          'Vertical: cross displaced down → OD hyper, neutralize base-down over OD (equivalently base-up over OS); cross displaced up → OD hypo, neutralize base-up over OD (equivalently base-down over OS) — same eye-labeling convention as Maddox Rod.',
        ],
      },
      {
        heading: 'Prism neutralization — the endpoint',
        items: [
          "Neutralization means finding the prism power that brings the cross exactly into the center of the circles, not merely closer — an approximate endpoint understates the true deviation.",
          'The neutralizing amount, recorded in prism diopters with base direction, is the phoria (or tropia) magnitude for that axis at that distance.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Accepting the patient's first estimate instead of confirming a truly centered endpoint — re-ask/re-confirm before recording.",
          "If your clinic's convention places red over OS instead of OD, every direction rule above must be mirrored — don't apply the red-OD rule to a reversed setup.",
          "Like Maddox Rod, this is a subjective, patient-report-dependent measurement — a patient who struggles to localize or describe the cross's position (young children, poor cooperation, dense suppression of one eye) may not give a reliable result; a stable, well-cooperating patient is assumed.",
          'Measures a linear (horizontal or vertical) deviation only — it doesn\'t assess torsion; see Double Maddox Rod for cyclotorsion.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Maddox Rod uses the same red/green-independent dissociation logic (a rod streak vs. a point light) rather than a projected cross/circle target — same direction conventions, different equipment; use whichever your chair has set up.',
          'Von Graefe Technique measures the identical phoria/tropia in-phoropter with Risley prisms instead of a projector — a third interchangeable option alongside this test and Maddox Rod.',
          'Uses the identical projector slide setup as Worth 4 Dot — the two are often performed back-to-back since no equipment change is needed between them.',
          "The measured phoria/tropia here feeds into the same downstream findings as Maddox Rod's — Fusional Vergence Ranges and Sheard's Criterion.",
        ],
      },
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
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "The closest point a target can be held while the patient still fuses it as one — the standard first screen for Convergence Insufficiency, and typically the fastest binocular test to perform of the whole workup.",
          'A receded NPC, together with near-work-related asthenopia symptoms and reduced base-out (convergence) fusional reserve, forms the classic Convergence Insufficiency pattern — this test alone is only one leg of that pattern, not the diagnosis by itself.',
        ],
      },
      {
        heading: 'What it depends on',
        items: [
          "Convergence is a fusional vergence demand that increases as the target nears — NPC finds the point where that demand exceeds what the patient's fusional convergence (and accommodative convergence) can sustain, at which point one eye gives up alignment and the target doubles.",
        ],
      },
      {
        heading: 'What the patient reports / what the clinician observes',
        items: [
          "The break is normally reported subjectively by the patient ('it becomes two'); some clinicians also track an objective break — the examiner visually sees one eye drift outward before, or instead of, the patient reporting diplopia. Either is a valid endpoint; be consistent about which you're recording, since the objective break is sometimes slightly closer than the subjective one.",
          'Recovery (the target becoming single again as it moves away) is a separate, usually more informative number than break alone — a break that recovers promptly is a different finding from one that stays broken for a long excursion.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Moving the target too quickly to let convergence keep pace — move slowly and evenly.",
          "A non-accommodative or poorly visible target under-recruits accommodative convergence and can make convergence look worse than it is — use a genuinely accommodative target (small print, not a blank penlight tip) unless testing tonic/fusional convergence specifically.",
          "Testing only once — NPC fatigues with repetition; a break that recedes further on repeat trials is itself a relevant finding worth recording, not just noise to average away.",
          "A normal single-trial NPC doesn't rule out a fatigue-related complaint — repeat 2–3 times if symptoms suggest a decompensating pattern over a task, not an instantaneous one.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Fusional Vergence Ranges (BI/BO) measures the same convergence system's amplitude at a fixed distance rather than the distance at which it fails — the two are usually read together for a Convergence Insufficiency workup.",
          'Gradient AC/A helps distinguish whether a related near phoria finding is being driven accommodatively.',
        ],
      },
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
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "Fusional vergence is the eyes' ability to converge or diverge, on demand, to keep a single image fused despite a phoria pulling them off — this test measures how much of that ability is in reserve in each direction, the raw data Sheard's criterion is checked against.",
          'BO prism forces the eyes to converge to stay fused — it measures positive fusional vergence (convergence reserve). BI prism forces them to diverge — it measures negative fusional vergence (divergence reserve). Those two terms (positive/negative fusional vergence) and BI/BO are used interchangeably on this card and elsewhere in the guide.',
        ],
      },
      {
        heading: 'The easily-confused part: compensating reserve vs. neutralizing prism',
        items: [
          "This is the single most common point of confusion returning to binocular testing after time away, so it's worth stating explicitly: the fusional reserve that COMPENSATES a phoria is the SAME direction the phoria itself pulls toward, not the direction that would neutralize it.",
          "An exophoria pulls the eyes outward (divergent), so the eyes must actively CONVERGE to hold single vision against it — the compensating reserve to check is BO (positive fusional vergence / convergence). An esophoria pulls the eyes inward (convergent), so the eyes must actively DIVERGE to hold single vision against it — the compensating reserve to check is BI (negative fusional vergence / divergence).",
          "This is the OPPOSITE pairing from neutralizing/prescribing prism, where prism is placed to cancel the deviation rather than to demand the effort that already compensates it: an exophoria is neutralized with BASE-IN prism, and an esophoria is neutralized with BASE-OUT prism (see Maddox Rod / Schober Test). Exo → BO reserve, but BI neutralizing prism. Eso → BI reserve, but BO neutralizing prism. Keep these two questions ('what compensates it' vs. 'what cancels it') separate in your head — they use opposite prism directions for the same phoria.",
        ],
      },
      {
        heading: 'Blur, break, and recovery',
        items: [
          "Blur is the first endpoint: the point where fusion is still holding the image single but accommodation has had to change to compensate, so clarity is lost first. It is the preferred, more conservative endpoint for Sheard's criterion.",
          "Break is the point fusion actually gives way and the target visibly doubles — a less conservative endpoint, used as a fallback only when blur wasn't reported (some patients, or some directions of vergence, don't reliably report a distinct blur before breaking).",
          "Recovery, measured while reducing the prism back down after break, is the point single vision is regained — it's normally somewhat lower than the break value (hysteresis) and reflects how easily fusion re-establishes itself, not just how far it could be pushed.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Recording break as if it were blur (or vice versa) — they are two different endpoints with different clinical weight; label whichever was actually reported.",
          'A jump straight to break with no blur reported at all is worth a repeat — it can mean the prism increments were too coarse to catch the blur point.',
          'Testing BI immediately after BO (or vice versa) without letting the patient rest can carry over a residual vergence adaptation from the first direction into the second — if a result looks inconsistent with symptoms, consider repeating after a short rest.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Sheard's Criterion is the direct downstream use of this result — it compares the compensating reserve (per the direction rule above) against twice the corresponding phoria.",
          'Near Point of Convergence screens the same convergence system from a different angle (distance-to-break rather than prism-amount-to-break) and is usually checked alongside this test for a Convergence Insufficiency workup.',
          'Vergence Facility measures how quickly (not how much) the patient can alternate fusing through BI/BO prism — a speed analogue of the amplitude measured here.',
        ],
      },
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
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "The maximum accommodative power the eye can generate — the ceiling of the accommodative system, as opposed to how fast it can be used (Accommodative Facility) or how much of it is needed while binocular fusion is held (NRA/PRA).",
          'Amplitude naturally declines with age (presbyopia) — the point of comparing it against an age-expected figure is to catch amplitude that is low even for the patient\'s age, not to expect a fixed number at every age.',
        ],
      },
      {
        heading: 'Why monocular',
        items: [
          "Tested one eye at a time so the result reflects each eye's own accommodative system in isolation, uncomplicated by any binocular vergence-accommodation interaction — a binocular (both-eyes) amplitude can differ from the monocular one precisely because of that interaction, which is a separate finding, not a measurement error.",
        ],
      },
      {
        heading: 'The sustained-blur endpoint',
        items: [
          "'Sustained' blur, not the first flicker of blur, is the endpoint — a target that blurs and instantly clears again as the patient keeps trying is not yet at the true limit. Stopping too early at a transient blur overstates how little amplitude remains as a problem, and stopping too late (letting the patient strain past sustained blur) overstates the amplitude itself.",
        ],
      },
      {
        heading: 'Converting near-point distance to diopters',
        items: [
          'Amplitude in diopters = 100 ÷ the near-point distance in centimeters (equivalently, 1 ÷ the distance in meters) — the same reciprocal relationship used throughout ophthalmic optics for vergence at a given distance.',
          "A reduced Snellen card with a pre-printed diopter scale lets you read the amplitude directly off the distance the blur occurred at, without doing this arithmetic chairside — that's the purpose of the distance scale referenced in Equipment above.",
        ],
      },
      {
        heading: 'Relationship to age-expected amplitude — please read before relying on a specific number',
        items: [
          "Hofstetter's formula (minimum expected amplitude ≈ 15 − 0.25 × age, in years) is the figure most commonly cited for this comparison in optometric teaching, but it was derived in 1950 from limited survey data and more recent population studies report meaningfully lower real-world minimums (particularly in children) than Hofstetter's formula predicts.",
          "Treat any single age-expected number, including Hofstetter's, as a rough orientation rather than a hard pass/fail cutoff — see CLINICAL REVIEW NEEDED note below.",
        ],
      },
      {
        heading: 'Why reduced amplitude alone is not Accommodative Insufficiency',
        items: [
          "A below-expected amplitude is a sign, not a diagnosis — Accommodative Insufficiency is a clinical conclusion that also weighs near-work symptoms, Accommodative Facility (is the reduced amplitude also making sustained near focus effortful in practice?), and NRA/PRA. An asymptomatic patient with a lower-than-expected amplitude who reads comfortably all day does not necessarily need to be labeled or treated for it.",
        ],
      },
      {
        heading: 'The push-up overestimation — a real and measured effect',
        items: [
          "Push-up amplitude is systematically higher than the amplitude measured with a minus-lens (push-down/pull-away) method, by a clinically meaningful margin that itself increases with age — largely because the approaching target grows in retinal image size as it nears (a magnification/proximal cue), which can trigger a stronger accommodative-convergence response than a purely optical stimulus would.",
          'This means push-up amplitude is not directly interchangeable with a minus-lens amplitude from a different visit or a different clinician\'s preferred method — stay consistent with the same technique for a given patient across visits, and don\'t compare a push-up figure against a minus-lens-derived reference table.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Moving the target too fast to let the patient report sustained (not transient) blur accurately.',
          "Testing without the patient's correct habitual near correction in place invalidates the result — an uncorrected refractive error is measured as if it were an accommodative deficit.",
          'A poorly lit or too-small target lets the patient lose the letters to acuity/contrast limits before they lose them to blur, understating true amplitude.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Monocular Accommodative Facility measures how quickly accommodation can be used across a fixed lens demand — a normal amplitude with poor facility is a distinct finding from a genuinely reduced amplitude, and the two are read together, not interchangeably.',
          'NRA/PRA measures the accommodative range available while binocular fusion is simultaneously held — a different constraint than this test\'s monocular, fusion-free measurement.',
        ],
      },
    ],
  },
  {
    id: 'monocular-accommodative-facility-test',
    title: 'Monocular Accommodative Facility (MAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Measure how quickly each eye alone can shift accommodative demand — distinguishes a facility (speed) problem from an amplitude problem.',
    youNeed: ['±2.00 D flipper', 'Near target at 40 cm'],
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "Speed, not amount — how quickly one eye alone can shift its accommodative response between two fixed demands. A patient can have a perfectly normal Amplitude of Accommodation and still struggle here if the SPEED of shifting focus (e.g. between a book and a whiteboard) is the actual problem.",
        ],
      },
      {
        heading: 'The optical principle',
        items: [
          '+2.00 over the eye reduces the effective accommodative demand of the 40 cm target — clearing it means the eye can relax accommodation appropriately. −2.00 increases the effective demand — clearing it means the eye can stimulate additional accommodation on top of what the real target already needs. Alternating the two forces the accommodative system to repeatedly relax and then re-stimulate, which is what "facility" is measuring.',
        ],
      },
      {
        heading: 'Procedure notes',
        items: [
          'Habitual near correction stays in place; the fellow eye is occluded so the result reflects that eye\'s own accommodative system, uncomplicated by any binocular vergence interaction (see Binocular Accommodative Facility for the binocular comparison).',
          'Starting with +2.00 is the common convention, not a strict requirement — what matters is counting a full cycle (both signs cleared once each) consistently across the testing period.',
        ],
      },
      {
        heading: 'Interpreting which side is difficult',
        items: [
          "Which lens power was hard to clear matters more than the raw cycles/min count — the pattern-matching downstream relies on which side failed, not just how few cycles were completed.",
          "Persistent difficulty clearing PLUS suggests difficulty relaxing accommodation. Persistent difficulty clearing MINUS suggests difficulty stimulating additional accommodation. Difficulty with both suggests a more general facility problem rather than a directional one.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Advancing to the next lens before the patient actually reports clarity (rather than just elapsed time) undercounts true difficulty and overstates the cycle count.',
          "Doesn't measure amplitude — a patient can fail this test with a perfectly normal Amplitude of Accommodation, and vice versa; the two findings answer different questions and neither substitutes for the other.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Amplitude of Accommodation measures the ceiling this test is repeatedly exercising against, not the speed of reaching it.',
          "Binocular Accommodative Facility repeats this exact task with both eyes open — a difficulty that only appears binocularly (not here, monocularly) points toward a vergence-accommodation interaction rather than a purely accommodative limit.",
          'NRA/PRA measures the same relax/stimulate accommodative range in a single binocular reading rather than as a repeated timed task.',
        ],
      },
    ],
  },
  {
    id: 'binocular-accommodative-facility-test',
    title: 'Binocular Accommodative Facility (BAF)',
    tags: ['binocular', 'accommodation', 'facility', 'flippers'],
    purpose: 'Same as MAF but performed binocularly — a difficulty here that wasn’t present monocularly points toward a binocular vergence-accommodation interaction rather than a purely accommodative one.',
    youNeed: ['±2.00 D flipper', 'Near target at 40 cm'],
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "The same relax/stimulate accommodative-shift task as Monocular Accommodative Facility, but performed with both eyes open — so a binocular vergence interaction is now free to help or hinder the accommodative shift, unlike the monocular version which deliberately excludes it.",
        ],
      },
      {
        heading: 'Why the comparison against MAF is the point',
        items: [
          "Neither number is very informative alone — the useful finding is the COMPARISON. Difficulty that shows up binocularly but was NOT present monocularly points toward a binocular vergence-accommodation interaction (the two eyes' vergence demand is interfering with the accommodative shift) rather than a purely accommodative limitation. Difficulty present in both monocular and binocular testing points toward a genuine accommodative facility problem instead.",
        ],
      },
      {
        heading: 'What to also watch for',
        items: [
          'Diplopia or suppression reported during the flip (rather than just slow/failed clearing) is itself a relevant binocular finding, distinct from facility — note it if it occurs.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Interpreting a reduced BAF number in isolation, without checking it against the MAF result — the comparison is what carries the clinical meaning here, not either count on its own.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Monocular Accommodative Facility is the direct comparator this test is read against.',
          'Vergence Facility performs the analogous alternating-demand task with prism instead of lenses, probing vergence speed rather than accommodative speed — a difficulty on both may point toward a combined problem.',
        ],
      },
    ],
  },
  {
    id: 'gradient-aca-test',
    title: 'Gradient AC/A Ratio',
    tags: ['binocular', 'accommodation', 'vergence', 'phoria'],
    purpose: 'AC/A = accommodative convergence per diopter of accommodation. Measures how much the near phoria shifts per diopter of induced accommodative change — clarifies whether a phoria difference is accommodatively driven.',
    youNeed: ['Near phoria already measured (habitual correction)', 'Loose lenses or phoropter', 'Prism bar or Maddox rod for the repeat phoria'],
    meta: ['NEAR', 'BINOCULAR', 'HABITUAL CORRECTION IN PLACE'],
    doSteps: ['Measure near phoria with habitual correction', 'Add +1.00 D (or −1.00 D) over both eyes', 'Re-measure the near phoria with the lens in place'],
    keyAnchor: 'Gradient AC/A = change in phoria (Δ) / change in accommodative stimulus (D)',
    keyAnchorCaption: 'Change in phoria (Δ), divided by the lens power added (D).',
    whatToNote: ['Phoria before the lens', 'Phoria after the lens', 'Which lens power was used (+1.00 or −1.00)'],
    quickReminder: '− lens → ↑ accommodation → expected shift toward eso. + lens → ↓ accommodation → expected shift toward exo.',
    quickInterpretReminder: 'High ratio supports an accommodatively-driven near deviation — but alone it does not diagnose Convergence Excess; it only corroborates CE when the rest of the pattern fits, particularly a near phoria that is more esophoric/less exophoric than distance.',
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'How much the eyes converge for each diopter of accommodation exerted — a ratio, not a raw phoria number. It separates out how much of a near phoria is being driven by the accommodative response itself, as opposed to other factors (proximal, tonic, fusional).',
        ],
      },
      {
        heading: 'Gradient method vs. calculated method',
        items: [
          "This card is the GRADIENT method: the same fixation distance is used before and after, and only the accommodative demand is changed with a lens — isolating the accommodative contribution cleanly. A separate CALCULATED (heterophoria) method instead compares the distance phoria against the near phoria at their different natural distances, so it also picks up proximal convergence that occurs simply because the target is nearer — the two methods measure related but not identical things, and can give different ratios on the same patient. Don't treat them as interchangeable if comparing across visits or against a normative table.",
        ],
      },
      {
        heading: 'Interpreting the result',
        items: [
          "A high ratio means near phoria shifts a lot for a small accommodative change — near esophoria/reduced near exophoria driven mainly by accommodative convergence. This supports Convergence Excess only alongside the rest of the pattern (near more esophoric/less exophoric than distance) — a high ratio by itself is not a CE diagnosis.",
          "A low ratio means near phoria barely shifts even with an accommodative change — the near finding is not well explained by accommodation alone, which points more toward Convergence Insufficiency or a fusional/proximal cause instead.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Letting the target go blurry after the lens is added invalidates the comparison — the patient must actually be accommodating to the stated lens change, not just staring through blur; keep the target equally clear/legible before and after.',
          "Using inconsistent lens power (sometimes +1.00, sometimes −1.00) across visits changes the ratio obtained for reasons unrelated to the patient's actual accommodative-convergence relationship — stay consistent with the same lens power for a given patient.",
          "A phoria that shifts opposite the lens's expected direction (e.g. more exo after a minus lens, more eso after a plus lens) is not a normal AC/A finding — don't fold it into a positive ratio. Flag it as check measurement / unexpected direction and re-check technique before trusting the number.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "NRA/PRA and MAF/BAF also probe the accommodative system directly and are read alongside this ratio when characterizing a Convergence Excess/Insufficiency pattern.",
          "Fusional Vergence Ranges and Near Point of Convergence characterize the vergence side of the same near-symptom picture this ratio helps explain.",
        ],
      },
      {
        heading: 'CLINICAL REVIEW NEEDED',
        items: [
          "A commonly cited 'normal' gradient AC/A range of roughly 3:1 to 5:1 appears widely in optometric teaching material, but published normative studies of actual normal populations report meaningfully different (and more variable, method-dependent) figures — this card intentionally does not state a specific normal-range number for that reason. If a numeric normal range is wanted here, it should be added only after checking a primary reference you trust, not this general figure.",
        ],
      },
    ],
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
    quickInterpretReminder: 'Low PRA with minus-side MAF difficulty tend to corroborate each other — read them together, not in isolation.',
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'How much accommodative range is available in each direction while binocular fusion is actively held — a different constraint than the Amplitude of Accommodation test, which is monocular and fusion-free. NRA and PRA together define the total range within which the patient can accommodate without breaking single vision.',
        ],
      },
      {
        heading: 'The principle',
        items: [
          'NRA: adding plus lenses binocularly reduces accommodative demand while the eyes stay converged on the same near target — the endpoint is reached when accommodation has relaxed as far as it can while binocular fusion holds the target single; it measures the ability to RELAX accommodation under fusional constraint.',
          'PRA: adding minus lenses binocularly increases accommodative demand the same way — the endpoint is reached when accommodation can no longer stimulate further while fusion holds; it measures the ability to STIMULATE accommodation under fusional constraint.',
        ],
      },
      {
        heading: 'Interpreting the result',
        items: [
          "Low PRA (can't stimulate much more accommodation) corroborates a minus-side Monocular Accommodative Facility difficulty and points toward Accommodative Insufficiency as the shared explanation for both findings.",
          "Low NRA (can't relax accommodation as much as expected) is associated with an Accommodative Excess pattern rather than insufficiency — the opposite direction of problem.",
          'Neither figure is diagnostic alone — the value of NRA/PRA is in how it corroborates (or fails to corroborate) other accommodative findings such as Amplitude, MAF/BAF, and Percival\'s Criterion, not as a standalone pass/fail number.',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Continuing to add lenses past the first SUSTAINED blur to see "how far it goes" overstates the range — stop and record at first sustained blur, the same convention used for Amplitude of Accommodation.',
          "Testing without a validated, up-to-date distance and near Rx invalidates both values — an uncorrected refractive error is measured as if it were part of the accommodative range.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Percival's Criterion directly uses this test's total range (NRA + PRA) to check whether the habitual resting point sits comfortably within it.",
          'Amplitude of Accommodation and MAF/BAF probe the same accommodative system without the binocular-fusion constraint this test adds.',
        ],
      },
      {
        heading: 'CLINICAL REVIEW NEEDED',
        items: [
          "Commonly cited reference values (e.g. Morgan's norms, roughly NRA ≈ +2.00 D and PRA ≈ −2.37 D on average, each with a fairly wide normal spread) appear widely in optometric teaching material, but this card intentionally does not state them as a hard normal range — they're historical population averages with real spread, not a pass/fail cutoff. Verify against a primary reference before adding a specific numeric norm here.",
        ],
      },
    ],
  },
  {
    id: 'vergence-facility-test',
    title: 'Vergence Facility',
    tags: ['binocular', 'vergence', 'facility', 'flippers', 'prism-bar'],
    purpose: 'Measure how quickly the patient can alternate fusing through base-in and base-out prism — a facility (speed) analogue of the fusional vergence ranges.',
    youNeed: ['3Δ BI / 12Δ BO prism flipper (or equivalent loose prisms)', 'Near accommodative target'],
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'Speed, not amount — how quickly the patient can alternate fusing through a fixed base-in then base-out prism demand, the vergence analogue of Accommodative Facility. A patient can have normal Fusional Vergence Ranges (amplitude) and still struggle here if the speed of re-fusing is the actual limitation.',
        ],
      },
      {
        heading: 'The principle',
        items: [
          'The base-in side demands a fast divergence response to regain single vision; the base-out side demands a fast convergence response — alternating repeatedly exercises how quickly fusional vergence can be recruited in both directions, rather than how far it can be pushed once.',
        ],
      },
      {
        heading: 'Procedure notes',
        items: [
          'Both eyes open, viewing the near target throughout — this is inherently a binocular test, unlike Monocular Accommodative Facility which is deliberately done one eye at a time.',
          "The endpoint on each flip is BOTH single AND clear, matching the same convention as MAF/BAF — a target that's single but still blurred, or momentarily diplopic before settling, hasn't cleared yet.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Advancing to the next flip before the patient reports both single and clear, not just elapsed time.',
          'This test specifically needs prism flippers — a chair without them should skip it rather than substitute the Fusional Vergence Ranges result, which measures amplitude, not speed, and answers a different question.',
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Fusional Vergence Ranges (BI/BO) measures the amplitude this test is repeatedly exercising against, not the speed of reaching it.',
          'Monocular/Binocular Accommodative Facility is the accommodative analogue of this same speed concept, applied to lenses instead of prism.',
        ],
      },
    ],
  },
  {
    id: 'mem-retinoscopy-test',
    title: 'MEM Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'MEM = Monocular Estimate Method. Estimates the accommodative response (lag/lead) while the patient reads a near target held at the retinoscope — an objective cross-check on subjective near findings.',
    youNeed: ['Retinoscope', 'Near target with small text, attached near the retinoscope light'],
    meta: ['HABITUAL CORRECTION IN PLACE', 'PATIENT READING THE TARGET ALOUD'],
    doSteps: [
      'Observe the retinoscopic reflex while the patient reads',
      'Briefly interpose a plus or minus lens (under a second)',
      'Find the power that neutralizes the reflex (motion stops)',
    ],
    whatToNote: ['Lag or lead amount, in diopters (recorded signed: + = lag, − = lead)', 'Whether OD and OS differ'],
    interpret: [
      { finding: 'With-motion (needs plus to neutralize)', meaning: 'Accommodative lag — under-accommodating for the target.' },
      { finding: 'Against-motion (needs minus to neutralize)', meaning: 'Accommodative lead — over-accommodating for the target.' },
    ],
    quickInterpretReminder: 'Compare with Nott — the two should roughly agree.',
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "An OBJECTIVE cross-check on the patient's real-world near accommodative response — unlike NRA/PRA or Amplitude, which depend on the patient reporting blur, MEM reads the accommodative response directly off the retinoscopic reflex while the patient reads a genuine near task, so it isn't affected by how well the patient can describe what they're seeing.",
        ],
      },
      {
        heading: 'The principle',
        items: [
          "The retinoscope reflex's motion (with-motion or against-motion) reflects whether the patient's eye is under- or over-focused relative to the working distance. Briefly interposing a trial lens in front of the retinoscope's own light path finds the power that neutralizes that motion — the lens power at neutralization tells you the patient's actual accommodative response at the moment of reading, compared with what the target distance itself demands.",
        ],
      },
      {
        heading: 'What the clinician observes',
        items: [
          'With-motion (reflex moves the same direction as the retinoscope\'s sweep) needs a PLUS lens to neutralize — the patient is under-accommodating relative to the target (a lag).',
          'Against-motion (reflex moves opposite the sweep) needs a MINUS lens to neutralize — the patient is over-accommodating relative to the target (a lead).',
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Dwelling with the interposed lens for more than about a second lets accommodation adapt to the lens itself rather than reflecting the true unlensed response — keep the interposition brief.',
          "Testing while the patient isn't actually reading/attending to the target (just looking near it) understates the true accommodative response, since accommodative effort is task-driven.",
          'A small pupil, media opacity, or high refractive error can make the reflex hard to judge confidently — a poor-quality reflex is worth noting as such rather than forcing a number.',
          "A finding notably outside the typical range (a large lag, or any lead) should prompt correlating with symptoms and the rest of the near workup (NRA/PRA, MAF/BAF) rather than being read as a standalone finding — see CLINICAL REVIEW NEEDED note below regarding specific numeric norms.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Nott Dynamic Retinoscopy estimates the same lag/lead objectively by a different mechanism (moving the retinoscope rather than interposing lenses) and should roughly agree — a large disagreement between the two on the same patient is worth re-checking technique on both.',
          'NRA/PRA and MAF/BAF probe the accommodative system subjectively, via patient report, rather than objectively off the retinoscopic reflex — the two approaches corroborate each other.',
        ],
      },
      {
        heading: 'CLINICAL REVIEW NEEDED',
        items: [
          "Commonly cited teaching material describes a normal near lag of roughly +0.25 D to +0.75 D, with meaningfully larger lag (or any lead) considered notable — this card intentionally does not state that range as an authoritative cutoff. Verify against a primary reference before treating a specific numeric threshold here as a pass/fail rule.",
        ],
      },
    ],
  },
  {
    id: 'nott-retinoscopy-test',
    title: 'Nott Dynamic Retinoscopy',
    tags: ['binocular', 'accommodation', 'retinoscopy'],
    purpose: 'Same purpose as MEM (estimate near accommodative lag/lead) but by physically moving the retinoscope rather than interposing lenses.',
    youNeed: ['Retinoscope', 'Near target with small text', 'Working-distance scale (tape measure or marked rod)'],
    meta: ['HABITUAL CORRECTION IN PLACE', 'PATIENT READING THE TARGET ALOUD'],
    doSteps: ['Move the retinoscope toward/away from the target', 'Find the working distance where the reflex neutralizes (motion stops)', 'Read the working distance at that point'],
    whatToNote: ['Working distance at neutral', 'Lag or lead amount (recorded signed: + = lag, − = lead)'],
    interpret: [
      { finding: 'Neutral point beyond the target', meaning: 'Accommodative lag — under-accommodating for the target.' },
      { finding: 'Neutral point short of the target', meaning: 'Accommodative lead — over-accommodating for the target.' },
    ],
    quickInterpretReminder: 'Compare with MEM — the two should roughly agree.',
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          'The same objective purpose as MEM — an accommodative lag/lead reading that doesn\'t depend on the patient reporting blur — but reached by moving the retinoscope itself rather than interposing a lens.',
        ],
      },
      {
        heading: 'The principle',
        items: [
          "Moving the retinoscope toward or away from the target changes the retinoscope's own working distance until its reflex neutralizes — at that point, the retinoscope's distance IS the distance at which the patient's eye is actually focused. Converting that distance to diopters (100 ÷ distance in cm, the same reciprocal relationship as Amplitude of Accommodation) and comparing it against the diopter demand of the real target distance gives the lag or lead.",
        ],
      },
      {
        heading: 'What the clinician observes',
        items: [
          "Neutral point found FARTHER than the target means the eye is focused beyond where it needs to be for that distance — under-accommodating relative to the target, i.e. a lag.",
          'Neutral point found SHORTER (closer) than the target means the eye is focused nearer than needed — over-accommodating, i.e. a lead.',
        ],
      },
      {
        heading: 'Nott vs. MEM — trade-offs',
        items: [
          "Nott avoids MEM's main pitfall (a lens sitting in place long enough for accommodation to adapt to it), since nothing is interposed — the retinoscope itself is simply repositioned.",
          "In exchange, Nott needs an accurate, readable working-distance scale, and physically moving the retinoscope while keeping a clean view of the reflex and the patient's reading target can be technically more awkward than MEM's fixed working distance.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Misreading the working-distance scale, or letting the patient's head position drift during the measurement, introduces error directly into the diopter conversion.",
          "Same task-dependence as MEM: the patient must actually be reading/attending to the near target for the accommodative response to be genuine.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'MEM Dynamic Retinoscopy is the direct cross-check for this result — the two should roughly agree; a large disagreement is worth re-checking technique on both.',
        ],
      },
    ],
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
    moreSections: [
      {
        heading: 'What it assesses / why we perform it',
        items: [
          "The finest depth difference the patient can detect from retinal disparity (the slight difference between the two eyes' retinal images of the same scene) — the finest-grained binocular sensory finding in the guide, complementary to Worth 4 Dot's coarser fusion/suppression/diplopia categories.",
        ],
      },
      {
        heading: 'The principle',
        items: [
          'Each eye views the target from a slightly different angle; the brain compares the two images and, when they can be fused, computes depth from the disparity between them. Reduced or absent stereoacuity reflects a breakdown somewhere in that binocular sensory pathway — from constant strabismus abolishing it entirely, to a mild sensory deficit only detectable at fine disparity levels.',
        ],
      },
      {
        heading: 'Random-dot vs. contour-based tests — an important limitation',
        items: [
          "Contour-based tests (targets with visible outlines, e.g. the classic Wirt circles/Titmus-style plates) can in some cases be judged from monocular contour cues alone, without any true stereopsis — a patient with a binocular vision disorder can occasionally 'pass' a contour-based plate using one eye's information alone, which limits how much a passing result on this type of test guarantees. Random-dot targets remove those monocular contour cues by design and are the more rigorous test of true stereopsis where it matters.",
          "Because of this, which specific test/plates were used is itself part of the finding — record it, since normative cutoffs and the monocular-cue caveat both differ between test types.",
        ],
      },
      {
        heading: 'Interpreting the result',
        items: [
          'Finer levels correctly identified indicate better stereoacuity; the level at which identification fails is the recorded threshold.',
          "A good stereoacuity result correlates with, but doesn't replace, a normal motor alignment finding — small-angle strabismus or monofixation syndrome can sometimes retain measurable gross stereopsis while losing fine stereopsis, so a coarse pass doesn't rule out a subtle motor finding on its own.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Polarized glasses not properly worn/aligned, or a scratched/degraded test book, can understate true stereoacuity independent of the patient's actual binocular status.",
          "Assuming a passing result means normal binocular vision overall — it's one sensory data point, to be read alongside the motor (Cover Test) and other sensory (Worth 4 Dot) findings, not a substitute for them.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          'Worth 4 Dot is the coarser sensory-status test (fusion vs. suppression vs. diplopia) — Stereoacuity adds a finer-grained quantification on top of whatever sensory status Worth 4 Dot establishes.',
          'Cover Test establishes the motor alignment finding this sensory result is interpreted alongside.',
        ],
      },
    ],
  },
  {
    id: 'sheard-criterion',
    title: "Sheard's Criterion",
    tags: ['binocular', 'vergence', 'phoria', 'reference'],
    interpretationCriterion: true,
    purpose: 'Reference: the compensating fusional reserve (opposite the phoria) should be at least twice the phoria — the standard check for whether a phoria is adequately compensated.',
    youNeed: ['A measured phoria (Maddox Rod/cover test)', 'The corresponding fusional vergence range'],
    doSteps: [
      'Identify the compensating direction: BO for exophoria, BI for esophoria',
      'Compare the compensating reserve against 2 × the phoria',
      'Use the blur point when recorded; break as a fallback',
    ],
    keyAnchor: 'Reserve ≥ 2 × Phoria = PASS',
    quickInterpretReminder: 'FAIL is a finding to weigh alongside symptoms — not a prescribing rule by itself.',
    moreSections: [
      {
        heading: 'What it is / why we perform it',
        items: [
          "A clinical rule of thumb, not a physiological law: it checks whether the fusional reserve available to compensate a phoria is comfortably larger than what the phoria demands, on the reasoning that a reserve barely equal to the demand leaves no margin and is more likely to produce symptoms under everyday fatigue or reduced attention.",
        ],
      },
      {
        heading: 'Which reserve compensates which phoria — the direction that\'s easy to get backwards',
        items: [
          'An exophoria is compensated by CONVERGING against it — check the BO (positive fusional vergence) reserve. An esophoria is compensated by DIVERGING against it — check the BI (negative fusional vergence) reserve. This is the same "compensating direction equals the phoria\'s own pull direction" rule explained in full on the Fusional Vergence Ranges card — and it is the OPPOSITE of the prism direction that would neutralize/prescribe for that same phoria (exophoria is neutralized with BI, esophoria with BO). Don\'t reach for the neutralizing-prism direction here by habit.',
        ],
      },
      {
        heading: 'The blur-preferred endpoint',
        items: [
          "Use the blur point of the fusional reserve when it was recorded — it's the more conservative, earlier endpoint. Fall back to break only when blur wasn't reported for that reserve. This convention is applied consistently between this card and the Binocular Status assessment flow so the two never silently disagree on which number was used.",
        ],
      },
      {
        heading: 'Worked example',
        items: [
          "6Δ exophoria: check the BO reserve; PASS requires ≥ 12Δ BO (blur, or break if blur wasn't recorded). 4Δ esophoria: check the BI reserve; PASS requires ≥ 8Δ BI.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          "Comparing the phoria against the WRONG-direction reserve (e.g. checking BI reserve for an exophoria) — re-check the direction rule above if the result looks surprising.",
          "Mixing blur and break endpoints across visits for the same patient makes a trend look like it changed when only the endpoint convention did — stay consistent, and note which endpoint was used if it had to change.",
          "A FAIL is a finding to weigh alongside symptoms, age, and the rest of the near workup — it is not, by itself, a prescribing or treatment rule.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Fusional Vergence Ranges (BI/BO) is the direct source of the reserve figure this rule checks — see that card for the full blur/break/recovery and direction explanation.",
          "Percival's Criterion applies the same 'don't sit at the edge of your reserve' logic to the accommodative system (NRA/PRA) instead of vergence.",
        ],
      },
    ],
  },
  {
    id: 'percival-criterion',
    title: "Percival's Criterion",
    tags: ['binocular', 'accommodation', 'vergence', 'reference'],
    interpretationCriterion: true,
    purpose: 'Reference: the accommodative posture should sit within the middle third of the total relative accommodation range (NRA + PRA) — an accommodative analogue to Sheard’s criterion.',
    youNeed: ['NRA and PRA already measured'],
    doSteps: ['Add NRA + PRA to get the total range', 'Check whether the resting point (habitual correction) falls within the middle third of that range'],
    keyAnchor: 'Resting point within middle ⅓ of (NRA + PRA)',
    quickInterpretReminder: 'Outside the middle third is a finding to weigh alongside symptoms and MAF/BAF — not a prescribing rule by itself.',
    moreSections: [
      {
        heading: 'What it is / why we perform it',
        items: [
          "The accommodative analogue of Sheard's Criterion, applying the same reasoning to accommodation instead of vergence: if the habitual resting point sits too close to either edge of the available relative-accommodation range (NRA+PRA), there is little margin left before sustained near work exhausts that reserve.",
        ],
      },
      {
        heading: 'The rule',
        items: [
          'NRA + PRA defines the total accommodative range available while binocular fusion is held. The habitual near correction defines the resting point within that range. The rule checks whether that resting point falls inside the middle third of the total range, rather than pressed up against the NRA end or the PRA end.',
        ],
      },
      {
        heading: 'Interpreting the result',
        items: [
          'A resting point pushed toward the PRA end (little room left to stimulate further) with symptoms and reduced PRA/minus-side MAF difficulty corroborating each other points toward the near correction asking too much of a limited accommodative reserve.',
          'A resting point pushed toward the NRA end likewise suggests little room left to relax accommodation further under this same range.',
          "Outside the middle third is a finding to weigh alongside symptoms and MAF/BAF — like Sheard's, it is not a standalone prescribing or treatment rule.",
        ],
      },
      {
        heading: 'Common mistakes & limitations',
        items: [
          'Applying the rule without first confirming NRA/PRA were measured from a validated, up-to-date near Rx — an uncorrected refractive error shifts where the resting point appears to sit for reasons unrelated to the accommodative system itself.',
          "Less commonly applied chairside than Sheard's — included here as a reference rather than as part of the standard Binocular Status flow, so don't expect it to appear in that assessment's automated evaluation.",
        ],
      },
      {
        heading: 'Related tests',
        items: [
          "Sheard's Criterion is the direct vergence-side analogue of this same reasoning.",
          'NRA/PRA is the direct source of the range this rule checks the resting point against.',
        ],
      },
    ],
  },
];

export function getClinicalTest(id: string): ClinicalTest | undefined {
  return clinicalTests.find((test) => test.id === id);
}

/**
 * Case-insensitive match against title and tags. With no query, returns the default browse
 * listing — every performable test, but not an `interpretationCriterion` entry (e.g. Sheard's,
 * Percival's): those aren't something you do to a patient, so they don't belong in a generic
 * "here's every test" list. An explicit query still matches them by name, same as any other
 * test — they're still fully searchable, just not part of the unfiltered browse list.
 */
export function searchClinicalTests(query: string): ClinicalTest[] {
  const q = query.trim().toLowerCase();
  if (!q) return clinicalTests.filter((test) => !test.interpretationCriterion);
  return clinicalTests.filter(
    (test) => test.title.toLowerCase().includes(q) || test.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}
