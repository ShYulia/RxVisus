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
  calculators and Clinical Guide free forever
  (builds trust in a professional community); put a one-time "Pro unlock"
  on higher-effort future modules (contact lens catalogue/troubleshooting,
  comparisons). One-time purchase fits this audience better than a
  subscription.
- **Realistic success**: a few thousand real, working professionals who
  trust it and use it daily — a genuinely good outcome for a solo-built
  niche tool.

## Information architecture

**Top-level modules, driven by a registry — not a fixed pillar count.**
RxVisus is a growing professional toolkit, not a permanently three- (or
two-) part app, so the top-level structure is a small data table
(`navigation/topLevelModules.ts`: id, title, description, route, icon,
illustration, shown-in-nav) that both Home's cards and the tab bar render
from. Adding a future module (e.g. Contact Lenses) is one row in that
table — it doesn't appear anywhere until it's real; there's no
placeholder tab or empty card for planned-but-unbuilt modules.

For the current MVP, two modules exist:

- **Calculators** — form in, number out, fast.
- **Clinical Guide** — fast chairside clinical recall and guided
  navigation. This replaces what used to be two separate pillars
  (**Assistant** and **Reference**) — they didn't hold up as separate
  destinations: an optometrist doesn't think "should I open Assistant or
  Reference," they think "my patient has diplopia, what should I check"
  or "remind me how to run the Double Maddox Rod test." Both needs live
  in Clinical Guide now.

**Home isn't a menu** — the intent is still to eventually surface
recently/most-used tools first, learned from actual usage rather than a
static directory; that behavior isn't implemented yet (Home currently
renders the module registry as-is).

**Clinical Guide supports two ways into the same content, never
duplicated.** A clinical-problem entry (`Diplopia → Binocular → Vertical
→ relevant tests`) and a direct entry (`Tests → Double Maddox Rod`, or
searching "Maddox") both land on the same canonical Test Card. Pathways
reference tests by id (`ClinicalPathwayNode.testIds`); they never copy a
test's content. See `domain/reference/clinicalPathways.ts` and
`clinicalTests.ts` for the data model — this supersedes the older
`PrismTopic`/`QuickReferenceEntry` cross-linking design in
[../CLAUDE.md](../CLAUDE.md) (written for the old separate-pillars split).

**Clinical Guide is not an encyclopedia.** Test cards and pathway leaves
are compact and structured (Purpose / Setup / How to / What to watch /
Record / Quick tip, plus Common Mistakes) — the interaction is
*question/symptom → relevant tests → quick answer* within seconds, not
*category → chapter → article → read*. One generic pathway renderer
(`GuidePathway.tsx`) handles every pathway node from data, branch or leaf
— no per-topic screens.

**Android-first navigation**: bottom nav with Home plus one tab per
`showInNav` module — currently Home, Calculate, Clinical Guide (three
destinations; was four when Assistant and Reference were separate).
Settings goes in the top-app-bar overflow menu, not a nav slot — it's
rarely touched and shouldn't clutter primary navigation.

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

**Clinical Guide** — guided pathway navigation and canonical test cards in
one module (see Information architecture above). MVP pathway content:
Binocular Status, Symptom-Driven Testing, Diplopia, Strabismus by Type —
Diplopia is seeded first (monocular vs. binocular → vertical vs.
horizontal → relevant tests: Cover Test, Maddox Rod, Double Maddox Rod,
Hess/Lancaster, Parks 3-Step). The other three areas show as "coming
soon" on the Clinical Guide hub until their content is written. Explicitly
**not** diagnostic — a memory aid for trained professionals, structured
around ray-diagram-style reasoning where relevant (crossed vs. uncrossed
diplopia, base IN vs. base OUT) rather than long prose.

## Beyond the MVP

Deliberately excluded from MVP, to validate after there's a real, in-use
core:

- **Contact lens catalogue/troubleshooting** — build first among these:
  it's the named "Pro unlock" candidate, so it tests the monetization
  model once the free core has built trust; also the highest-effort of the
  three, so it benefits most from the domain/modules separation already
  proven out by then.
- **Lens material/coating comparison** and **expanded binocular vision
  reference** — lower-effort Clinical Guide extensions, sequenced by
  whichever the real user asks for first.
- **Additional calculators** (back vertex power conversions, minimum blank
  size, decentration/induced prism) — add only once real use of the MVP
  five surfaces a genuine gap, not speculatively.

Anything that breaks the core constraints in [../README.md](../README.md)
(accounts, cloud sync, AI features, ads) is out of scope permanently, not
deferred.
