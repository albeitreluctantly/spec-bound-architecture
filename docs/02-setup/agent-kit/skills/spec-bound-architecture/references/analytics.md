# Analytics

Analytics owns what is measured, when an event counts, and what reaches each provider. A project climbs this ladder only as far as its measurement needs. The project conventions name the rung; without one, follow the existing codebase, and in a new codebase ask.

## Ladder

| Rung | Use when | Analytics lives in | Event types | Connection | Example |
| --- | --- | --- | --- | --- | --- |
| 1. Service | Measurement has no specifications of its own | One service in `core/` | The service | Features call the service | [Analytics service](../examples/analytics-service.md) |
| 2. Area events | One area's specifications define its measurement | An analytics subfeature of the area | The area's `shared/`, with the area's bus | Product features emit; the subfeature handles | [Local analytics](../examples/analytics-local.md) |
| 3. Application events | Measurement spans areas or providers | Top-level analytics features; rung 2 subfeatures stay where they fit | `core/`, one union with one application bus | Product features emit; each analytics feature handles | [Application-wide analytics](../examples/analytics-app-wide.md) |
| 4. Callbacks | Product features stay unaware of measurement | Analytics features, as in rungs 2 and 3 | Private to the features that produce and handle them | Product features expose outcome callbacks; the parent connects an area's analytics, `app/` connects top-level analytics | [Analytics callbacks](../examples/analytics-callbacks.md) |

## Homes

| Part | Home |
| --- | --- |
| Provider services: SDK setup and data every provider event shares | `core/analytics` |
| The base event type that event types build on | `core/analytics` |
| Generic helpers, such as the event bus or a visibility-tracking hook | `library/` |
| The mapping from events to provider events | The analytics feature, or the rung 1 service |
| Data a handler reads beyond the event | The parent's `shared/` (Shared kernel) or `core/` (Core coordination) |
| Initializing and disposing handlers | `app/` |

## Rules

- Measuring an action is a supporting change that leaves the product feature's behavior unchanged. A measurement specification can add measurement to several product features.
- Provider event names live only where the mapping lives; one event can map to zero, one, or several provider events.
- A handler reads extra data as a slice of shared state through its owner's public entry. Data that only the producing feature holds travels in the event.
- In rung 4, a parent connects its subfeatures' outcome callbacks to its analytics subfeature and exports the connected components, so those callbacks stay inside the area.
