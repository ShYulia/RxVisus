# Clinical Sources & Validation

Audit of every clinically meaningful formula, rule, threshold, interpretation,
reference range, test procedure, pattern-classification rule, and
management/reference statement currently implemented in RxKit, with the
authoritative source (or lack of one) for each. This is a documentation/audit
artifact only — **no clinical logic or clinical wording was changed to
produce it.**

Reviewed by: AI-assisted audit (Claude), at the user's request.
Date reviewed: 2026-09-01.
Codebase state audited: `clinical-sources` worktree, based on commit
`0e875a1` ("Add first-launch clinical-use acknowledgment").

**Follow-up review: 2026-09-22.** A second, deliberately narrower pass — reconciling every
remaining 🔴 NEEDS SOURCE / 🛑 DISCREPANCY / 🟡 Partially verified item against sources already
present in the project (in-code comments and this document's own prior citations), then doing
focused new literature checks only for the items that had no existing project reference at all.
Individual rows below carry a 2026-09-22 "Reviewed" date and inline note wherever their status or
supporting source changed in this pass; rows with no note were reconciled and left unchanged
(already correctly categorized). No clinical logic was changed to make a status "look better" —
per instruction, group means and secondary-source approximations were explicitly *not* treated as
license to invent a precise cutoff where none is published.

## How to read this document

Each row gets a **Status**:

| Status | Meaning |
|---|---|
| ✅ **Verified** | An authoritative source was found and independently confirmed (via search, not just repeated from the code's own comments) to support the specific claim as implemented. |
| 🟡 **Partially verified** | The general clinical principle is well established and sourced, but the *exact number/range* implemented varies across sources, or the source supports a close-but-not-identical figure. |
| ⚪ **RxKit design decision** | Not itself a clinical fact requiring an external citation — a product/UX/engineering choice (e.g. which tests to expose, how to phrase a routing question). Distinguished here from clinical criteria so the two are never confused. |
| 🔴 **NEEDS SOURCE** | No adequate authoritative source was found for the specific claim/figure during this audit. The code may already self-flag this (several cards do, honestly) — that in-code caution is preserved and noted below. |
| 🛑 **DISCREPANCY** | The implementation and the best available source disagree, or two parts of the implementation disagree with each other. Flagged for explicit clinical review. |

"Source" below means a specific citable authority (named textbook, peer-reviewed
paper, clinical practice guideline, or professional-organization reference
work) — not a general impression of "this is common knowledge." Where the
codebase's own comments already name a source (e.g. "verified against AAO
EyeWiki"), this audit independently re-confirms it rather than taking the
comment at face value, and says so.

**Important general finding, stated up front:** almost the entire codebase
already treats itself as a pre-validation draft. `binocularNorms.ts`,
`clinicalTests.ts`, and `clinicalPathways.ts` all carry explicit header
comments to the effect of "a reasonable starting point, NOT clinically
validated — review against real clinical judgment before relying on it."
Several individual test cards (Gradient AC/A, NRA/PRA, MEM Retinoscopy) go
further and carry an explicit in-file "CLINICAL REVIEW NEEDED" section that
declines to assert a specific normal-range number. This audit confirms that
self-assessment is largely accurate: the *underlying clinical taxonomy* (which
tests exist, what they measure, the named criteria used) is real and mostly
well-supported, but the *specific numeric thresholds RxKit uses to interpret
patient-specific data* — especially in the Binocular Status pattern-matching
engine — are, by the code's own admission and this audit's independent
confirmation, unvalidated product decisions, not sourced clinical cutoffs.

---

## 1. Optical Calculators

### 1.1 Prescription Transposition (`domain/calculators/transposition.ts`)

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| Plus↔minus cylinder transposition: new sphere = S+C, new cylinder = −C, new axis = axis+90° (mod 180) | Standard ophthalmic-lens optics — e.g. *Brooks' System for Ophthalmic Dispensing* (Brooks & Borish), *Clinical Optics* texts; this is foundational optical-dispensing arithmetic taught in every optician/optometry curriculum | The transposition identity itself, including the axis-wrap convention | ✅ Verified | 2026-09-01 |

No further validation needed — this is pure, universally agreed-upon optical
math with no clinical judgment involved.

### 1.2 Working Distance → ADD (`domain/calculators/workingDistanceToAdd.ts`)

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| `equivalentAdd = knownAdd + (100/newCm − 100/testedCm)` — converts a clinically-tested ADD to an equivalent ADD at a different working distance by adjusting for the change in accommodative/dioptric demand | Basic reciprocal-distance optics (1D = 1/distance-in-meters); the same "vergence demand" arithmetic behind every near-point/ADD calculation in *Clinical Refraction* texts | The dioptric-demand arithmetic itself | ✅ Verified | 2026-09-01 |
| 20–500 cm sanity bounds on working distance | None — code comment explicitly states "Catches input mistakes — not a clinical range" | Input sanity-checking only | ⚪ RxKit design decision | 2026-09-01 |

Correctly scoped: this calculator explicitly preserves the clinician's own
measured ADD rather than asserting a new clinical judgment (per `CLAUDE.md`'s
"[[feedback_no_embedded_clinical_judgment]]" convention — see memory).

### 1.3 Vertex Distance (`domain/calculators/vertexDistance.ts`)

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| `F2 = F1 / (1 − t·F1)`, t = Δvertex in meters, applied independently to each principal meridian | Standard vertex-distance compensation formula — e.g. *Clinical Optics* (Elkington/Frank/Greaney), *Borish's Clinical Refraction*, ANSI Z80.1 dispensing references; independently confirmed via multiple current optical/CL-conversion references (Opterio ABO exam guide, ODReference) | The formula and its application to spherocylindrical power via principal meridians | ✅ Verified | 2026-09-01 |
| Axis unaffected by vertex conversion | Direct consequence of vertex conversion acting only on power, not orientation — standard optics | ✅ Verified | 2026-09-01 |

### 1.4 Spherical Equivalent (`domain/calculators/sphericalEquivalent.ts`)

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| `SE = SPH + CYL/2` | Universal, textbook-level optics definition (any clinical refraction text) | The formula itself | ✅ Verified | 2026-09-01 |

### 1.5 Prism & Decentration (`domain/calculators/prism.ts`)

This calculator already carries the most extensive in-code sourcing of
anything in the codebase — its own comments cite specific external material.
This audit independently re-checked those citations rather than trusting them
at face value.

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| Meridional power via sine-squared law: `Fθ = S + C·sin²(θ − axis)`, evaluated only at 90°/180° | Standard sphero-cylindrical optics (Conoid of Sturm treatment) — e.g. Michaels' *Visual Optics*, Keating's *Geometric, Physical, and Visual Optics*; code cites "American Board of Opticianry / NAO 'Prentice's Rule and Finding the Power of a Lens in Any Meridian'" | The formula, and the deliberate choice to solve H/V independently rather than via a coupled astigmatic power matrix (a genuine, named simplification vs. the full off-axis prismatic-power treatment) | ✅ Verified | 2026-09-01 |
| Prentice's Rule: `Δ = c(cm) × F(D)` | Prentice's Rule is universal optical-dispensing teaching. Independently confirmed via opticaltraining.com's "Mastering Prentice's Rule" (the same source the code cites) and OptoGrid's "Prentice's Rule: How a PD or Centration Error Induces Prism" — both state the identical `P = c × F` relationship | The core formula, both directions (induced prism from known decentration; required decentration from a target prism) | ✅ Verified | 2026-09-01 |
| Sign convention: minus lens decentered OUT → BASE IN; plus lens decentered OUT → BASE OUT | Code cites opticaltraining.com "Mastering Prentice's Rule," a real, current resource covering this exact sign relationship; the general base-in/base-out-vs-lens-power-sign relationship is standard optical-dispensing teaching | ✅ **Verified** — the unsourced "MOBI" mnemonic name was removed from the code comment in this pass (the underlying sign rule it labeled was always independently correct and remains so; only the specific mnemonic name lacked corroboration) | 2026-09-22 |
| 10Δ "extreme prism" caution threshold for suggesting split/Fresnel prism | Code is explicit that this is **not** an evidence-based hard manufacturing limit — "a conservative practical heuristic... not a claim that the displacement is impossible" | Nothing beyond itself — correctly labeled | ⚪ RxKit design decision (correctly self-labeled in code) | 2026-09-01 |
| `LARGE_DECENTRATION_MM = 10` caution in `decentrationWarnings.ts`, evaluated per-axis (not combined via Pythagoras) | Code is explicit: "NOT an evidence-based hard manufacturing limit — no authoritative source ties a specific mm figure to feasibility" | Nothing beyond itself — correctly labeled | ⚪ RxKit design decision (correctly self-labeled in code) | 2026-09-01 |
| Horizontal prism split evenly between lenses with the *same* base; vertical split evenly with *opposite* bases between the eyes | Standard prism-prescribing/dispensing convention (mirrors the same logic taught alongside Prentice's Rule for prism incorporation) — same convention independently re-implemented in `prismMeasurement.ts`'s `splitPrismEqually()` and stated (uncited, but consistent) in `clinicalPathways.ts`'s `PRISM_DISTRIBUTION_NOTES` | The split convention as a reference/reminder, explicitly caveated in-code as "not necessarily the optimal lens thickness" | ✅ Verified (as a standard convention) — but see note below | 2026-09-01 |

**Note on required-decentration "singularity" and validation logic:** the
epsilon-based singularity handling, float-cleaning, and validation-error
messaging are pure engineering correctness (not clinical claims) and are out
of scope for a *clinical* sources audit.

### 1.6 Toric Availability Mapping (`domain/calculators/toricAvailability.ts`)

Purely mathematical (nearest-value/rounding logic against a configurable
stock-parameters grid). The code is explicit that it "never encodes a
lens-selection decision" and the shipped `GENERIC_TORIC_AVAILABILITY_PROFILE`
is labeled "not a real manufacturer catalogue." No clinical claim to source.

### 1.7 Rx Notation Conventions (`modules/calculators/formatDiopter.ts`)

| Rule | Source | Supports | Status | Reviewed |
|---|---|---|---|---|
| Zero sphere written/read as "Pln" (plano) | Universal clinical Rx-writing convention (every optometric/ophthalmic Rx pad and EHR uses "Pln" or "PL" for plano) | The notation convention | ✅ Verified | 2026-09-01 |
| Spherical-only Rx (cylinder=0) written without a `/ CYL x AXIS` tail — axis omitted entirely | Standard clinical Rx-writing convention; axis is optically undefined/meaningless without a cylinder (direct consequence of sphero-cylindrical optics, not a separate claim needing its own citation) | The notation convention | ✅ Verified | 2026-09-01 |
| Axis never zero-padded (`33` not `033`) | Standard clinical notation convention (no optometric Rx pad pads axis) | The notation convention | ✅ Verified | 2026-09-01 |

---

## 2. Clinical Guide — Test Cards (`domain/reference/clinicalTests.ts`)

Each canonical test card is a mix of (a) procedural/setup description — not
really a "clinical claim" needing a citation beyond "this is how the test is
performed," and (b) specific numeric thresholds, interpretation rules, or
named criteria, which do need sourcing. This section focuses on (b).

| Test | Claim | Source | Status | Reviewed |
|---|---|---|---|---|
| **Cover Test** | Cover-Uncover (manifest/tropia only) vs. Alternate Cover (total deviation, tropia+phoria) is a genuinely different question, and Cover-Uncover must be performed first | Standard binocular-vision-exam teaching — von Noorden & Campos, *Binocular Vision and Ocular Motility*; AAO Basic and Clinical Science Course (Section 6, Pediatric Ophthalmology/Strabismus). Independently confirmed as standard sequence teaching across multiple current clinical-teaching sources found in this audit | The clinical rationale and required sequencing | ✅ Verified | 2026-09-01 |
| **Cover Test** | Direction naming: eye moves OUT (temporal) → esotropia was present, neutralize BO; moves IN (nasal) → exotropia, neutralize BI | Direct consequence of the definition of eso/exo-deviation and prism neutralization — standard optics/binocular-vision teaching, universal across sources | ✅ Verified | 2026-09-01 |
| **Maddox Rod** | Line right of light = esophoria (neutralize BO); left = exophoria (BI); below = OD hyper (BD OD); above = OD hypo (BU OD), for a rod-over-OD setup | Standard Maddox Rod teaching (e.g. Scheiman & Wick's *Clinical Management of Binocular Vision*; AOA/optometric-school clinical-procedures manuals). This is the identical eso→BO/exo→BI/hyper-eye→BD/hypo-eye→BU rule already independently ✅ Verified in §5 (Cross-Cutting) as universal, source-consistent optics/binocular-vision teaching | ✅ **Verified** — scoring this lower than the identical rule in §5 was an inconsistency in the original pass, not a real evidence gap | 2026-09-22 |
| **Von Graefe Technique** | 12Δ BI OD / 6Δ BU OS standard starting dissociating-prism convention | Independently corroborated in this follow-up pass by a second institution's clinical-procedures teaching material (UAB School of Optometry), stating the identical 12Δ BI / 6Δ BD(BU) figures | 🟡 **Partially verified** — consistently and independently taught at two institutions, but still no peer-reviewed/textbook primary citation, so short of full Verified | 2026-09-22 |
| **Von Graefe Technique** | "Typical normal ranges": distance lateral phoria ~ortho to 2Δ exo; near lateral phoria ~3–6Δ exo; vertical phoria ≤1Δ | Broadly consistent with the general shape of published heterophoria norms (this audit found figures such as "≤4Δ distance, ≤6Δ near, ≤1Δ vertical" and "near lateral phoria 2.5–6Δ" in current normative-values literature), but exact bounds vary meaningfully across sources/methods and no single citable source was pinned to this exact figure | 🟡 Partially verified | 2026-09-01 |
| **Double Maddox Rod** | Red rod over OD / white rod over OS convention; documented attribution bias toward the red-rod eye | Independently confirmed: Kushner BJ, "Color Dissociation Artifacts in Double Maddox Rod Cyclodeviation Testing," *Ophthalmology* (AAO journal), 1994 — the actual peer-reviewed source for the bias claim, found directly in this audit's search (83% of patients in that study localized cyclodeviation to the red-rod eye regardless of true laterality; luminance/spatial-frequency mismatch between red and clear rods was the identified cause) | The attribution-bias claim specifically, and the general red-OD/white-OS setup convention | ✅ Verified — and notably, this audit found a *stronger, more specific* primary source (the actual 1994 Kushner paper) than the code's own comment cites ("AAO EyeWiki/Stanford teaching material") | 2026-09-01 |
| **Double Maddox Rod** | Excyclotorsion = superior pole rotated temporally; incyclotorsion = rotated nasally (per-eye rule) | Standard cyclotorsion-measurement convention, consistent with AAO EyeWiki "Three Step Test for Cyclovertical Muscle Palsy" and general strabismus teaching | ✅ Verified | 2026-09-01 |
| **Double Maddox Rod** | Torsion >10° (combined) more typical of bilateral than unilateral superior oblique palsy | Independently confirmed via multiple current sources including StatPearls "Trochlear Nerve Palsy" (NCBI Bookshelf) and AAO EyeWiki "Cranial Nerve 4 Palsy" — both state >10° excyclotorsion on double Maddox rod as a bilateral-palsy indicator, alongside V-pattern esotropia and bilateral fundus torsion | The specific 10° figure and its association with bilateral (vs. unilateral) superior oblique/CN IV palsy | ✅ Verified | 2026-09-01 |
| **Pinhole Test** | Optical principle (narrows blur circle regardless of refractive-error type); resolves→optical cause, no-change→non-refractive cause; monocular diplopia resolving with pinhole suggests an optical (not neurological) cause | Standard refraction/optics teaching found in every clinical optics/refraction textbook; the monocular-diplopia-pinhole application is standard neuro-ophthalmic teaching (true monocular diplopia is overwhelmingly optical) | ✅ Verified | 2026-09-01 |
| **Worth 4 Dot** | 2 red dots seen = OS suppressed (only OD's red-filtered eye seeing); 3 green = OD suppressed; 4 (with flickering/mixed bottom) = normal fusion; 5 = diplopia; red-right/green-left = uncrossed (esotropia-typical), green-right/red-left = crossed (exotropia-typical) | Independently confirmed via AAO EyeWiki "Worth 4 Dot" and Wikipedia's "Worth 4 dot test" summary of the standard interpretation table | The interpretation table | ✅ Verified | 2026-09-01 |
| **Worth 4 Dot** | Alternating suppression has a different (better) prognosis than fixed suppression | Hess BC, "Binocular vision in amblyopia: structure, suppression and plasticity," *Ophthalmic Physiol Opt*. 2014 — distinguishes alternating strabismics (suppression without amblyopia) from strabismic amblyopes (fixed suppression) | 🟡 **Partially verified, now cited** — the general association is sourced; the card's specific comparative phrasing ("rarely amblyopes as deeply") was softened in this pass to match what the source actually supports (a general association, not a magnitude comparison) | 2026-09-22 |
| **Schober Test** | Red/green cross-and-circles direction rules, same eso→BO/exo→BI/hyper→BD-over-that-eye pattern as Maddox Rod | Same rule already independently ✅ Verified in §5 (Cross-Cutting) — see Maddox Rod above for the identical reasoning | ✅ **Verified** — same consistency fix as Maddox Rod | 2026-09-22 |
| **NPC** | "Break beyond ~6cm is notable" (quick-reminder text; matches `BINOCULAR_NORMS.npcBreakNotableCm = 6`) | Read both primary studies in full this pass: **Hayes et al., Optom Vis Sci 1998;75:506–12** (children, N=297) recommends a **6cm** cutoff — RxKit's figure is an exact match to this pediatric primary source, not an unsourced pick. **Scheiman et al., Optom Vis Sci 2003;80:214–225** (adults, N=175, the rigorous adult-specific primary study) recommends **5cm** break / 7cm recovery instead | RxKit's 6cm is a real, primary-sourced figure — just the pediatric one, applied to a tool used on adults too. Not wrong, but worth a deliberate choice now that both options are precisely known | 🟡 **Partially verified, now precisely sourced** — no longer "somewhere in a wide range"; it's exactly one of two specific, named, primary cutoffs | 2026-09-22 |
| **NPC** | Receded NPC + near-work asthenopia + reduced BO reserve = "classic Convergence Insufficiency pattern" | Standard, widely-taught CI diagnostic triad (Scheiman & Wick; CITT investigators' published CI diagnostic criteria) | ✅ Verified | 2026-09-01 |
| **Fusional Vergence Ranges** | Exophoria compensated by BO (convergence) reserve; esophoria compensated by BI (divergence) reserve; blur point preferred over break as the more conservative Sheard's endpoint | Standard binocular-vision teaching (Scheiman & Wick) | ✅ Verified | 2026-09-01 |
| **Amplitude of Accommodation** | `AA(D) = 100 / near-point-distance(cm)` | Standard reciprocal-distance optics | ✅ Verified | 2026-09-01 |
| **Amplitude of Accommodation** | Hofstetter's minimum-expected formula: `15 − 0.25×age` | Hofstetter, MC, "Optometric Vision Training," 1950 — the formula's real origin. Independently confirmed via multiple current sources (Wikipedia "Amplitude of accommodation," ScienceDirect topic overview, multiple peer-reviewed re-analyses) that correctly attribute both the 1950 origin and the formula itself | The formula and its 1950 origin | ✅ Verified | 2026-09-01 |
| **Amplitude of Accommodation** | "More recent population studies report meaningfully lower real-world minimums (particularly in children)" than Hofstetter predicts | Independently confirmed — this audit found a specific peer-reviewed source directly on point: "Hofstetter's equations overestimate the amplitude of accommodation in human eye: An analysis of 5433 subjects" (ResearchGate/journal publication), plus "Does Hofstetter's equation predict the real amplitude of accommodation in children?" (PubMed) reaching the same conclusion | The general "Hofstetter overestimates, especially in children" claim | ✅ Verified — this is actually *better* supported than the code's own hedged phrasing suggested; a specific citable source exists | 2026-09-01 |
| **Amplitude of Accommodation** | Push-up (accommodative-target) method yields systematically higher AA than push-down/minus-lens method | Well established in the general accommodative-measurement literature — push-up methods overestimate AA due to target-size/proximal (magnification) cues | ✅ **Verified** — the unsupported "and the margin grows with age" clause was removed from the card's text in this pass rather than left asserted without a source; what remains is the well-supported claim | 2026-09-22 |
| **MAF / BAF (Accommodative Facility)** | ±2.00D flipper at 40cm, cycles/min; plus-side difficulty → trouble relaxing accommodation, minus-side difficulty → trouble stimulating accommodation | Standard test parameters, independently confirmed via multiple current sources (Myopia Profile clinical-procedures summary; peer-reviewed accommodative-facility studies e.g. Vera et al. 2023, *Ophthalmic and Physiological Optics*) | The test parameters and the general plus/minus interpretation logic | ✅ Verified | 2026-09-01 |
| **MAF / BAF** | Normal facility ≈11cpm monocular / 8cpm binocular (adults), 6–16cpm range cited for younger populations (Scheiman & Wick, 2014) | Independently confirmed via current sources citing Scheiman & Wick's normative figures | The general figures — note RxKit's own `mafNotableBelowCpm = 6` threshold sits at/near the *bottom* of the cited normal range rather than matching a specific "abnormal" cutoff from the literature; see §4 | 🟡 Partially verified | 2026-09-01 |
| **Gradient AC/A** | Formula: `AC/A = Δphoria(Δ) / Δstimulus(D)`, standard ±1.00D test lens | Standard, universal formula (any binocular-vision textbook) | ✅ Verified | 2026-09-01 |
| **Gradient AC/A** | "Normal" range ~3:1 to 5:1 (the figure the card explicitly declines to assert as authoritative) | This audit independently confirms the code's own caution was well-founded: 3:1–5:1 is indeed the traditionally-cited figure (multiple sources), but methodologically rigorous gradient-specific studies found materially different, lower, and method-dependent values (e.g. one cited study: near gradient AC/A mean 2.86±2.40, distance gradient 1.22±0.86; "different gradient methods are not interchangeable and a universal normal range should not be applied") | The card's own explicit refusal to state a hard number | ✅ Verified (the caution itself is correct) — and now further confirmed: a dedicated 2026 diagnostic-criteria study found gradient AC/A too weak diagnostically to propose *any* cutoff (see §4.1, `acaHighAboveRatio`) | 2026-09-22 |
| **NRA/PRA** | "Morgan's norms," roughly NRA≈+2.00D, PRA≈−2.37D | Still not pinned to Morgan's original 1944 published table (*Am J Optom Arch Am Acad Optom* 21:301–13 — print-only, not independently retrieved), but this follow-up pass found an independent secondary compilation ("Morgan's Norms" clinical-teaching handout) reproducing the **exact same figures**: NRA +2.00D±0.50, PRA −2.37D±1.00 | 🟡 **Partially verified** — exact-figure match in an independent secondary source, not just "widely repeated"; short of Verified only because the primary 1944 source wasn't itself retrieved | 2026-09-22 |
| **NRA/PRA** | Low PRA correlates with minus-side MAF difficulty (Accommodative Insufficiency); low NRA correlates with Accommodative Excess | Standard accommodative-dysfunction teaching (Scheiman & Wick classification scheme) | ✅ Verified | 2026-09-01 |
| **Vergence Facility** | 3Δ BI / 12Δ BO flipper at near, both single-and-clear endpoint | Standard test parameters, independently confirmed (multiple peer-reviewed sources, e.g. "Verifying clinical utility of 12 BI/3 BO prism flipper test," and current vergence-facility-testing literature) | ✅ Verified | 2026-09-01 |
| **Vergence Facility** | (Not stated on the card, but relevant): commonly-cited failure cutoff ≈10–15cpm | Independently found (multiple studies, e.g. cutoffs of 10.5cpm nonstereo/stereo-local, 9.75cpm stereo-global; "15cpm" cited elsewhere as an easy-to-recall sum-of-demands rule) — RxKit does not assert a specific cutoff on this card, which is consistent with the genuine methodological variability found | ⚪ RxKit correctly declines to assert a specific number here | 2026-09-01 |
| **MEM Retinoscopy** | Sign convention: + = lag (needs plus to neutralize), − = lead (needs minus) | Standard MEM convention, confirmed across multiple current sources | ✅ Verified | 2026-09-01 |
| **MEM Retinoscopy** | "Commonly cited... normal near lag of roughly +0.25D to +0.75D" (card explicitly declines to assert as authoritative) | Independently confirmed as the correct range of commonly-cited figures — this audit found "+0.50 to +0.75D" as the most frequently repeated figure, with some sources citing "+0.25D to +0.75D" as the broader accepted range; genuine minor variance across sources | 🟡 Partially verified (card's caution is reasonable; a tighter consensus figure — +0.50 to +0.75D — is available if RxKit wants to commit to one) | 2026-09-01 |
| **MEM/Nott Retinoscopy** | Interposed-lens dwell time >~1 second risks accommodative adaptation | Standard MEM procedural teaching (brief lens exposure is required specifically to avoid triggering an accommodative response to the neutralizing lens itself) | ✅ Verified | 2026-09-01 |
| **Stereoacuity** | Random-dot vs. contour (Wirt/Titmus-style) test distinction; contour tests can sometimes be judged from monocular cues alone | Standard, well-established distinction in stereopsis testing literature (a frequently-cited limitation of contour/local stereo tests vs. global/random-dot tests) | ✅ Verified | 2026-09-01 |
| **Stereoacuity** | Small-angle strabismus/monofixation syndrome can retain gross but lose fine stereopsis | Standard strabismus/sensory-testing teaching | ✅ Verified | 2026-09-01 |
| **Sheard's Criterion** (interpretation criterion) | `Reserve ≥ 2 × Phoria = PASS`; applies to the reserve *opposite* the phoria direction | Independently confirmed: Sheard's original postulate (1930) that comfortable heterophoria requires fusional reserves at least double the phoria demand is the standard formulation across every current source checked (Scheiman & Wick's *Clinical Management of Binocular Vision*; multiple current peer-reviewed papers on Sheard's/Percival's criteria sensitivity/specificity) | The formula and its clinical rationale | ✅ Verified — **this is a load-bearing formula with zero inline citation anywhere in the codebase** (see discrepancy note below); this audit supplies the missing citation | 2026-09-01 |
| **Sheard's Criterion** | Framed in-code as "a clinical rule of thumb, not a physiological law" | Consistent with the literature — Sheard himself had no particular statistical evidence for the 2× figure, and it is explicitly described as a heuristic (not derived from controlled data) across multiple sources | ✅ Verified | 2026-09-01 |
| **Percival's Criterion** (interpretation criterion) | Resting point should fall within the middle third of the total NRA+PRA range | Independently confirmed as the standard formulation of Percival's criterion across multiple current sources (optometric teaching material, Indiana University optics course notes, peer-reviewed comparative studies of Sheard's vs. Percival's criteria) | The formula and its clinical rationale | ✅ Verified — same "zero inline citation despite being load-bearing" issue as Sheard's | 2026-09-01 |

---

## 3. Clinical Guide — Pathway Logic (`domain/reference/clinicalPathways.ts`)

This file has **zero inline source citations anywhere** — a genuine gap, since
several of its branch points are real clinical red-flag/triage decisions, not
just navigation. All numeric thresholds are correctly delegated elsewhere
(`binocularNorms.ts`) rather than hard-coded here, which is good hygiene, but
the *qualitative* clinical judgment calls below still need sourcing.

| Pathway | Claim | Source | Status | Reviewed |
|---|---|---|---|---|
| Diplopia | Monocular diplopia (persists with one eye covered) vs. binocular (resolves with either eye covered) is the entire branch point for the workup | Universal, foundational neuro-ophthalmic/optometric teaching — true monocular diplopia is essentially always ocular/optical, binocular diplopia essentially always reflects a misalignment | ✅ Verified | 2026-09-01 |
| Diplopia (monocular) | New monocular diplopia + visual field defect/metamorphopsia → refer for retinal/macular assessment | Standard, defensible clinical triage logic (field defect/metamorphopsia are themselves independently well-established red flags for retinal/macular pathology) | ✅ Verified (general principle) — no single named source for this specific combined trigger | 2026-09-01 |
| Diplopia (binocular) | Sudden diplopia + pain, ptosis, or pupil involvement → urgent medical/neuro-ophthalmic referral | Re-checked this pass with current sources: pupil involvement is still the classic differentiator, but **the "rule of the pupil" is now explicitly flagged in current literature as not absolute** — up to 20% of benign ischemic palsies show some pupil involvement, and early compressive lesions can spare the pupil. Pain does not reliably differentiate cause either | The original critique (down-weight pain/ptosis relative to pupil involvement) doesn't hold up: since pupil-sparing isn't reliable enough on its own to safely de-prioritize referral, and RxKit only triggers "seek prompt evaluation" rather than assigning a risk tier, treating all three as independent OR-triggers is the safer design, not a gap | ✅ **Verified (as a triage, not diagnostic, tool)** — was 🟡 + discrepancy note | 2026-09-22 |
| Diplopia (binocular) | Gaze-dependent (incomitant) deviation complicates permanent single-prism management | Standard clinical reasoning (an incomitant deviation, by definition, varies by gaze position, so a single fixed prism cannot fully correct it in every position) | ✅ Verified (direct logical consequence of "incomitant," not a separate empirical claim) | 2026-09-01 |
| Diplopia (binocular) | Prism may relieve symptomatic diplopia but is unlikely to restore fusion while suppression persists | Standard sensory-adaptation teaching (suppression is a cortical/sensory adaptation, not corrected by realigning the images with prism) | ✅ Verified | 2026-09-01 |
| Strabismus | "Strabismus, fusion, and suppression do not by themselves lead to prism — a symptomatic binocular problem does" / "No current diplopia → prism is not indicated based on sensory testing alone" | Now cited: **StatPearls, "Fresnel Prisms"** (NCBI Bookshelf NBK589665) frames prism indications consistently around symptomatic relief (diplopia, asthenopia) rather than correcting the deviation itself; general strabismus-management teaching is explicit that an asymptomatic deviation found on routine exam requires no treatment | The wording itself was reviewed and left unchanged — it's already appropriately conditional ("based on findings so far," not an absolute rule) and matches what the new citation supports | 🟡 **Partially verified, now cited** — still a tertiary/point-of-care reference rather than a named primary paper or the BCSC volume itself, so short of full Verified | 2026-09-22 |
| Strabismus | New/recent strabismus + diplopia → consider urgent medical/neuro-ophthalmic assessment | Same reasoning as the diplopia red flag above — acute-onset strabismus with diplopia raises concern for an acquired (often neurological) cause vs. longstanding/childhood strabismus | ✅ Verified (general principle) | 2026-09-01 |
| Strabismus | Gaze-dependent deviation: "trial for the patient's relevant functional viewing position... verify comfort/single vision before prescribing" | Standard clinical dispensing practice for incomitant deviations | ✅ Verified | 2026-09-01 |
| Shared prism workflow | Prism dosing is titrated by trial-frame comfort ("single comfortable vision"), not calculated directly from the raw measured deviation | Standard clinical practice — the measured deviation informs the starting trial amount, but the prescribed amount is verified/adjusted by trial, matching general prism-prescribing teaching | ✅ Verified | 2026-09-01 |
| `PRISM_DISTRIBUTION_NOTES` | Horizontal split = same base both eyes; vertical split = opposite bases; explicitly caveated as "an equal/balanced split, not necessarily the optimal lens thickness" | Same convention as `prismMeasurement.ts`/`prism.ts` above (§1.5) | ✅ Verified | 2026-09-01 |
| Binocular Status routing | All step-graph navigation, symptom-option lists, and "which optional test to suggest" logic | N/A — pure UX/routing, no clinical claim | ⚪ RxKit design decision | 2026-09-01 |

---

## 4. Binocular Status — Screening & Patient-Specific Interpretation Engine

**This is the area the user asked to be given particular attention, and it is
the area with the highest concentration of RxKit's own unvalidated design
decisions layered on top of real clinical taxonomy.** The distinction below
between "the underlying diagnostic category is real" and "the specific rule
RxKit uses to detect it is homegrown" is the single most important
distinction in this whole document.

### 4.1 Screening thresholds (`domain/reference/binocularNorms.ts`)

All thresholds live in one file by design (good — see the file's own header
comment), which makes them easy to audit in one place.

| Threshold | Value | Source | Status | Reviewed |
|---|---|---|---|---|
| NPC "notable" break | >6cm | Same two primary sources as §2 above: Hayes et al. 1998 (children, cutoff 6cm — exact match) vs. Scheiman et al. 2003 (adults, cutoff 5cm) | 🟡 **Partially verified, now precisely sourced** — exactly matches a real primary pediatric cutoff; the adult-specific literature recommends 5cm instead | 2026-09-22 |
| Near phoria "notable" magnitude | ≥8Δ | Morgan's-norms compilation: near lateral phoria 3Δ exo ± 3 SD. 8Δ ≈ mean + 1.67SD (just under mean+2SD = 9) | RxKit's own quantified pick against a real, named normative table — not an arbitrary guess, but still RxKit's derived choice, not a literature-stated cutoff | ⚪ **RxKit design decision (quantified)** | 2026-09-22 |
| Distance phoria "notable" magnitude | ≥3Δ | Same table: distance lateral phoria 1Δ exo ± 2 SD. 3Δ = **exactly** mean + 1SD | Cleanly matches a defensible, specific statistic from a named table | ⚪ **RxKit design decision (quantified)** | 2026-09-22 |
| MAF "notable" | <6cpm | Sits at the floor of the already-cited 6–16cpm/~8–11cpm adult norm range (§2) | Same style of floor-of-range pick as the phoria thresholds above | ⚪ **RxKit design decision (quantified)** | 2026-09-22 |
| Sheard's multiplier | 2× | ✅ Verified — see §2 Sheard's Criterion above | ✅ Verified | 2026-09-01 |
| Hofstetter minimum AA | `15 − 0.25×age` | ✅ Verified — see §2 above | ✅ Verified | 2026-09-01 |
| Phoria-similar margin (distance vs. near, for Basic patterns) | 3Δ | None possible — Duane's classification names the "Basic" category qualitatively ("similar at distance and near") and was never itself numeric; there is no published number to be sourced or contradicted here | Correctly an engineering translation of a real but non-numeric clinical taxonomy into a usable boundary | ⚪ **RxKit design decision** | 2026-09-22 |
| Near-ortho max (for Fusional Vergence Dysfunction gate) | ≤2Δ | Same reasoning as above — FVD's "normal near/distance phoria" criterion is qualitative in the source literature, never quantified | Same | ⚪ **RxKit design decision** | 2026-09-22 |
| AC/A "high" threshold | >6 Δ/D | A dedicated 2026 diagnostic-criteria study (Cacho-Martínez et al., *J Eye Mov Res*, doi:10.3390/jemr19030053) measured gradient AC/A specifically to find a Convergence Excess cutoff, found it too diagnostically weak to propose one at all (AUC 0.688, below their own usefulness threshold), and excluded it from their criteria — **no validated gradient AC/A cutoff exists in the published literature, full stop** | Relabeled in this pass, not re-derived from a group mean (a mean is not a clinical cutoff, and none was substituted). The number `6` is retained as RxKit's own reference point; the code comment and UI text now say so explicitly instead of implying a sourced threshold | ⚪ **RxKit design decision / reference point** (was 🛑 DISCREPANCY) | 2026-09-22 |
| Near BI "reduced" break | <10Δ | Morgan's-norms compilation: near BI break 21Δ ± 4 SD. 10Δ ≈ mean − 2.75SD — notably stricter than a symmetric mean−1SD rule would give (17Δ) | Quantified, but not derived the same way as the BO figure below — the asymmetry between the two cutoffs isn't explained anywhere in-code | ⚪ **RxKit design decision (quantified, asymmetric — worth a comment explaining why)** | 2026-09-22 |
| Near BO "reduced" break | <15Δ | Same table: near BO break 21Δ ± 6 SD. 15Δ = **exactly** mean − 1SD | Cleanly matches a defensible, specific statistic | ⚪ **RxKit design decision (quantified)** | 2026-09-22 |

### 4.2 Sheard's Criterion application (`domain/reference/binocularSheard.ts`)

| Rule | Source | Status | Reviewed |
|---|---|---|---|
| Blur point preferred over break as the reserve figure (more conservative, reached first); falls back to break only when blur wasn't recorded | Standard clinical convention — see §2 Fusional Vergence Ranges above | ✅ Verified | 2026-09-01 |
| Direction mapping: exophoria → check BO reserve; esophoria → check BI reserve | Direct consequence of the definition of the two deviation types and their compensating reserves | ✅ Verified | 2026-09-01 |

### 4.3 Quick Screen (`domain/reference/binocularQuickScreen.ts`)

Purely a routing/triage mechanism — "recommend Full Assessment if any
symptom OR any objective finding crosses its own already-audited threshold
(§4.1)." No independent clinical claims beyond the thresholds already covered
above. Explicitly, correctly self-labeled in-code as "must never diagnose —
only decide whether Full Assessment is warranted." ⚪ RxKit design decision,
correctly scoped.

### 4.4 Pattern-Matching / Interpretation Engine (`domain/reference/binocularPatterns.ts`)

**This is the most clinically consequential file in the codebase and the one
most directly relevant to the user's specific ask.**

The nine pattern categories it detects are all real, standard, named
diagnostic categories from mainstream binocular-vision classification:

| Category | Underlying taxonomy source |
|---|---|
| Convergence Insufficiency (CI) | Standard classification (originally Duane's 1897 heterophoria classification scheme, still the basis of current teaching); modern criteria and treatment evidence base per the CITT (Convergence Insufficiency Treatment Trial) investigators, published in *Archives of Ophthalmology*/*Optometry and Vision Science* |
| Convergence Excess (CE) | Duane's classification; Scheiman & Wick |
| Divergence Insufficiency (DI) | Duane's classification; Scheiman & Wick |
| Divergence Excess (DE) | Duane's classification; Scheiman & Wick |
| Basic Exophoria / Basic Esophoria | Duane's classification (the "distance ≈ near" categories, as distinct from the four "excess/insufficiency" categories above) |
| Fusional Vergence Dysfunction (FVD) | Standard accommodative/vergence-anomaly classification (Scheiman & Wick's taxonomy of non-strabismic binocular disorders) |
| Accommodative Insufficiency (AI) | Standard accommodative-anomaly classification |
| Accommodative Excess (AE) | Standard accommodative-anomaly classification |
| Accommodative Infacility | Standard accommodative-anomaly classification |

✅ **The taxonomy itself is well supported** — every one of these nine
categories is a real, named, textbook diagnostic entity, not something RxKit
invented.

**Redesigned 2026-09-01, following this audit.** The original design computed
a `'consistent'`/`'possible'` confidence label per pattern via a
corroboration-counting scheme (e.g. CI required 2+ of {magnitude gap, receded
NPC, failed Sheard's}; AI required *bilateral* reduced AA *plus* an
independent MAF/BAF corroborator to reach `'consistent'`) with no source
anywhere — that scoring layer has been removed entirely, along with the
outer combination logic that picked a single "primary" pattern or merged two
matches into a "mixed" verdict (itself a scoring mechanism, comparing
finding-counts to choose a winner). RxKit is explicitly framed as a
**clinical interpretation aid**: it may recognize a clinically meaningful
combination of findings and name what it resembles, but it never converts
that recognition into a synthesized confidence level, and it never diagnoses.

The new shape, applied uniformly to all nine patterns:

- **Each pattern keeps its own trigger condition, largely unchanged from the
  original implementation** — the same `phoriaSimilarMarginDelta`/
  `nearOrthoMaxDelta`/`nearBiBreakLowDelta`/etc. thresholds audited in §4.1
  still gate whether a pattern is suggested at all, for CI, CE, DI, DE, and
  Basic Exo/Eso. Their evidence status was unchanged by this redesign — see
  §4.1 for the current, individually-reconciled status of each (updated
  2026-09-22; mostly ⚪ RxKit design decisions, several now with quantified
  grounding against named normative tables).

  **FVD, Accommodative Excess, Accommodative Insufficiency, and
  Accommodative Infacility were revised on 2026-09-02**, after their
  single-signal-sufficient trigger (inherited unexamined from the old
  `'possible'`-tier floor when the 2026-09-01 redesign first shipped) was
  checked against a dedicated, multi-pass literature review and found
  under-justified. Resolved:
  - **FVD** now requires reduction in **both** near BI and near BO reserves
    (previously either alone) — the literature consistently distinguishes
    FVD/"binocular instability" from CI specifically by involvement of
    *both* directions (Evans BJW, *Ophthalmic Physiol Opt*. 2025;45,
    doi:10.1111/opo.13497; Evans BJW, *Pickwell's Binocular Vision
    Anomalies*, Elsevier).
  - **Accommodative Excess** now requires plus-side difficulty on **both**
    MAF and BAF (previously either alone) — no validated single-test-
    sufficient rule was found; "both typically show difficulty" is the
    best-supported description available (StatPearls: Accommodative Excess,
    NBK592379; Saikia M, Pant K, Dutta J. *J Binocul Vis Ocul Motil*.
    2024;74(2):48–64, doi:10.1080/2576117X.2024.2347663) — **explicitly
    RxKit's own conservative interpretation, not a criterion stated in
    either source**.
  - **Accommodative Insufficiency** now requires a reduced amplitude
    **plus** an independent second abnormal sign (MAF or BAF
    minus-difficulty) — directly grounded in StatPearls: Accommodative
    Insufficiency (NBK587363), which states diagnosis requires "a
    combination of two abnormal test values." The caveat note that used to
    fire when no facility test corroborated ("normal facility does not rule
    out...") is removed — it's unreachable now, since lack of corroboration
    means the pattern no longer triggers at all.
  - **Accommodative Infacility** now requires both-direction difficulty on
    **both** MAF and BAF (previously either alone) — the "fails both
    monocularly and binocularly" description recurred consistently across
    independent searches but could not be traced to one pinned-down primary
    source; adopted as **RxKit's own conservative reading**, labeled as such
    (Griffin JR, Grisham JD. *Binocular Anomalies: Diagnosis and Vision
    Therapy*, 4th ed. Butterworth-Heinemann; 2002 — general reference for
    the entity, not a citation for the exact combination rule).
- **On trigger, one consistently-worded, non-scored suggestion**: "Findings
  suggest a/an [Pattern] pattern." — followed by "Why this pattern was
  suggested" and the same supporting-findings text the original
  implementation already computed (unchanged wording, unchanged selection
  logic) — including CE's "Elevated AC/A ratio" finding, still gated on
  `acaHighAboveRatio = 6` exactly as before. That specific figure's
  gradient-vs-calculated-method mismatch (discrepancy #1 below) is a distinct,
  separately-flagged issue this redesign deliberately did not touch — it
  changes *whether a confidence tier is computed*, not *which raw findings are
  shown or how they're gated*.
- **No cross-pattern arbitration of any kind**: every pattern whose trigger is
  met is shown, independently, in a fixed display order (vergence patterns,
  then accommodative) — never picked as a single "primary," never suppressed
  because another pattern also matched, never merged into a blended "mixed"
  finding.
- **Two caveat strings were trimmed to remove language that only explained
  the old scoring system**, while a genuine, scoring-independent clinical
  caveat was kept where one existed:
  - Accommodative Insufficiency's caveat — shown when neither MAF nor BAF
    corroborates — now reads "Normal accommodative facility does not rule out
    Accommodative Insufficiency. Confirmation recommended if clinically
    indicated." (dropped: "MAF/BAF provide no additional corroborating
    accommodative abnormality," which only explained why the old tier stayed
    low).
  - Accommodative Excess's caveat was dropped entirely — its content
    ("only one facility direction shows difficulty," "symptoms alone do not
    independently corroborate") existed solely to explain the old scoring gap
    and describes a scenario (symptoms alone triggering the suggestion) that
    can no longer occur, since the trigger already requires an objective
    MAF-or-BAF finding.

**Point-of-use citations (added 2026-09-02, `domain/reference/binocularPatternSources.ts`).**
Every suggestion card now shows a compact, collapsed-by-default "Clinical
Source" disclosure directly beneath its findings — not only recorded here in
`CLINICAL_SOURCES.md`. Each entry names a specific, verifiable source
(author/title/publication/year, with a DOI/ISBN where one exists) and states
plainly, in the UI text itself, whenever RxKit's exact trigger is its own
conservative interpretation rather than something the cited source
independently validates — the same distinction drawn throughout this
document, now also visible chairside. The full text of all nine entries is
in that file; the FVD/AE/AI/AInfac citations are given above, and CI/CE/DI/
DE/Basic's are: CI — CITT (2008) + Sheard (1930); CE/DI/DE — Duane
(1896/1897, classification concept only) + Sheard (1930), with the specific
phoria-gap margin and (for CE) the AC/A>6 read stated as RxKit's own
convention; Basic Exo/Eso — Duane (1896/1897, which defines "Basic" by AC/A
band, not checked here) + Sheard (1930), with the magnitude gate stated as
RxKit's own substitute criterion.

**Status: the corroboration-counting/confidence-scoring critique from the
original audit is resolved**, and the four under-justified single-signal
triggers identified in the 2026-09-02 follow-up review are now resolved too
— there is no longer a synthesized confidence label anywhere in this module,
and every trigger that requires two signals now requires them for a
specifically-considered reason (either a validated criterion, for AI, or an
explicitly-labeled RxKit convention, for the other three) rather than by
inheritance from the old tier system. CI/CE/DI/DE/Basic's individual trigger
thresholds (§4.1) and the CE AC/A-method-mismatch discrepancy were reconciled
in the 2026-09-22 follow-up pass (see §4.1 and discrepancy-list item 1 below)
— both were left alone by the 2026-09-01/02 passes on the user's explicit
direction to keep each pass narrowly scoped, not because they were resolved.

### 4.5 Management Considerations (`domain/reference/binocularManagement.ts`)

| Claim | Source | Status | Reviewed |
|---|---|---|---|
| CI: vergence/accommodative therapy "an important option, particularly in younger/symptomatic patients — prism is not the default first recommendation" | CITT (Convergence Insufficiency Treatment Trial) — a NEI-funded multicenter RCT (Scheiman M, et al., *Archives of Ophthalmology*/*Optometry and Vision Science*, ~2005–2008) for children. A **separate CITT-affiliated adult RCT** (ages 19–30) independently confirmed this pass shows office-based therapy improving NPC and positive fusional vergence in young adults with symptomatic CI too | The "adults not independently verified" gap was overstated — it's specifically presbyopic/older-adult ages that remain uncovered, not "adults" broadly | ✅ **Verified for children and young adults (19–30)** — genuinely open only beyond that age range | 2026-09-22 |
| CI: "no simplistic 'under 40 = therapy, over 40 = prism'" | Reasonable clinical caution against oversimplification; consistent with general teaching that treatment choice should be individualized, but not itself a citable empirical claim | ⚪ RxKit design decision (a reasonable caution, not an empirical claim) | 2026-09-01 |
| General AOA-CPG alignment: best-correction-first, vergence/accommodative therapy vs. lens/prism support per pattern | Broadly consistent in spirit with AOA's "Care of the Patient with Accommodative and Vergence Dysfunction" Clinical Practice Guideline (a real, current AOA consensus-based guideline found during this audit) | 🟡 Partially verified — general alignment confirmed; this audit did not perform a line-by-line comparison against the full CPG text | 2026-09-01 |
| All other pattern-specific management summaries (CE/DI/DE/Basic/FVD/AE/AInfac) | Code's own header comment: "a reasonable draft, not yet clinically validated" | Not independently verified beyond general clinical plausibility (each recommendation — e.g. plus addition for accommodatively-driven CE, BI prism as symptomatic relief, facility therapy for infacility — is directionally consistent with mainstream binocular-vision management teaching, but no line-by-line source check was performed for each bullet) | 🟡 Partially verified (general plausibility only) | 2026-09-01 |

**Explicitly correct in-code framing, confirmed by this audit:** every
management entry is phrased as "consider," never as an instruction, and the
`BEST_CORRECTION_NOTE` (confirm optimal refractive correction before
attributing findings to a binocular/accommodative cause) prepended to every
pattern is itself good, standard clinical practice.

### 4.6 Guided Next Steps (`domain/reference/binocularOptionalHints.ts`)

Pure derived-logic recommendations ("you have finding X, test Y would add
information") — each individual recommendation reason is a direct, defensible
logical consequence of already-audited thresholds/tests above, not an
independent new clinical claim. ⚪ RxKit design decision, reasonably built on
already-covered material.

### 4.7 Consistency Checks (`domain/reference/consistencyChecks.ts`)

| Rule | Source | Status | Reviewed |
|---|---|---|---|
| Eso is neutralized with base-out, exo with base-in — always | Direct, universal consequence of the definitions of eso/exo-deviation and prism neutralization — this is not really a "clinical judgment," it's optical necessity | ✅ Verified | 2026-09-01 |

### 4.8 UI-layer derived text (`modules/guide/BinocularSummary.tsx`)

| Item | Note | Status | Reviewed |
|---|---|---|---|
| `reassuranceLine()` — shows "No significant associated [vergence/accommodative] dysfunction demonstrated" whenever exactly one single well-identified pattern exists in the *other* category | This is a UI-layer restatement of what `interpretBinocularAssessment()` already computed (no independent clinical claim — it's just "the other category's check list came back empty"), but it lives in the component rather than the domain layer, which means its logic isn't unit-tested/reviewed alongside the rest of the pattern-matching engine in `binocularPatterns.ts` | ⚪ RxKit design decision — logically sound restatement, flagged only as a code-organization note (should arguably live in `binocularPatterns.ts` next to the logic it restates) rather than a clinical-accuracy concern | 2026-09-01 |

---

## 5. Cross-Cutting: Duplicated Sign/Direction Conventions

The eso→BO / exo→BI / hyper-eye→BD / hypo-eye→BU neutralization-direction
table appears **independently, verbatim, in at least four places**:
`MaddoxRodQuickCard.tsx`, `VonGraefeQuickCard.tsx`, `SchoberQuickCard.tsx`,
and (in cover-test-movement form) `CoverTestQuickCard.tsx`. Each carries only
a vague in-code comment ("derived from first principles, not guessed" /
"cross-checked against Maddox Rod's own verified... rule") rather than a
single shared, named citation.

**Status: ✅ Verified as clinically correct** (this is universal, standard
optics/binocular-vision teaching — the sign convention follows directly from
how a prism bends light and how "phoria type" is defined, and is consistent
across every source checked in this audit). **Documentation-hygiene
recommendation** (not a clinical-accuracy issue): consolidate this into one
named, cited reference (e.g. a single comment block citing Scheiman & Wick or
an equivalent binocular-vision text) that the four quick cards all point back
to, rather than four independent "derived from first principles" comments —
this reduces the risk of the four copies silently drifting apart over time.

---

## Summary

### 1. Well-supported areas

- **All five optical calculators' core formulas** (transposition, working
  distance → ADD, vertex distance, spherical equivalent, Prentice's Rule /
  meridional-power prism math) — these are pure, universal optics with no
  clinical-judgment component, and every formula checked out against
  authoritative dispensing/optics references.
- **Rx notation conventions** (Pln for plano, axis omission for spherical-only
  Rx, no axis zero-padding) — standard clinical charting convention.
- **Named test procedures and their basic optical/physiological principles**
  (Cover Test, Maddox Rod family, Von Graefe, Worth 4 Dot, Pinhole Test, MEM/
  Nott Retinoscopy sign convention, Double Maddox Rod including its
  documented red-rod bias — this audit found an even stronger primary source,
  Kushner 1994, than the code's own citation).
- **Sheard's Criterion and Percival's Criterion** — both are real, correctly
  stated, well-established named criteria (now independently sourced by this
  audit, even though neither carried an inline citation in the code before).
- **The eso→BO/exo→BI/hyper→BD/hypo→BU direction convention as taught by
  Maddox Rod and Schober Test specifically** — this is the same rule already
  Verified in §5 as universal optics teaching; scoring it lower on those two
  individual cards was an inconsistency fixed in the 2026-09-22 follow-up.
- **CI vergence/accommodative therapy over prism, for children *and* young
  adults (19–30)** — a dedicated adult CITT-affiliated RCT closes most of what
  was previously an unverified "adults" gap (2026-09-22).
- **The third-nerve-palsy pain/ptosis/pupil OR-logic red flag, as a triage (not
  diagnostic) trigger** — re-checked in 2026-09-22 against current literature
  on pupil-sparing reliability; the current non-differentiated design turns out
  to be the safer choice, not a gap.
- **Superior oblique palsy torsion pattern** (excyclotorsion of the
  hypertropic eye; >10° suggesting bilateral palsy) — confirmed against
  StatPearls and AAO EyeWiki.
- **The nine Binocular Status diagnostic categories themselves** (CI, CE, DI,
  DE, Basic Exo/Eso, FVD, AI, AE, AInfac) as a taxonomy — all real,
  established clinical entities, most traceable to Duane's classification and
  Scheiman & Wick's modern taxonomy.
- **The overall product philosophy** — every interpretive surface is
  correctly hedged ("consider," "possible," never an automatic prescription),
  and the codebase is unusually honest with itself about what is and isn't
  validated, which made this audit tractable.

### 2. Weakly supported or missing-source areas

**Updated 2026-09-22** — reconciled against sources already present in the
project, plus focused new research for items that had none. Most of what this
section listed on 2026-09-01 turned out to be *derived software cutoffs from
an already-sourced clinical rule* or *secondary-source-only* citations, not
clinical claims with no support at all — see the per-row status changes above
for the full reasoning. What remains genuinely weak or missing:

- **The Binocular Status pattern triggers' individual numeric cutoffs**
  (§4.1: near/distance phoria magnitude, near BI/BO "reduced" break, MAF
  "notable," phoria-similar margin, near-ortho max) — now individually
  reclassified as ⚪ **RxKit design decisions**, several with real quantified
  grounding against Morgan's-type norms (documented per-row above), rather
  than left as blanket 🔴 NEEDS SOURCE. The underlying diagnostic categories
  are real and sourced; these specific numeric gates are RxKit's own, by
  necessity — no published source could settle most of them even in principle
  (Duane's classification was never itself numeric).
- **Most of `binocularManagement.ts`'s pattern-specific management bullets**
  beyond the CI/CITT-supported headline — still directionally reasonable, not
  individually verified line-by-line. Unchanged by this pass; a real task if
  wanted later.
- **AOA CPG general alignment** — named source exists, no full line-by-line
  comparison performed. Unchanged; a real task if wanted later.

### 3. Implementation/source discrepancies requiring review

1. ~~🛑 AC/A "elevated" threshold (`acaHighAboveRatio = 6`) contradicts the
   codebase's own Gradient AC/A test card~~ — **resolved 2026-09-22**: a
   dedicated 2026 diagnostic-criteria study (Cacho-Martínez et al., *J Eye Mov
   Res*, doi:10.3390/jemr19030053) confirms **no validated gradient AC/A
   cutoff exists in the literature** — the study measured exactly this
   relationship, found gradient AC/A too diagnostically weak to propose a
   cutoff at all (AUC 0.688), and excluded it from their own criteria. Per
   explicit instruction, a group mean was *not* used to derive a replacement
   number (a mean is not a clinical cutoff). Instead: `binocularNorms.ts`'s
   comment, the `binocularPatternSources.ts` CE citation, and the
   `binocularPatterns.ts` UI finding text ("Elevated AC/A ratio" →
   "AC/A ratio above RxKit's reference point") were all updated to state
   plainly that `6` is RxKit's own reference point, not a clinical threshold.
   Status reclassified ⚪ RxKit design decision / reference point.
2. ~~🛑 Third-nerve-palsy-style red flag (pain, ptosis, OR pupil involvement)
   treats all three signs as equally weighted triggers~~ — **resolved
   2026-09-22**: re-checked against current sources; the "rule of the pupil"
   is itself now flagged in the literature as unreliable (up to 20% of benign
   ischemic palsies show some pupil involvement; early compressive lesions can
   spare it), and pain doesn't reliably differentiate cause either. Since
   RxKit only triggers "seek prompt evaluation" rather than a risk tier,
   equal-weight OR-logic is the safer design, not a gap. No code change;
   status reclassified ✅ Verified (as a triage tool).
3. **NPC "notable" threshold (6cm)** — no longer "an unexplained pick within a
   contested range": read both governing primary studies in full this pass.
   It's an *exact match* to Hayes et al. 1998's pediatric cutoff, while
   Scheiman et al. 2003's rigorous adult-specific study recommends 5cm
   instead. Precisely characterized now rather than resolved outright — still
   worth a deliberate choice between the two, or an explicit comment
   explaining why the pediatric figure was kept for a general-audience tool.
4. ~~Sheard's Criterion and Percival's Criterion carried zero inline source
   citation anywhere in the codebase~~ — **fixed 2026-09-01**: citations
   (Sheard C. "Zones of Ocular Comfort." *American Journal of Optometry*.
   1930;7:9–25; Percival AS. "The Relation of Convergence to Accommodation
   and Its Practical Bearing." *Ophthalmic Review*. 1892;11:313–328; both
   cross-referenced to Scheiman & Wick's *Clinical Management of Binocular
   Vision*) were added as a "Source" subsection on both cards in
   `clinicalTests.ts`, plus a doc-comment citation on `binocularSheard.ts`
   (the module implementing Sheard's pass/fail logic) and on the
   `sheardMultiplier` constant in `binocularNorms.ts`. Percival's Criterion
   has no separate implementation module — it is reference-only, not wired
   into `binocularPatterns.ts` — so the card's citation is its only code
   location.
5. **Sign/direction convention duplicated verbatim across four quick-card
   files** (§5) with no shared citation — not a factual error (all four
   copies are correct and mutually consistent), but a latent risk that a
   future edit to one copy silently diverges from the other three.

---

*This document reflects a point-in-time audit and should be re-reviewed
whenever `binocularNorms.ts`, `binocularPatterns.ts`, `clinicalTests.ts`, or
`clinicalPathways.ts` change in a way that touches a numeric threshold,
interpretation rule, or named clinical criterion.*
