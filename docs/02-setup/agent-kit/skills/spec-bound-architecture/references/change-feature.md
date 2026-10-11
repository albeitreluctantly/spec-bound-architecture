# Change, fix, refactor, or remove a feature

## Find the owner

Identify the specification that owns the behavior. The owning feature's folder is where the change belongs. A request touching several owners splits into one change per owner; each follows its own specification. Without specifications, the request's intent identifies the owner and the scope of the change.

## Kinds of change

| Change | Rule |
| --- | --- |
| Behavior change | The owning specification must describe the new behavior. Ask when it is missing, unclear, or disagrees with the request; do not change behavior on the strength of the request alone. Without specifications, the request's intent defines the new behavior. |
| Fix | Restore the behavior the specification describes. If the specification is silent or wrong, ask. Without specifications, the request's intent defines the correct behavior. |
| Refactor | Keep the public entry and observable behavior unchanged. Moving code between homes follows [placement](placement.md). |
| Supporting change in another feature | Permitted while that feature's logic and observable behavior stay unchanged: emitting measurement events, exposing a seam, extracting shared code. Ask before anything else. |
| Removal | Delete the feature folder, its parent's re-exports, and its wiring in `app/`. Remove shared code only it used. Confirm the specification, when one exists, is removed or marked as such. |

## Public surface changes

A change to a feature's API or SPI changes its contract with `app/` and any parent. Update every consumer in the same change. Typecheck and lint surface the mismatches at the junctions; resolve them there, not by widening access.

## When the change does not fit

- A requested behavior that belongs to another feature's specification is that feature's change.
- A change that needs one feature to import another needs a junction instead; see [integration-patterns](integration-patterns.md).
- A change that would make a feature serve two unrelated purposes is a boundary question; see [specifications](specifications.md).
