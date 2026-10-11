# Manifesto

## Philosophy

Spec-bound architecture is an architectural framework that gives AI-powered development a consistent architectural foundation, turning product specifications into a clear blueprint for implementation.

It aims to make features holistic parts of functionality with clear and natural boundaries that simplify reasoning, implementation, and validation, and to provide a robust set of simple heuristics that define features' shape and combination, give unambiguous justification for feature splitting.

The architecture organizes code around specified capabilities rather than grouping solely by domain affinity. Its primary goal is a one-to-one relationship between feature specifications and feature folders: the boundaries visible in the documentation determine the boundaries in code. Placement follows that structure, without a separate exercise in deciding which module or domain area a feature belongs to.

This creates a positive, “anti-fragile” feedback loop between product and development teams. Specifications guide architectural boundaries; implementation experience helps refine specifications so each describes a bounded, implementable piece of functionality. In an automated software factory, agents can run this loop continuously, refining documentation and implementation together.

## Principles

- **Codebase architecture follows knowledge-base structure.** Feature specifications correspond to feature folders. Specifications describe capabilities as holistic, implementable units; code preserves their boundaries and relationships.

- **Boundaries are explicit.** Features represent bounded capabilities and never use each other directly. A collision between features shows up as a typed contract at the junction point. Drift is loud, not silent — _Protected Variations_ in action.

- **One feature, one authority for change.** Its business logic changes because its own specification changes. Another feature’s needs must not silently redefine its behavior.

- **Anti-fragile feedback loop.** Specifications shape implementation, and implementation informs specifications. Specifications that do not define bounded functionality are reviewed and split or merged as needed, refining both documentation and code boundaries through repeated development cycles.

[Architecture overview](./overview.md)
