# RxVisus

A professional toolkit application for opticians and optometrists —
calculators, an educational Prism Assistant, and a clinical quick
reference, designed to be opened several times a day during real
clinical work.

**Status: design phase.** No code has been written yet. This repository
exists to capture the product design in detail before implementation
starts, so decisions and their reasoning aren't lost.

## The pitch

Not a collection of unrelated calculators — a polished, coherent
professional toolkit. Fully offline, fully deterministic (no AI, no LLM,
no external APIs, no recurring costs), Android-first, with one real
intended user already identified (a practicing optometrist), so this is
built to solve real problems, not as a portfolio demo dressed up as one.

## Core constraints (non-negotiable, by design)

- No AI, no LLM, no external APIs.
- No recurring costs — everything runs locally, offline, after install.
- Never stores patient-identifiable information (see
  [CLAUDE.md](CLAUDE.md)).
- Android-first, distributed via Google Play; desktop is a bonus, not a
  requirement.
- Every calculator's formula and rounding convention must be validated
  against real clinical judgment (the intended real user) before
  shipping — this app produces numbers used in real patient care.

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Tech stack, folder structure, data model,
  and working conventions for AI-assisted development.
- **[docs/design.md](docs/design.md)** — The product reasoning: what this
  has to beat, information architecture, MVP scope, and what's planned
  beyond it.

## Note on the name

"RxVisus" was chosen over several alternatives (OptoBench, RxKit, RxBench)
after checking for naming collisions: "RxKit" collides heavily with
ReactiveX libraries (RxJava/RxSwift/RxJS) in software search results, and
"Bench" wasn't wanted in the final name. "Visus" is the clinical Latin
term for vision/visual acuity used in optometry and ophthalmology, so the
name keeps "Rx" for immediate prescription-toolkit clarity while reading
as authentically clinical rather than generic.
