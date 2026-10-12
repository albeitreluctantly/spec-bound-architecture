# Method — How it works

**Purpose:** describe the framework as a model — its subjects, its vocabulary, and the `request → spec → plan → tasks` pipeline. This is the model, not the field procedure; the step-by-step lives in the [Planning guide](./planning-guide.md).

## The pipeline

Every change flows through one pipeline:

```
conventions ─ always loaded, governs every stage
request ─▶ spec ─▶ plan ─▶ tasks ─▶ code
           (spec only when the request carries business intent)
```

The durable, synchronized pair is **spec + code**; everything else is input or projection.

| Stage           | Nature                                                     | Kept?                                           |
| --------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| **request**     | free-form human input                                      | ❌ ephemeral                                    |
| **spec**        | declarative desired-state, source of truth                 | ✅ durable                                      |
| **plan**        | structure derived from the spec                            | ✅ durable                                      |
| **tasks**       | `tasks.md` increments derived from the plan                | ✅ while in flight (a projection, not a source) |
| **conventions** | cross-cutting invariants + this project's concrete choices | ✅ durable, always loaded                       |

- **`spec` is conditional.** It is produced only when the request carries business intent. A pure substrate or restyle request skips it: `request → plan → tasks`.
- **Specs are declarative.** A spec describes the end state. The delta between current code and the spec is computed when the change lands — never authored, never stored. Change history lives in git, not in specs.
- **`conventions` is the global.** Always loaded by agents; it is this project's instantiation of the framework plus its invariants.

## Subjects and homes

The framework couples each spec to a code location. Every unit of work has a **subject**, and the subject selects the home:

| Subject         | What it is                                                                                              | Code home                                |
| --------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **feature**     | a holistic piece of user-facing functionality — a leaf is one user story, a parent composes subfeatures | `features/`                              |
| **substrate**   | the ambient background features live in — design system + shared infrastructure                         | `library/` · `core/` · feature `shared/` |
| **app-concern** | app-wide wiring and composition (navigation, bootstrap, composition root)                               | `app/`                                   |

Three questions classify a unit of work:

1. A customer-observable capability — something a user sees or does? → **feature**.
2. A reusable thing features consume — a UI primitive or shared infrastructure? → **substrate**.
3. App-wide wiring or concern — navigation, bootstrap, feature composition, core analytics? → **app-concern**.

Substrate is the ambient background; the app composes features into the product. Features are holistic and never reach into each other — a collision between two features surfaces as a typed contract at the junction.

## Routing a request

A request is free-form human input; it rarely maps to a single home. It is resolved by **decompose → route → reject** before any spec, plan, or code. This is the pipeline's entry — it decides whether a request becomes a spec, a plan, or direct work, and so sits above the planning that follows.

**Decompose** the request into intent fragments — the smallest pieces that each land in one place.

**Route** each fragment by its subject (the classifier above) to one tier, and one only:

- **business intent** — it changes customer-observable behavior or a contract → the **spec** that owns it, created or **updated**. A fragment that disagrees with an existing spec updates it; the spec is desired-state, not a verdict to defend.
- **no business intent** but a non-trivial contract — substrate, infrastructure, a multi-state restyle → a **plan**, no spec.
- **trivial** → implemented **directly**, no spec and no plan.

A fragment takes one tier, not several: a business-intent fragment is authored as a spec, and its plan is derived downstream from the gated spec — never produced beside it.

A fragment is **trivial** — skipping both spec and plan — when it changes no customer-observable behavior or contract **and** touches no existing spec. A bug fix, refactor, a dependency bump, a restyle within existing design tokens, or a fix that brings code back to what its spec already describes qualify; the moment a fragment changes what a user sees or what a consumer depends on, it earns a spec.

**Reject** a fragment that cannot be confidently routed within these rules — no clear subject, no resolvable owner, no tier it fits — raising the question that blocks it; infeasible work fails the same way, routing nowhere. **Split** a fragment that crosses ownership so each part lands with its rightful owner — a fragment cannot smuggle a change into a spec that does not own it (feature copy inside a substrate request still routes to the owning feature).

What follows a routed fragment — gating a spec, building its plan, breaking it into tasks — is the [Planning guide](./planning-guide.md).

## Spec and code stay consistent

The allowed code patterns form a **closed set** — the feature reference forms, catalogued in the [Implementation guide](./implementation-guide.md). A user story becomes a feature. A story that fits no allowed pattern is **rewritten until it does**, so the specification and the code never drift apart. The rewrite check is applied in the [Specification guide](./specification-guide.md) and [Planning guide](./planning-guide.md).

## Features are recursive

A feature is the same shape at every scale:

- **flat by default** — a leaf feature is one user story, with no sub-feature folders.
- **splits on demand** — on growth, a feature divides into subfeatures plus a `shared/` kernel.
- **self-similar** — `app` = features + substrate; a feature = subfeatures + substrate in `shared/`. The same composition repeats at every depth.

The spec tree lives at repo-root `.specs/`, mirroring feature **areas**: a leaf feature ↔ `.specs/<area>/<feature>.md` (flat — a file per feature); an area ↔ an area-level overview beside its features. The spec tree carries business artifacts only — `src/` holds implementation, and the plan sits one altitude down, derived from the specs rather than living among them. The spec↔code correspondence is by mirroring name, not physical co-location.

The agents that execute this pipeline — one per transition — are described in the [Agentic workflow](./agentic-workflow.md).
