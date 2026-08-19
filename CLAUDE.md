# CLAUDE.md

Guidance for AI-assisted work in this repo. Product reasoning lives in
[docs/design.md](docs/design.md); this file is the technical/working
conventions layer.

## Status

Design phase. No application code yet — see [README.md](README.md) for the
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
      prism.ts
      progressiveFittingHeight.ts
    reference/
      prismTopics.ts
      quickReferenceEntries.ts
  modules/                 # one folder per top-level pillar — screens + components
    home/
    calculators/
    prismAssistant/
    quickReference/
  components/               # shared UI (buttons, inputs, cards)
  navigation/
  store/                     # favorites, usage history, settings — local only
  theme/
```

Adding a future module (e.g. contact lens troubleshooting) means adding a
file under `domain/` and a folder under `modules/` — nothing existing has
to change.

## Data model

No backend — everything is static local content plus local device state.

```ts
interface PrismTopic {
  id: string;
  title: string;                  // e.g. "Vertical diplopia"
  symptomTags: string[];          // shared vocabulary with QuickReferenceEntry
  explanation: string;
  reasoning: string;               // the "why", not just the rule
  relatedExamWorkflow: string[];   // IDs into QuickReferenceEntry
}

interface QuickReferenceEntry {
  id: string;
  complaint: string;
  commonExams: string[];
  keyRules: string[];
  relatedPrismTopics: string[];    // IDs into PrismTopic
}
```

The Prism Assistant and Clinical Quick Reference share this tag/ID system so
one underlying topic (e.g. "vertical diplopia") has two views — reasoning
and workflow — instead of duplicated content that can drift.

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
