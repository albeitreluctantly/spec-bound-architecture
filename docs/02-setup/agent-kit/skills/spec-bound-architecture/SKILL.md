---
name: spec-bound-architecture
description: Spec-bound Architecture procedures and examples. Use before setting up the architecture, creating or changing a feature, connecting features, placing or moving shared code, adding measurement, or reviewing code for conformance.
metadata:
  version: "0.5-draft"
---

# Spec-bound Architecture

> [!WARNING]
> Draft for version 0.5, under review.

The architecture rules in the project instructions state what must hold. This skill holds the procedures for applying them and sample implementations. Architecture overrides in the project conventions take precedence over defaults described here.

## Start of every task

1. Read the project conventions: workflow and specification home, stack, coding practices, and architecture overrides.
2. Identify the feature the request concerns, its specification, and its code home, and follow the project's workflow; see [specifications](references/specifications.md#workflow-and-home).
3. Open the reference for the task. For a pattern, follow its existing implementation in the codebase when one conforms to the architecture rules; open the kit's example when none does or the existing one leaves out what the task needs.

## Task routing

| Task | Read |
| --- | --- |
| Set up the architecture in a new codebase | [new-codebase](references/new-codebase.md) |
| Implement a feature from its specification | [new-feature](references/new-feature.md), [feature-shapes](references/feature-shapes.md), [public-surface](references/public-surface.md) |
| Change, fix, refactor, or remove a feature | [change-feature](references/change-feature.md) |
| Connect a feature to another capability | [integration-patterns](references/integration-patterns.md) |
| Place, share, promote, or move code | [placement](references/placement.md) |
| Add or change measurement | [analytics](references/analytics.md) |
| Use session state, services, or infrastructure across features | [cross-cutting](references/cross-cutting.md) |
| Read a specification or raise a boundary question | [specifications](references/specifications.md) |
| Review code for conformance | [review](references/review.md) |

Converting an existing codebase to this architecture is outside these procedures; ask how to proceed.

## Examples

TypeScript and React illustrate the mechanisms. Apply them through the host project's stack and conventions; helpers marked illustrative stand for the project's own.

| Group | Example | Shows |
| --- | --- | --- |
| Feature types | [Screen feature](examples/screen-feature.md) | One specification mapped to code: isolation, intents, public entry, route mounting |
| | [Widget feature](examples/widget-feature.md) | Fragments for several anchors sharing ephemeral state |
| | [Headless feature](examples/headless-feature.md) | A capability without UI that emits intents |
| Integration patterns | [Delegation](examples/delegation.md) | Navigation, an overlay handle, a sign-in gate with continuation |
| | [Extension](examples/extension.md) | Typed host anchors, shallow and deep slots, composition wiring |
| | [Substrate consumer](examples/substrate-consumer.md) | Configuring a shared UI shell |
| | [Core coordination](examples/core-coordination.md) | Shared state read and written by unrelated features |
| | [Shared kernel](examples/shared-kernel.md) | Subfeatures sharing domain code; promotion to `core/` |
| | [Modification seams](examples/modification-seams.md) | Strategy, service binding, separately exposed logic and view |
| | [Composition-root distribution](examples/composition-root-distribution.md) | Passing one feature's data into another on the same screen |
| | [Mutual reference resolution](examples/mutual-reference-resolution.md) | Two-way coupling resolved by a specified combined experience |
| Recipes | [Local analytics](examples/analytics-local.md) | Area measurement with one provider |
| | [Application-wide analytics](examples/analytics-app-wide.md) | Application events with two providers and enrichment |
| Infrastructure | [Infrastructure](examples/infrastructure.md) | Localization, error messages, and logging imported directly |
