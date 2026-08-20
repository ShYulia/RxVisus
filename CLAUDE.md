# CLAUDE.md

Guidance for AI-assisted work in this repo. Product reasoning lives in
[docs/design.md](docs/design.md); this file is the technical/working
conventions layer.

## Status

MVP build in progress. Calculators (Transposition, Working Distance → ADD,
Vertex Distance) and the Clinical Guide architecture (canonical test
cards, pathway navigation, seeded with Diplopia) are implemented; Prism
calculator and most Clinical Guide content are still to come. See
[README.md](README.md) for the product pitch and non-negotiable
constraints (no AI/backend, offline-only, no patient-identifiable data).

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
