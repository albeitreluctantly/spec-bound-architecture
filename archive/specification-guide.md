# Specification Guide

**Purpose:** recommendations for writing a spec that is implementable within this framework — a feature with clear boundaries and explicit relations, one that can be built and tested in isolation. The subject that earns a spec and where its code lives is the [Method](./method.md) model; the routing that produces one is in the [Planning guide](./planning-guide.md).

A spec is a **pure business artifact**. It lives in the spec tree at `.specs/<area>/<feature>.md`, describes one feature in customer-facing terms, and references only what sits at its own altitude — sibling features and shared business documents beside it. It never reaches down into a plan or implementation: that altitude is derived from the spec, not named by it.

## Feature boundaries

A spec describes one **feature**: a contained, holistic piece of functionality with a clear edge. The working test is isolation — a well-bounded feature can be built and verified on its own.

The common pitfall is a story that spreads across several user flows or screens with no clear edge. It cannot be implemented or tested as a unit, and its logic tangles with the features beside it. When a story reads that way, find the seam and split it (see [Split and merge](#split-and-merge)).

Finding the boundary is mostly deciding what the feature **owns** versus what it merely **touches**. What it owns — its screens, its rules, its state — is the spec. What it touches — another feature it opens, embeds, reuses, or alters — is a **relation**: named, not re-described.

## Referencing other features

A spec references another feature in a way the user can observe — name the other feature and how it relates, rather than restating its behavior. The relation vocabulary is four forms, ordered loosest → tightest by how much the referenced feature must open up:

| #   | Reference        | Phrasing                                                 |
| --- | ---------------- | -------------------------------------------------------- |
| 1   | **Handoff**      | "{action} in A opens or triggers B" (may return a value) |
| 2   | **Embedding**    | "A's {widget} appears inside B at {place}"               |
| 3   | **Dependency**   | "B uses A's {capability}"                                |
| 4   | **Modification** | "when A is {state}, B behaves differently"               |

**Embedding vs Dependency** — Embedding places another feature's _live widget_ inside yours; it keeps its own behavior. Dependency _reuses a capability_; the source feature is not present.

**Modification** keeps the ownership invariant: B declares its open point once in its own spec, and any number of features plug in. B's logic does not change per modifier.

These four forms cover the relations a spec needs. A connection that fits none of them is usually a sign the boundary is off — revisit [Split and merge](#split-and-merge) — or a coupling that resolves at the plan altitude: mutual sync, shared data or state, multi-feature orchestration. The technical wiring of each form lives in the [Implementation guide](./implementation-guide.md).

A relation lives in the acceptance criteria as an observable outcome — _WHEN the user taps X screen B opens_ — so it can be read straight from the story. Write the connections the story implies; a separate, typed relations list is not required. What matters is that every connection is derivable from the wording and fits one of the four forms.

## Formats and templates

A spec takes one of several formats, selected by subject. Two are in use; more may be added as they are discovered.

### User story

A feature's behavior as a user goal plus acceptance criteria. Acceptance criteria use four EARS-lite keyword forms — each one a single, testable statement, no "the system shall" ceremony:

- **`WHEN` <event>** — a triggered response. _WHEN the user submits the form, the confirmation screen opens._
- **`WHILE` <state>** — behavior that holds during a state. _WHILE a save is in progress, the Save button is disabled._
- **`IF` <unwanted condition> `THEN`** — handling of an unwanted case. _IF the request fails, THEN an error message replaces the list._
- **bare assertion** — a ubiquitous static or visual fact. _The screen title reads "Settings"._

```
Title: <Feature short name> — <user capability>

User goal:
  AS A <role>
  I WANT TO <do something>
  SO THAT <I achieve outcome>

Pre-conditions (optional):
  - <required app state, e.g. "User is authenticated", "App is online">

Design references:
  - <links to visual / UX design>

Acceptance criteria:
  1. <EARS-lite criterion>
  2. <EARS-lite criterion> <reference to another feature>
  3. <EARS-lite criterion> <navigation target>

Non-functional criteria (optional):
  - <EARS-lite performance / accessibility / resilience criterion>

Unhappy paths (optional):
  - <empty / error / denied / offline behavior that differs from app defaults>

Out of scope (optional):
  - <capabilities outside this story: platform functionality, backend logic>

Notes (optional):
  - <design rationale, edge cases not in acceptance criteria>
```

Non-functional criteria use the same EARS-lite keywords for a single feature's qualities — _WHILE scrolling a list of 500 items, the frame rate stays above 55 fps._ Cross-cutting non-functional rules belong to conventions, not a story.

### Contract table

Instrumentation and external data contracts take a table — they fail the customer-observable test and do not fit EARS form.

```
Title: <Concern> — e.g. Map analytics, Catalog data contract

| event / field | trigger (feature · action) | payload schema | notes / api |
| ------------- | -------------------------- | -------------- | ----------- |
```

The event or field contract is owned by the concern; the trigger point is owned by the feature that fires it.

## Split and merge

**Split** a story when:

- it owns several complete screens or flows with different purposes, or
- part of it is a holistic capability that other features use, or could use.

**Merge or downgrade** a story when it owns no user-facing logic of its own. When two features look separate but tightly bound, read the relation between them — the tighter it is, the more likely they are one:

- **Handoff** — one opens or triggers the other. Almost always two features.
- **Embedding** — one shows the other's widget. Usually two; check whether the host could own that widget as an integral part of itself.
- **Dependency** — one reuses the other's capability. A single dependency stays two; many deep ones suggest one feature.
- **Modification** — one changes the other's behavior. The strongest sign to consider a merge. They remain two only when a real seam separates them — the modified feature stands as a closed unit on its own, or the modifier is layered on through a toggle. Without that seam, merge.

## Well-formed spec checklist

A spec is in good shape when:

- **Contained** — it describes one feature with a clear edge, buildable and testable on its own.
- **Relations explicit** — every connection to another feature is named as a reference, not a re-description, and is derivable from the wording as one of the four forms.
- **Observable** — every criterion describes what the user sees or does, and can be checked by using the feature.
- **Complete** — all the required behavior is captured: the main flow, alternate outcomes, UI/UX constraints, and business invariants — nothing left implied.
- **Consistent** — no contradictions or ambiguity. In particular, the spec does not restate what a design reference already shows — duplicated detail lets spec and design drift. Reference the design; don't copy it.
- **Enough to build** — behavior, relations, and constraints together let a planner derive the work without guessing.
