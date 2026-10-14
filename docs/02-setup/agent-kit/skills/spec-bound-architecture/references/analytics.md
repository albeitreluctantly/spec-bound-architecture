# Analytics

Analytics is a feature, usually headless: it owns what is measured, when an event counts, and what reaches each provider. Product features emit events at their actions; analytics handlers turn them into provider events.

## Scope

Choose the scope from the specifications that define the measurement:

- **Area-local:** one area's specifications define it. Contracts live in the parent's `shared/`, and the analytics subfeature exposes a start function through the parent's entry. See [Local analytics](../examples/analytics-local.md).
- **Application-wide:** the measurement spans areas or providers. Contracts live in `core/`, and each provider or measurement responsibility can be its own top-level feature. See [Application-wide analytics](../examples/analytics-app-wide.md).

## Ownership

| Part | Owner | Home |
| --- | --- | --- |
| Measurement requirements and the mapping from application events to provider events | The analytics feature | `features/<area>/analytics/` or a top-level analytics feature |
| Event contracts shared by producers and handlers | Shared code at the narrowest common scope | The parent's `shared/` for one area; `core/` for application-wide events |
| Emitting an event at the action | The product feature that owns the action | Inside that feature |
| Data a handler reads beyond the event | The owner of that state | The parent's `shared/` (Shared kernel) or `core/` (Core coordination) |
| Event bus, queue, provider transports | Infrastructure | `library/` |
| Starting and stopping handlers | Application composition | `app/` |

## Rules

- Emission is a supporting change that leaves the product feature's behavior unchanged. A measurement specification can add emission to several product features.
- Name application events after product actions in the past tense (`vehicleSaved`, `purchaseCompleted`). Provider event names live only in the analytics feature, which maps one application event to zero, one, or several provider events.
- A handler reads extra data as a slice of shared state through its owner's public entry. Data that only the producing feature holds travels in the event.
