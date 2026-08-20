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
See "Next session" below for three items approved but deliberately not
yet built.

## NEXT SESSION — approved, not yet implemented

Approved 2026-08-20. None of the three items below have any code written
yet — no routes, no domain files, no store, no UI changes. Do not treat
anything in this section as already working. Each is its own
implementation pass; check in before combining more than one in a single
session (see "Working conventions" below on incremental steps).

### 1. Favorites — fourth bottom-navigation tab

Navigation becomes **Home / Calculators / Clinical Guide / Favorites**.

- Favorites is a **bottom-nav tab**, not a Home card. Home stays focused
  on exactly two destinations (Calculators, Clinical Guide) — do not add
  a third Home feature card for Favorites.
- Favorites is a cross-module shortcut layer, not tied to one content
  type: it should eventually surface frequently-used/bookmarked items
  from any module — calculators, Clinical Guide tests, Clinical Guide
  pathways, and future module items (e.g. a future Contact Lenses entry)
  — not just calculators.
- Worked example: a user who frequently uses Vertex Distance should be
  able to go `Favorites → Vertex Distance` directly.
- Icon: a star. Match whichever icon style/library ends up canonical for
  navigation — the bottom tab bar currently uses `@phosphor-icons/react`
  (duotone) while the desktop `SideRail` still uses the original
  hand-drawn `components/icons.tsx` set; decide/confirm consistency
  before picking one for Favorites.
- Persistence: local-only, offline. Likely the same shape already
  established for the display-name preference — a Zustand store
  (`store/`) hydrated from `@capacitor/preferences` (see
  `store/profileStore.ts` for the existing pattern to mirror).
- Data model: work out what a stored "favorite" reference looks like
  before implementing — likely something like
  `{ type: 'calculator' | 'test' | 'pathway'; id: string }`, pointing at
  existing ids already defined in `calculatorRegistry.ts`,
  `domain/reference/clinicalTests.ts`, and
  `domain/reference/clinicalPathways.ts`. Favorites is a cross-cutting
  shortcut list, not a fourth entry in `navigation/topLevelModules.ts`
  (that registry is specifically for top-level product *modules*, and
  Favorites doesn't have its own screens/content the way Calculators or
  Clinical Guide do) — it needs its own small registry/store instead.
- Touches: `navigation/Tabs.tsx`, `navigation/SideRail.tsx`, a new
  `store/favoritesStore.ts` (or similar), and a new `modules/favorites/`
  screen.

### 2. Copy Result — remove from most calculators, keep only on Vertex Distance

Standing product rule (see also "Working conventions" below):
**Copy Result is opt-in per calculator, added only when there's a
concrete external workflow that needs the result copied — never a
reflexive default.** Vertex Distance keeps it because the converted Rx
commonly needs to be copied into an email/order form when ordering
contact lenses; no other current or planned calculator has an equivalent
described workflow.

Next session:
- Remove the `ActionRow` Copy Result button from
  `TranspositionCalculator.tsx` and `WorkingDistanceToAddCalculator.tsx`.
- Do not add it to the future Spherical Equivalent calculator (item 3) or
  to Prism/Prentice's Rule by default when that's eventually built.
- Keep it only on `VertexDistanceCalculator.tsx`.
- This rule is specifically about **Copy Result**, not `Clear` — `Clear`
  is a separate, generally-useful action. Confirm with the user whether
  `Clear` should also become opt-in before assuming either way; nothing
  here decides that.
- `components/ActionRow.tsx` itself likely doesn't need to change — this
  is about which screens render it, not the component's implementation.
  Check whether `ActionRow` needs a "clear only, no copy" mode/prop once
  you're in the code, since two of its three current callers will drop
  the copy half.

### 3. New calculator — Spherical Equivalent

Add to the calculator roadmap, following the exact same architecture as
the existing calculators: a pure domain function + `.test.ts` under
`domain/calculators/`, a screen under `modules/calculators/` using the
existing `FieldBox`/`FieldBoxGrid` inputs and `CalculatorResult` output
components, registered in `calculatorRegistry.ts` so it appears in the
Calculators hub automatically.

- **Formula**: `SE = SPH + (CYL / 2)`.
- **Inputs**: SPH and CYL only — no axis (axis doesn't affect spherical
  equivalent). Use neutral zero placeholders for both (`0.00` / `0.00`),
  matching the placeholder convention established for Vertex Distance
  this session — never an example Rx value (e.g. `-6.50`) as a
  placeholder, since a muted example value can be mistaken for an
  entered one.
- **Worked example**: SPH −4.00, CYL −1.50 → Spherical Equivalent
  = −4.75 D.
- Use the existing diopter/Rx formatting helpers
  (`modules/calculators/formatDiopter.ts`) rather than inventing new
  formatting.
- Should eventually be a valid Favorites target (item 1) — keep its
  `calculatorRegistry.ts` id stable once created, since Favorites will
  likely reference calculators by id.
- **No Copy Result button** — per item 2's rule, there's no described
  external workflow for this calculator.
- Purely a mathematical calculation, not a clinical recommendation or
  interpretation — same "convert, never decide" posture already
  established for Working Distance → ADD and Vertex Distance (see
  memory/feedback on this principle from earlier sessions, if available).

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
- **Copy Result is opt-in per calculator, not a default action.** Add it
  only when a calculator has a concrete external workflow that needs the
  result copied elsewhere (Vertex Distance: pasting the converted Rx into
  an order/email when ordering contact lenses). Do not add it reflexively
  to every calculator screen just because the component exists — see
  "Next session" item 2 above for the specific cleanup this implies.
