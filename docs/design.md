# Design

Product reasoning behind RxVisus. Technical/coding conventions live in
[../CLAUDE.md](../CLAUDE.md); this file is the "why."

## What this actually has to beat

The goal — a tool opened several times a day during real clinical work —
is hard, but the bar to clear is concrete: **not other apps, but mental
math, paper cheat-sheets, and half-remembered textbook rules.** That's what
a working optometrist actually reaches for today.

Two direct implications:

1. **Speed to the tool matters as much as the tool itself** — every
   calculator needs to be reachable in two taps or fewer from launch.
2. **Correctness isn't a quality bar, it's the entire value proposition** —
   a clinical calculator that's "close enough" is worse than no calculator,
   because it gets used with confidence. Every formula and rounding
   convention must be checked against real clinical judgment (the intended
   real user) before shipping.

## Commercial potential — an honest read

Real, but modest and specific — not a viral-growth product.

- Optometrists/opticians are a genuine, reachable professional population.
  Existing "optical calculator" apps are largely single-purpose, dated, or
  ad-cluttered — there's a real gap for something coherent and polished.
- The "no backend, fully offline" constraint is a good business decision,
  not just a technical one: zero marginal operating cost per user means
  even a small paying base is profitable.
- **Distribution, not demand, is the real risk.** This is a niche
  professional tool — growth comes from the existing real user,
  professional forums/associations, and word of mouth. Make it trivially
  easy for a happy user to recommend it to a colleague.
- **Monetization shape for later** (not needed for MVP): keep the
  calculators, Prism Assistant, and Clinical Quick Reference free forever
  (builds trust in a professional community); put a one-time "Pro unlock"
  on higher-effort future modules (contact lens catalogue/troubleshooting,
  comparisons). One-time purchase fits this audience better than a
  subscription.
- **Realistic success**: a few thousand real, working professionals who
  trust it and use it daily — a genuinely good outcome for a solo-built
  niche tool.

## Information architecture

**Three pillars, not a flat tool list** — the requested tools naturally
group into three distinct kinds of interaction, and that grouping is the
top-level structure:

- **Calculate** — the MVP calculators. Form in, number out, fast.
- **Assistant** — the Prism Assistant. Guided, educational,
  decision-support — teaches reasoning, not just produces a number.
- **Reference** — the Clinical Quick Reference, and the home for future
  lookup-style modules.

**Home isn't a menu** — it surfaces recently used and most used tools
first, learned from actual usage, not a static directory.

**Assistant and Reference cross-link, not silo.** "Vertical diplopia" is a
real entry in both the Prism Assistant (reasoning, base-direction
convention) and the Clinical Quick Reference (exam workflow). They share a
tag/ID system (see [../CLAUDE.md](../CLAUDE.md) data model) so one
underlying topic has two views instead of duplicated content that drifts.

**Android-first navigation**: bottom nav with four destinations — Home,
Calculate, Assistant, Reference (standard Material Design pattern for this
count). Settings goes in the top-app-bar overflow menu, not a fifth slot —
it's rarely touched and shouldn't clutter primary navigation.

## MVP scope

**Five calculators, sequenced by complexity/risk, not by request order** —
proves the calculator UI pattern cheaply on the simplest case first, and
pushes the most clinically variable calculator to last, when there's been
the most time to validate it against real practice:

1. **Prescription transposition** (+cylinder ↔ −cylinder) — pure, simple,
   well-defined math. Best first build.
2. **Working distance → ADD calculator** — also simple, low risk.
3. **Vertex distance calculator** (spectacle Rx → contact lens Rx) — a
   real formula, but sign/unit handling needs care.
4. **Prism calculator** (Prentice's rule) — well-defined, deterministic.
5. **Progressive fitting height calculator** — the most clinically
   variable (depends on frame, PD, lens design, often lab-specific
   convention). Build last, and validate the exact rule with the real
   intended user before writing it.

**Prism Assistant** — a guided flow, not a form: "What is the patient
describing?" → crossed diplopia / uncrossed diplopia / vertical diplopia →
explanation of the base-direction convention *and* the reasoning, linking
into the matching Quick Reference exam workflow. Classically taught with
simple ray diagrams in optometry training — lean on illustrations, not just
text. MVP topics: crossed vs. uncrossed diplopia, vertical diplopia, base
IN vs. base OUT, common prism rules and why.

**Clinical Quick Reference** — a searchable structure: complaint → common
exams performed → key clinical rules (crossed/uncrossed/vertical diplopia
at MVP). Explicitly **not** diagnostic — a memory aid for trained
professionals. Keep a small, persistent footer note: "reference only —
clinical judgment required."

## Beyond the MVP

Deliberately excluded from MVP, to validate after there's a real, in-use
core:

- **Contact lens catalogue/troubleshooting** — build first among these:
  it's the named "Pro unlock" candidate, so it tests the monetization
  model once the free core has built trust; also the highest-effort of the
  three, so it benefits most from the domain/modules separation already
  proven out by then.
- **Lens material/coating comparison** and **expanded binocular vision
  reference** — lower-effort Reference-pillar extensions, sequenced by
  whichever the real user asks for first.
- **Additional calculators** (back vertex power conversions, minimum blank
  size, decentration/induced prism) — add only once real use of the MVP
  five surfaces a genuine gap, not speculatively.

Anything that breaks the core constraints in [../README.md](../README.md)
(accounts, cloud sync, AI features, ads) is out of scope permanently, not
deferred.
