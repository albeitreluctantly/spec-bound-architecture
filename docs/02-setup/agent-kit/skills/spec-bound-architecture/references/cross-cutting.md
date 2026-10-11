# Cross-cutting concerns

A concern that reaches many features is a shared mechanism plus participation owned by each feature. The mechanism and its contract live in shared code; each feature decides where and how it participates.

| Concern | Mechanism | Feature participation | Example |
| --- | --- | --- | --- |
| Session and sign-in | Session state and a sign-in intent type in `core/` | Reads session state; emits a sign-in intent with a continuation when its action requires it | [Delegation](../examples/delegation.md) |
| Services | A service interface declared by the feature or a shared module; the implementation bound by `app/` | Depends on the interface, never on the implementation | [Modification seams](../examples/modification-seams.md) |
| Infrastructure | Localization, error messages, logging, UI primitives in `library/` | Imports their public entries directly | [Infrastructure](../examples/infrastructure.md) |
| Shared background state | A `core/` module owning the state and its status | Features change the state through the module; `app/` shows application-level status | [Core coordination](../examples/core-coordination.md) |
| Measurement | Event contracts, bus, and transports | Product features emit events; analytics features handle them | [analytics](analytics.md) |

## Rules

- Shared mechanisms are consumed by direct import of their public entry. Features do not receive infrastructure through intents or props unless the conventions say so.
- A feature never owns the source of truth for shared data. It reads and writes through the owning module's public entry.
- `app/` creates runtime singletons and providers once: clients, service bindings, localization, theme.
- Session-dependent flows keep their decisions inside the feature: the feature knows that its action requires sign-in and what happens afterward; `app/` knows how to present sign-in.
- Logging belongs where the context is: infrastructure logs at data and network boundaries; a feature logs only what it alone knows.
- A mechanism's contract (an event shape, a service interface, a session reader) belongs to the shared module; the participation point belongs to the feature.
