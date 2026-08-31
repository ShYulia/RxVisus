# CLAUDE.md

Guidance for AI-assisted work in this repo. Product reasoning lives in
[docs/design.md](docs/design.md); this file is the technical/working
conventions layer.

## Naming

**RxKit is the product brand** (full presentation: "RxKit — Clinical
Tools for Optometry"; UI surfaces show the short `RxKit` form on their
own, with the tagline reserved for onboarding/install/About-style brand
surfaces). **The repository and internal project name are independent
of the product brand and are not renamed to match** — package name,
Capacitor `appId`, and the local-storage key namespace all still read
`rxvisus` (an earlier working name; before that, `OptoBench`). Don't
"fix" these to say `rxkit` just because the brand changed — see
[README.md](README.md#note-on-the-name) for the full history.

## Status

MVP build in progress. Calculators (Transposition, Working Distance → ADD,
Vertex Distance, Spherical Equivalent, Prism & Decentration), Favorites
(cross-module shortcut layer, seeded from calculators and Clinical Guide
content), and the Clinical Guide architecture (canonical test cards,
pathway navigation, seeded with Diplopia) are implemented; most Clinical
Guide content is still to come. See [README.md](README.md) for the
product pitch and non-negotiable constraints (no AI/backend, offline-only,
no patient-identifiable data).

## Stack

**React + TypeScript + Capacitor + Ionic React.**

- Capacitor wraps the app as a real installable Android app for Google Play
  (and gets a desktop build via Electron/Tauri nearly for free later).
- Ionic React provides Material-Design bottom tabs, native-feeling
  lists/forms, and platform gestures out of the box — solves
  "Android-first navigation" without hand-building mobile UI conventions.
- **State**: Zustand.
- **Local persistence**: Capacitor Preferences (native), IndexedDB fallback
  for web/desktop builds.
- **Testing**: Vitest.

Flutter was considered and set aside — better native feel long-term, but
Dart is a real cost on top of the domain for a solo build. Revisit only if
native performance/feel becomes an actual problem (unlikely — this is a
forms/reference/calculator app, no heavy graphics or animation).

## Folder structure

Pure calculation logic stays completely separate from UI — correctness is
the entire value proposition here, and pure functions with zero UI
dependencies are trivially unit-testable.

```
src/
  domain/                  # pure logic + static reference content, zero UI dependencies
    calculators/
      transposition.ts
      workingDistanceToAdd.ts
      vertexDistance.ts
      toricAvailability.ts
      prism.ts               # not yet built
    reference/
      clinicalTests.ts        # canonical test cards (ClinicalTest)
      clinicalPathways.ts     # problem-first navigation (ClinicalPathwayNode)
      guideAreas.ts            # Clinical Guide hub's top-level entries
  modules/                 # one folder per top-level module — screens + components
    home/
    calculators/
    guide/                  # Clinical Guide: hub, generic pathway renderer, test list/card
  components/               # shared UI (buttons, inputs, cards, CautionBox, Chip, ...)
  navigation/
    topLevelModules.ts      # registry driving Home's cards AND the tab bar
    moduleVisuals.tsx        # icon/illustration key -> component resolver (kept separate from the data)
  store/                     # favorites, usage history, settings — local only
  theme/
```

Adding a future top-level module (e.g. Contact Lenses) means one entry in
`navigation/topLevelModules.ts` plus a folder under `modules/` — it won't
appear in Home or the tab bar until that entry exists. Nothing else has to
change; there is no special-casing for "future" modules.

## Data model

No backend — everything is static local content plus local device state.

```ts
interface ClinicalTest {
  id: string;                     // canonical, e.g. "double-maddox-rod"
  title: string;
  tags: string[];                 // search vocabulary
  purpose: string;
  setup: string[];
  howTo: string[];
  whatToWatch: string[];
  record: string[];
  quickTip?: string;
  commonMistakes?: string[];      // the details that are easy to forget
}

interface ClinicalPathwayNode {
  id: string;
  title: string;
  kind: 'branch' | 'leaf';
  overview?: string;
  keySteps?: string[];
  redFlags?: string[];
  children?: string[];            // branch only: child ClinicalPathwayNode ids
  testIds?: string[];             // leaf only: ClinicalTest ids — reference, never a copy
}
```

A `ClinicalTest` exists exactly once (`domain/reference/clinicalTests.ts`).
`ClinicalPathwayNode`s (`domain/reference/clinicalPathways.ts`) walk a
clinical problem down to a `leaf`, which points at relevant tests by id —
so "Double Maddox Rod" reached via `Diplopia → Binocular → Vertical` is the
same canonical Test Card as reaching it via direct search. One generic
renderer handles every pathway node (branch or leaf) and one renderer
handles every test card — content grows by adding data, not screens.

Top-level product modules (Calculators, Clinical Guide, and any future
module) are a small registry, not hardcoded UI — see
`navigation/topLevelModules.ts` in the folder structure above.

Calculators are pure, stateless functions (input in, number out), no
persistence by default. User state is local-only: settings, favorites,
usage-frequency (powers Home's "most used" section), and optionally an
anonymous numbers-only calculation history.

**Never store patient-identifiable information** — no names, no patient
IDs. This keeps the app out of medical-records/healthcare-data-privacy
territory while fully supporting the actual workflow.

## Working conventions

- Every calculator's formula and rounding convention must be validated
  against real clinical judgment (the intended real user) before shipping —
  this is a correctness product, not a UI product.
- Build calculators in complexity/risk order (see
  [docs/design.md](docs/design.md)) — simplest first to prove the pattern,
  most clinically variable last.
- **Copy Result is shown on every calculator except Working Distance →
  ADD and Prism & Decentration.** (Revised 2026-08-23 — originally
  opt-in per calculator with a concrete external-workflow justification;
  broadened after product decision. Prism & Decentration excluded
  2026-08-23 per product decision.) `ActionRow`'s `showCopy` prop
  (default `false`) still gates the button — Transposition, Vertex
  Distance, and Spherical Equivalent all pass `showCopy` with `copyText`
  set to their formatted result; Working Distance → ADD and Prism &
  Decentration render `<ActionRow onClear={...} />` with no copy-related
  props. If you add a new calculator, default to including Copy Result
  unless there's a specific reason (like ADD's or Prism & Decentration's)
  to leave it off.
- **Input placeholders are neutral, never realistic example values.** A
  placeholder that looks like a plausible entered Rx (`-6.50`, `1.50`,
  `50`, `180`) can be mistaken for an actual or default value.
  - Dioptric fields (SPH, CYL, ADD, etc.) → `0.00`.
  - Distance fields (cm, mm) → `0`.
  - AXIS → **no numeric placeholder at all.** Put the valid range in the
    label instead (`AXIS (1–180°)`) and leave the field visually empty.
    Since axis is clinically meaningless without a cylinder, disable the
    AXIS input (via `FieldBox`'s `disabled` prop) until CYL resolves to
    non-zero, and don't require it in validation while it's disabled —
    see `TranspositionCalculator.tsx` / `VertexDistanceCalculator.tsx`
    for the pattern (blank CYL treated as `0`, axis conditionally
    required/disabled off that).
  - Placeholders are visual only — an untouched field's actual state
    stays empty/`NaN`, never initialized to `0`. Never rely on the
    placeholder value as the real default.
  - If a concrete example is genuinely useful, show it as helper text
    below the input (`FieldBox`'s `helperText` prop, e.g. "Example: 50
    cm"), never as the placeholder itself.
- **Displayed axis values are never zero-padded.** `33`, not `033` — an
  axis under 100 is shown as its plain number, not a fixed 3-digit
  field. `formatRx` (`formatDiopter.ts`) and the Vertex Distance stock-
  parameters panel are the two spots that render an axis; keep both
  plain (no `padStart`) if either is touched again.
- **A zero sphere is entered and displayed as `Pln`, matching real Rx
  notation, not `0.00`.** `parseSphereInput` (`formatDiopter.ts`) accepts
  the typed text `Pln` (case-insensitive) as sphere `0`; `formatSphere`
  is the inverse — it prints `Pln` for a zero sphere instead of `+0.00`.
  `formatRx` uses `formatSphere` for the sphere component only —
  cylinder and other generic diopter values still go through
  `formatDiopter` and keep showing `+0.00`; plano is sphere-specific
  clinical shorthand, not a generic "zero" convention. Because `Pln`
  requires letters, SPH fields use `inputMode="text"` (not `"decimal"`)
  so the on-screen keyboard doesn't lock mobile users out of typing it;
  every SPH field should carry a `helperText="Plano: type Pln"` hint
  (see `TranspositionCalculator.tsx` / `VertexDistanceCalculator.tsx` /
  `SphericalEquivalentCalculator.tsx`). Any future calculator with a SPH
  input should follow the same pattern.
- **`formatRx` omits the `/ CYL x AXIS` tail entirely when cylinder is
  0.** A spherical-only Rx is written clinically as just the sphere
  (`-4.00`, or `Pln`) — never `-4.00 / +0.00 x 180`, since axis has no
  meaning without a cylinder (same principle as the AXIS-disabled-when-
  CYL-is-0 input rule above). This was the same "fake axis on a
  spherical result" bug already fixed once for Vertex Distance's stock-
  parameters panel (`toricAvailability.ts` / `mapToAvailability`,
  2026-08-20) — `formatRx` needed the identical fix for its own primary
  Rx display, since it was still appending a meaningless axis (e.g.
  `Transposition`'s spherical-only path always fed `axis: 180` into
  `transpose`, which then does `axis + 90`, silently surfacing as a
  fake `x 90`).
