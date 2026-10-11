# Spec-bound Architecture

A frontend architecture built around capabilities, explicit ownership, and public contracts. Features keep related behavior together; shared code supplies common concepts and infrastructure; parents and the application connect the parts.

## 1. Overview

| Read in order                                              | Subject                                                                                |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1. [Manifesto](./docs/01-overview/manifesto.md)            | Architectural principles: ownership, contracts, dependencies, and composition          |
| 2. [Architecture overview](./docs/01-overview/overview.md) | A catalog example: feature dependencies, public exports, and parent/application wiring |

## 2. Setup

- [Setup guide](./docs/02-setup/setup-guide.md) — outline for version 0.5: layout, conventions, ESLint, and optional agent instructions.
- [Architecture definition for agents](./docs/02-setup/architecture-definition.md) — standalone setup artifact; outline, not ready to install.

## 3. Engineering

| Document                                                              | Subject                                                                  | Status               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------- |
| [Architecture guide](./docs/03-engineering/architecture-guide.md)     | Structural rules, placement, import boundaries, and public interfaces    | Outline; targets 0.5 |
| [Implementation guide](./docs/03-engineering/implementation-guide.md) | Feature design, interfaces, state, integration recipes, and verification | Outline; targets 0.5 |
| [Recipes](./docs/03-engineering/recipes.md)                           | End-to-end local and application-wide analytics                          | Outline; targets 0.5 |

## 4. Specifications

- [Specification guide](./docs/04-specifications/specification-guide.md) — bounded behavior, shared requirements, contract tables, feature relations, and boundary review. Outline; follows 0.5.

## 5. Workflows

- [Workflows](./docs/05-workflows/workflows.md) — main spec-driven approach and specification homes, human-only execution, no-maintained-spec option, gradual adoption, and agent coordination. Outline; follows 0.5.
- [Agent roster](./docs/05-workflows/agent-roster.md) — responsibilities and handoffs. Outline; follows 0.5.

> [!NOTE]
> **About the name**
>
> “Spec-bound Architecture” is chosen to avoid the widely used “spec-driven” term and potential colision with similarly named projects. This framework was developed independently and is not affiliated with or endorsed by other projects or products using “Spec-bound,” “SpecBound,” "Spec-driven" or "SpecDriven" or similar names.
