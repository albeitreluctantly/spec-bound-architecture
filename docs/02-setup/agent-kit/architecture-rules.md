<!-- spec-bound-architecture v0.5 -->

# Spec-bound Architecture

Spec-bound Architecture organizes code around specified capabilities: each feature specification corresponds to one feature folder, so the boundaries visible in the specifications are the boundaries in code. Four pillars hold the architecture together:

- **Correspondence.** A capability is specified, implemented, and reviewed in one place, which keeps it easy to find and to change.
- **Isolation.** Features never import each other. They connect through typed contracts wired by the application, so a broken connection fails at the junction instead of drifting silently.
- **Ownership.** A feature's logic changes only because its own specification changes; one feature's needs do not quietly redefine another.
- **Feedback.** When a boundary does not hold in code, the specifications are revised; the rules are not bent to fit.

## Code homes

| Home        | Holds                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------- |
| `app/`      | Application composition: startup, runtime providers, navigation, and wiring between features |
| `core/`     | Application-domain code shared by top-level features: models, rules, state, and services     |
| `library/`  | Domain-independent infrastructure: UI primitives, utilities, and technical services          |
| `features/` | Specified capabilities, one folder per feature specification, subfeatures when defined       |

## Features

- A feature owns a bounded capability and its explicit contracts. It may serve a person or a downstream system, such as analytics.
- Feature folders mirror the specification structure. A parent specification that groups separate subfeature specifications becomes a parent folder with matching subfeature folders.
- A parent's `shared/` holds code its subfeatures actually share. Code used by one subfeature stays inside it; a split alone does not create `shared/`.
- A parent composes its subfeatures inside its own implementation only when the parent's specification defines their combined experience. Otherwise its public entry re-exports their entries for application wiring.

## Placement

Place code in the narrowest home justified by the domain knowledge it carries and the code that actually uses it.

| Code knows             | Used by                    | Home                     |
| ---------------------- | -------------------------- | ------------------------ |
| No product domain      | Anyone                     | `library/`               |
| The application domain | Several top-level features | `core/`                  |
| One feature's domain   | That feature's subfeatures | That feature's `shared/` |
| One feature            | That feature               | Inside the feature       |

Promote a parent's shared code to `core/` when another top-level feature needs it. Application wiring does not count as a consumer. Anticipated reuse does not justify a wider home.

## Dependency rules

- Siblings never import each other: neither top-level features nor subfeatures, not even through public entries.
- A parent may import its subfeatures' public entries. A subfeature may import its parent's `shared/`, never the parent's entry or composition files.
- A feature's `shared/` never imports its subfeatures. Code outside a feature never imports its `shared/`; the parent's entry exposes what others need.
- `core/` imports `library/` and other `core/` modules, never features or `app/`.
- `library/` imports only other `library/` modules.
- Nothing imports `app/`.
- Code outside a module reaches it only through its public entry.
- ESLint enforces these rules. Do not disable or weaken a rule to make an import pass: the error marks coupling the design must resolve, usually through one of the junctions below.

## Public boundary

- Curate each public entry: export what consumers need, and keep the hooks, state, services, components, and helpers behind it private.
- The API is what a feature offers: a page, widget fragments, handlers, or supported slices of logic. The SPI is what its surroundings must supply: intent handlers, required inputs, services, and host capabilities. Both belong to the public boundary.
- To share logic, expose a supported slice rather than the internal hook or store, so the internals stay free to change.
- Export types by name only when a consumer needs them; a component signature already carries its prop and intent types.

## Connecting features

Features connect only through these junctions:

| Relation in a specification                                       | Junction                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Handoff: an action opens or triggers another capability           | A semantic intent the application fulfills                                           |
| Embedding: a feature's widget appears inside a host               | A host extension anchor filled at composition                                        |
| Dependency: a feature reuses a capability                         | Shared code in `core/` or a parent's `shared/`, or data passed at composition        |
| Modification: a feature changes another's behavior in its context | A seam: a supplied strategy, a service binding, or separately exposed logic and view |

A feature requests navigation and other capabilities through intents, such as an `onIntent` callback. It decides when to emit an intent and owns its payload, prerequisites, and continuation. Route paths, navigation hooks, and knowledge of other screens belong to `app/`.

## Changes in other features

A task often touches code owned by other features. Such a change is permitted while that feature's logic and observable behavior stay unchanged: emitting measurement events, exposing a seam another feature needs, or extracting shared code. Ask before a change that would alter another feature's logic or observable behavior.

## Specifications

- Specifications describe desired behavior. Read the owning specification before changing behavior, and keep the code consistent with it.
- Do not invent intent, behavior, or boundaries; a guess becomes behavior nobody specified. Ask when a specification is missing, ambiguous, or contradicts the requested change.
- When a specification does not describe one bounded capability, propose splitting or merging specifications. Ownership changes need the team's agreement.
- When the conventions state that the project works without specifications, the request's intent defines the change and its boundaries. Do not change another feature's observable behavior without clear justification.

## Skill

The `spec-bound-architecture` skill holds the procedures and sample implementations for these rules. Load it before setting up the architecture, creating a feature, connecting features, placing or moving shared code, adding measurement, or reviewing code for conformance.

## Project conventions

Read the project conventions before changing code. They name the specification home, or state that the project works without specifications, and record the stack, coding practices, and architecture overrides. An override replaces the default it names in these rules.
