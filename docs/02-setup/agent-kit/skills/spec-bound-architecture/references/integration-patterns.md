# Integration patterns

A specification names other capabilities through four relations. Each relation is implemented by one or more integration patterns. Every junction is wired by `app/` or by a parent whose specification defines a combined experience, or reached through shared code. No feature imports another.

| Relation | Typical wording | Patterns |
| --- | --- | --- |
| Handoff | "Action X in A opens B" | Delegation |
| Embedding | "A's widget appears inside B at a place" | Extension |
| Dependency | "A uses a capability also used elsewhere" | Substrate consumer, Core coordination, Shared kernel |
| Modification | "In A's context, B behaves differently" | Modification seams |

Composition-root distribution and Mutual reference resolution cover connections the four relations do not name directly.

## Choosing a pattern

| The connection | Pattern |
| --- | --- |
| Open, present, or invoke another capability, possibly resuming afterward | Delegation |
| Render a live part of another feature inside a host's layout | Extension |
| Reuse a list, map, header, or other UI shell | Substrate consumer, with Extension for its slots |
| Share state or a server projection across features | Core coordination |
| Share domain types, rules, or capabilities among subfeatures | Shared kernel |
| Vary another feature's behavior in a context | Modification seams |
| Pass one feature's screen-specific data into another feature | Composition-root distribution |
| Two parts depend on each other | Mutual reference resolution |

## Delegation

The feature emits a semantic intent; `app/` fulfills it by navigating, presenting another feature, or invoking a capability. The target may return a result the feature continues with. A prerequisite such as sign-in is an intent with a continuation. See [Delegation](../examples/delegation.md).

## Extension

The host declares typed, semantically named anchors and the context each receives. Contributors supply render functions; `app/` maps contributors to anchors and places any contributor provider around the host.

- The host renders foreign UI only through render functions it receives.
- Name anchors by their place in the host (`cardActions`, `footer`), not generically (`content`).
- An anchor deep in the host's tree uses a slot from an extension helper instead of threading props.
- Contributions on one host do not coordinate with each other; shared behavior between them is Core coordination.

See [Extension](../examples/extension.md).

## Substrate consumer

A feature configures a reusable UI shell through its props and slots. The shell lives in `library/` when domain-independent, otherwise in `core/` or a parent's `shared/`. A feature never renders another feature's UI directly: a reusable shell becomes shared code; a peer's live widget arrives through Extension. See [Substrate consumer](../examples/substrate-consumer.md).

## Core coordination

Features read and write the same state through a shared module's public entry, addressed by a stable identity such as a cart ID or a query key. Neither consumer knows the other. Keep state inside a feature while it is screen-ephemeral; move it to shared code when a second feature needs it beyond one screen. See [Core coordination](../examples/core-coordination.md).

## Shared kernel

Subfeatures share domain types, rules, data access, or capabilities through their parent's `shared/`. Promote the code to `core/` when another top-level feature needs it. See [Shared kernel](../examples/shared-kernel.md).

## Modification seams

A seam lets an integrating feature or `app/` vary a feature's behavior without editing its logic:

| Seam | Varies |
| --- | --- |
| Strategy | One decision, supplied as a function: a filter, a comparator, a predicate, a handler |
| Service binding | An implementation the feature depends on, bound by `app/` |
| Separate logic and view | Data or presentation as a whole: the consumer uses the supported logic slice and renders the exposed view with changed data |

- Choose the narrowest seam that meets the need.
- Seams come from integration needs. When B's specification needs "A, but with change Z", add the seam Z needs to A's code. A's specification does not change, provided A's logic and observable behavior stay the same. Ask when they would change.
- The varied behavior belongs to the integrating feature's requirements; the seam becomes part of A's public contract and must stay stable.
- Monkey-patching, swapping internals at runtime, and deep imports are never seams.
- When one feature modifies another heavily or increasingly, raise whether their specifications describe one capability.

See [Modification seams](../examples/modification-seams.md).

## Composition-root distribution

`app/` reads a supported slice from one feature and passes it into another feature's declared inputs on the same screen. Use it for screen-specific data that is not a shared domain concept; prefer Core coordination when other features may need the data. See [Composition-root distribution](../examples/composition-root-distribution.md).

## Mutual reference resolution

When two parts depend on each other, such as a map and a list kept in sync, resolve the coupling with the fusion ladder. Sibling imports are never the answer. See [Mutual reference resolution](../examples/mutual-reference-resolution.md).

## Fusion ladder

Resolve coupling at the narrowest scope the specifications and actual reuse justify:

1. **One feature.** The parts form one capability with one specification: keep them in one feature.
2. **Parent composition.** The parent's specification defines the combined experience of separately specified subfeatures: the parent composes them and shares their common state through its `shared/`.
3. **Shared foundation.** The coupled concept is needed by several top-level features: move it to `core/`; the features depend on it.

Coupling strength alone never redraws feature boundaries. When the coupling contradicts the specifications, raise a boundary question.

## Bridging hosts

When a feature wraps a shared shell that has its own anchors, map the shell's anchor names and context to the feature's own at the wrapper.

```tsx
<ProductGrid
  extensions={{
    cardFooter: ({ productId }) => extensions?.productActions?.({ productId, listId }),
  }}
/>
```
