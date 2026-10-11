# Recipes

> Outline. The two analytics recipes target version 0.5.

## Local analytics in an automotive application

Feature-scoped measurement requirements, parent-shared event contracts, emission by product features, local analytics handlers, and registration at application composition. Use a single provider and keep enrichment optional.

## Multiple analytics providers in ecommerce

Measurement specifications and contract tables, shared application events, GA4 and a second provider with different payloads, optional state enrichment, independent delivery, and application wiring.

Each walkthrough follows requirements → code ownership → event or interface contract → call site → handler → composition. See the [Implementation guide](./implementation-guide.md) for individual integration recipes.
