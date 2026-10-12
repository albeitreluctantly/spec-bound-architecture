# Change, fix, refactor, or remove a feature

## Find the owner

Identify the feature that owns the behavior from the request's intent, and its specification. The owning feature's folder is where the change belongs. A request touching several owners splits into one change per owner, each following the project's [workflow](specifications.md#workflow-and-home).

## Kinds of change

| Change | Rule |
| --- | --- |
| Behavior change | Intent-first: update the owning specification, or report the external update, then the code. Spec-first: the specification must already describe it; ask otherwise. Code-as-spec: the request defines the new behavior. |
| Fix | Restore the specified behavior. When the specification is silent or wrong, intent-first corrects it from the request and spec-first asks. In code-as-spec, the request defines the correct behavior. |
| Refactor | Keep the public entry and observable behavior unchanged. Moving code between homes follows [placement](placement.md). |
| Supporting change in another feature | Permitted while that feature's logic and observable behavior stay unchanged: emitting measurement events, exposing a seam, extracting shared code. Ask before anything else. |
| Removal | Delete the feature folder, its parent's re-exports, and its wiring in `app/`. Remove shared code only it used. Remove or retire the specification according to the workflow. |

## Public surface changes

A change to a feature's API or SPI changes its contract with `app/` and any parent. Update every consumer in the same change. Typecheck and lint surface the mismatches at the junctions; resolve them there, not by widening access.

## When the change does not fit

- A requested behavior that belongs to another feature's specification is that feature's change.
- A change that needs one feature to import another needs a junction instead; see [integration-patterns](integration-patterns.md).
- A change that would make a feature serve two unrelated purposes is a boundary question; see [specifications](specifications.md).
