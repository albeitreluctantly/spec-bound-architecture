# Spec-bound Architecture

A frontend architecture built around capabilities, explicit ownership, and public contracts. Features keep related behavior together; shared code supplies common concepts and infrastructure; parents and the application connect the parts.

> [!NOTE]
> Work in progress. The manifesto, overview, and setup guide are complete. The agent kit's architecture rules are complete and its skill is a draft under review; the remaining documents are outlines.

## 1. Overview

| Document                                                   | Subject                                                                                | Status   |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------- |
| 1. [Manifesto](./docs/01-overview/manifesto.md)            | Architectural principles: ownership, contracts, dependencies, and composition          | Complete |
| 2. [Architecture overview](./docs/01-overview/overview.md) | A catalog example: feature dependencies, public exports, and parent/application wiring | Complete |

## 2. Setup

| Document                                      | Subject                                                                                                                                                                                                                                                                                                                                                                         | Status             |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| [Setup guide](./docs/02-setup/setup-guide.md) | Layout, conventions, ESLint, and agent kit installation                                                                                                                                                                                                                                                                                                                         | Complete           |
| [Agent kit](./docs/02-setup/agent-kit/)       | Files copied into a codebase for its agents: [architecture rules](./docs/02-setup/agent-kit/architecture-rules.md), [conventions template](./docs/02-setup/agent-kit/conventions-template.md), [ESLint configuration](./docs/02-setup/agent-kit/eslint.config.js), and the [`spec-bound-architecture` skill](./docs/02-setup/agent-kit/skills/spec-bound-architecture/SKILL.md) | Skill under review |

## 3. Engineering

| Document                                                              | Subject                                                                   | Status               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------- |
| [Architecture guide](./docs/03-engineering/architecture-guide.md)     | Structural rules, placement, import boundaries, and public interfaces     | Outline; targets 0.5 |
| [Implementation guide](./docs/03-engineering/implementation-guide.md) | Feature design, interfaces, state, integration patterns, and verification | Outline; targets 0.5 |

## 4. Specifications

| Document                                                               | Subject                                                                                        | Status               |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------- |
| [Specification guide](./docs/04-specifications/specification-guide.md) | Bounded behavior, shared requirements, contract tables, feature relations, and boundary review | Outline; follows 0.5 |

## 5. Workflows

| Document                                            | Subject                                                                                                                                      | Status               |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| [Workflows](./docs/05-workflows/workflows.md)       | Main spec-driven approach and specification homes, human-only execution, no-maintained-spec option, gradual adoption, and agent coordination | Outline; follows 0.5 |
| [Agent roster](./docs/05-workflows/agent-roster.md) | Responsibilities and handoffs                                                                                                                | Outline; follows 0.5 |

## Prior art

Spec-bound Architecture builds on ideas from these approaches and tools, among many others in the wider body of work on modular and feature-based design.

- [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/)
- [Vertical slice architecture in Node.js and TypeScript: one folder per use case](https://thetshaped.dev/p/vertical-slice-architecture-in-nodejs-typescript-one-folder-per-use-case)
- [Screaming architecture and colocation in Node.js, TypeScript, and React](https://thetshaped.dev/p/screaming-architecture-and-colocation-nodejs-typescript-react)
- [The Hive: a scaling and supple architecture style](https://www.youtube.com/watch?v=JZBsy6PsCRY)
- [The Vertical Codebase](https://tkdodo.eu/blog/the-vertical-codebase)
- [Feature Garden](https://github.com/Vladyslav-Murashchenko/feature-garden)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [feature-u](https://feature-u.js.org/2.0.0/)
- [improve-codebase-architecture skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md)

> [!NOTE]
> **About the name**
>
> “Spec-bound Architecture” is chosen to avoid the widely used “spec-driven” term and potential colision with similarly named projects. This framework was developed independently, inspired by other publicly available and usually commonly known modular/feature-based architecture guidelines, and is not affiliated with or endorsed by other projects or products using “Spec-bound,” “SpecBound,” "Spec-driven" or "SpecDriven" or similar names.

> [!CAUTION]
> **Disclaimer**
>
> This documentation and the agent kit were written with the assistance of AI and have not been verified line by line. The workflows have not been tested end to end, so they may contain errors or contradictions, and agents following them may perform worse than expected. The material is provided as is, in good faith, without warranty of any kind; the author accepts no responsibility for outcomes of its use.
>
> All examples are AI-generated, some may derive from high-level, anonymized and limited descriptions of certain bounded scenarios from author's experience. The author steered them toward generic, fictional settings in good faith; they reproduce no real project, and any resemblance to one is coincidental.
