# RxKit

**Clinical Tools for Optometry**

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

The product's user-facing brand is **RxKit** — "*RxKit — Clinical Tools
for Optometry*" is the full presentation; UI surfaces show the short
form (`RxKit`) with the tagline reserved for onboarding/install/About-
style brand surfaces.

**The repository and internal project name are independent of the
product brand and are not being renamed.** The codebase, package name,
Capacitor `appId`, and local-storage key namespace all still use the
project's earlier working name (`rxvisus`) — that's a technical/internal
identifier, not the product people see, so there's no reason to touch
it just because the brand changed. If you're looking for the earlier
naming history: this project went through two working names before
landing on the final brand — `OptoBench`, then `RxVisus` (chosen partly
because "RxKit" collided with ReactiveX libraries in software search
results at the time) — before "RxKit" was confirmed as the final
product name regardless of that collision.
