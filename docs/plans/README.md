# Planning & Engineering Docs

This folder is the **planning + decision system** for SmartHand Math. It holds
the master roadmap, the high-level design, requirements, and a lightweight
archive of decisions (ADRs) and proposals (RFCs). These documents are the medium
we use for technical discussion — **before** writing code, write (or update) a
doc here.

> Start at [`ROADMAP.md`](./ROADMAP.md) for the phased plan and current status.

---

## Folder Layout

```text
docs/plans/
├── ROADMAP.md              # Master phased roadmap + current status (the index)
├── README.md               # This file — conventions & templates
├── hld.md                  # High-Level Design (Phase 1)
├── frd.md                  # Functional Requirements Document (Phase 1)
├── wbs.md                  # Work Breakdown Structure (Phase 1)
├── adr/                    # Architecture Decision Records
│   └── ADR-0000-template.md
├── rfc/                    # Requests for Comments (proposals for discussion)
│   └── RFC-0000-template.md
└── {feature_name}/         # Per-feature working folder
    ├── README.md           # Feature overview, status, links to its ADR/RFC
    └── PoC/                # Proofs-of-concept — try risky ideas here FIRST
```

---

## Document Types

| Type | What it is | Write one when… |
|------|------------|-----------------|
| **ROADMAP** | Phased, dependency-ordered plan with exit criteria | Always — it's the index for everything else |
| **HLD** (High-Level Design) | System architecture, data flow, component map, constraints | Defining or significantly changing the architecture |
| **FRD** (Functional Requirements) | Personas, user stories, FR/NFR, a11y & privacy requirements | Defining *what* the product must do (not how) |
| **WBS** (Work Breakdown Structure) | Decomposition of a phase into trackable tasks | A phase is approved and ready to execute |
| **ADR** (Architecture Decision Record) | A single, immutable decision + its context and consequences | An architectural choice is made (or needs recording) |
| **RFC** (Request for Comments) | A proposal seeking feedback before a decision | You have an idea/change that needs team input |
| **PoC** (Proof of Concept) | Throwaway experiment to de-risk an unknown | The right approach is uncertain — *try it here first* |

---

## Status Legend

Same symbols everywhere in this folder and the ROADMAP:

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[-]` | Skipped / deferred |

---

## Workflow

```text
1. RFC          Propose the change in rfc/RFC-00NN-*.md → discuss
2. PoC (if risky/unknown)
                Prototype in {feature}/PoC/ → record what worked
3. ADR          If a decision is architectural, record it in adr/ADR-00NN-*.md
4. Implement    Write the code; reference the RFC/ADR in the PR description
5. Update       Flip the ROADMAP item [ ] → [x] when done
```

> **Rule:** if you want to *try something*, do it as a PoC under
> `docs/plans/{feature_name}/PoC/` **first** — never spike experimental code
> directly into `src/`. PoCs are disposable; conclusions get promoted into an
> ADR/RFC and then into real code.

---

## Naming Conventions

- Files: `kebab-case`.
- ADRs: `ADR-00NN-short-slug.md`, zero-padded, monotonically increasing (`ADR-0001`, `ADR-0002`, …).
- RFCs: `RFC-00NN-short-slug.md`, same scheme.
- Feature folders: `kebab-case` matching the feature, e.g. `hand-tracking/`, `animations/`, `offline/`.

---

## Templates

### ADR template (`adr/ADR-00NN-slug.md`)

```markdown
# ADR-00NN — <short decision title>

- **Status:** Proposed | Accepted | Superseded by ADR-00XX | Deprecated
- **Date:** YYYY-MM-DD

## Context
Why is this decision needed? What forces are at play (constraints, prior decisions)?

## Decision
What we decided. State it unambiguously.

## Consequences
What follows from this — positive, negative, neutral. Trade-offs accepted.

## Alternatives Considered
Other options and why they were rejected.
```

### RFC template (`rfc/RFC-00NN-slug.md`)

```markdown
# RFC-00NN — <short proposal title>

- **Status:** Draft | Under discussion | Accepted | Rejected | Implemented
- **Author:** <name>
- **Date:** YYYY-MM-DD

## Problem
What problem are we solving, and who has it?

## Proposal
What we propose to do.

## Alternatives Considered
Other approaches and their trade-offs.

## Impact
Code, docs, migration, performance, privacy, timeline.

## Decision
Outcome of the discussion (filled in after review). Reference any resulting ADR.
```

### PoC `README.md` template (`{feature}/PoC/README.md`)

```markdown
# PoC — <what is being proven>

## Hypothesis
What we believe will work, and how we'll know.

## What was tried
What we built/ran, and where it lives in this folder.

## Result
Observations, measurements, gotchas.

## Verdict
Proceed / iterate / abandon. Link to the resulting ADR or RFC.
```
