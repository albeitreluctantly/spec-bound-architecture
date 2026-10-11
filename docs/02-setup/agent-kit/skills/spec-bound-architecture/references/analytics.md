# Analytics

Analytics is a feature. It owns measurement behavior: what is measured, when an event counts, what data reaches each provider, and delivery requirements. Its consumer is a downstream system, so it is usually headless.

## Ownership

| Part | Owner | Home |
| --- | --- | --- |
| Measurement requirements and provider mapping | The analytics feature | `features/<area>/analytics/` or a top-level analytics feature |
| Event contracts shared by producers and handlers | Shared code at the narrowest common scope | The parent's `shared/` for one area; `core/` for application-wide events |
| Emitting an event at the action | The product feature that owns the action | Inside that feature, as a supporting change |
| Generic event bus, queue, provider transports | Infrastructure | `library/` |
| Handler registration and its lifetime | Application composition | `app/` |

A measurement specification can require emission in several product features. Each product feature still owns its action and its success condition; adding emission is a supporting change that must leave its behavior unchanged.

## Scope

- **Area-local:** one area's specifications define the measurement. Contracts live in the parent's `shared/`; the analytics subfeature exposes a start function through the parent's entry; `app/` starts it. See [Local analytics](../examples/analytics-local.md).
- **Application-wide:** measurement spans areas or providers. Contracts live in `core/`; each provider or measurement responsibility can be its own top-level feature; `app/` starts each one. See [Application-wide analytics](../examples/analytics-app-wide.md).

Both scopes may coexist. Publishing to a shared bus and registering handlers is application composition, not a separate integration pattern: producers and handlers share contracts through a Shared kernel or `core/`, and handlers read state through Core coordination.

## Events

- Name application events after product actions in the past tense (`vehicleSaved`, `purchaseCompleted`), not after provider vocabulary.
- Emit at the moment the specification defines. An attempted action is not a completed one: emit `purchaseCompleted` after the order is confirmed, not when the button is pressed or the confirmation page opens.
- One application event can produce zero, one, or several provider events.
- A generic interaction event (`buttonClicked`) is a separate vocabulary. Type its context and names as a union; never treat it as a completed action.

## Enrichment

Enrichment is optional. A handler may read shared state through a public entry when it needs more data than the event carries.

- Read current state only when the measurement means current state.
- When the event must describe state at the moment of the action, put a snapshot in the event. A handler running later cannot reconstruct a cart that has since been cleared.

## Delivery

- Measurement is best effort unless the specification says otherwise: a provider failure never fails the product action.
- Each handler runs independently; one provider's failure does not block another.
- Whether publishing waits for delivery, queues, retries, respects consent, or drains at shutdown is a runtime decision to specify, not a default to assume.
- `app/` owns handler lifetime: start at application startup, stop at teardown, unless the specification defines a narrower lifetime.
