# Change, fix, refactor, or remove a feature

## Find the owner

Identify the feature that owns the behavior from the request's intent, and its specification. The change belongs in that feature's folder and follows the project's [workflow](specifications.md#workflow-and-home). A request touching several owners splits into one change per owner.

## Kinds of change

| Change | Rule |
| --- | --- |
| Fix | Restore the specified behavior. A specification that is silent or wrong follows the workflow. |
| Refactor | Keep the specified behavior unchanged. Moving code between homes follows [placement](placement.md). |
| Removal | Delete the feature folder, its parent's re-exports, and its wiring in `app/`. Remove shared code only it used. Remove or retire the specification according to the workflow. |

## When the change does not fit

- A change that needs one feature to import another needs a junction instead; see [integration-patterns](integration-patterns.md).
- A change that would make a feature serve two unrelated purposes is a boundary question; see [specifications](specifications.md).
