# Implementation guide

> Outline. Target: version 0.5.

## Feature design

Understand the requirements, identify relations, decompose responsibilities, define the public surface, and place the implementation parts.

## Feature shapes

Screen, widget, and headless capabilities; local state and supported reusable slices.

## Public surface and SPI

Offered capabilities, required outside services, semantic intents, continuation, and private implementation boundaries.

## Integration patterns

Specification relations describe required connections; integration patterns describe their implementation.

| Relation | Patterns |
| --- | --- |
| Handoff | Delegation |
| Embedding | Extension |
| Dependency | Substrate consumer, Core coordination, Shared kernel |
| Modification | Modification seams |

Composition-root distribution and Mutual reference resolution address additional wiring and coupling cases.

### Delegation

Semantic requests fulfilled through navigation, presentation, or capability invocation at composition.

### Extension

Specified embedding requirements, typed host anchors, contributor-owned behavior, and application wiring.

### Substrate consumer

A feature configures a reusable shell, such as a list, map, or header, through its supported interface. The shell lives in permitted shared code; the feature does not import a sibling's UI implementation.

### Core coordination

Features consume the same shared state or server projection through a public interface and stable identity. Neither knows the other consumer.

Two consumers of a shared cart can read different projections:

```ts
import { Effect } from 'effect';
import { Cart } from '@core/cart';

// features/checkout: its own data requirement
const readCheckoutItems = (cartId: string) =>
  Cart.read(cartId).pipe(Effect.map(cart => cart.items));

// features/ga4-commerce: optional measurement enrichment
const readAnalyticsTotal = (cartId: string) =>
  Cart.read(cartId).pipe(Effect.map(cart => cart.total));
```

`Cart.read` is an illustrative public shared-state service. The analytics reader needs a snapshot instead when the specification requires action-time state rather than current state.

### Shared kernel

Subfeatures consume common domain types, rules, state, or capabilities from their parent's `shared/`. Promote a concept to `core/` when another top-level feature needs it. Extract for actual shared use, not merely because the feature has been split.

### Modification seams

A feature exposes a supported variation point: a headless interface, supplied strategy, or service binding. Its specification defines the permitted variation; another feature's needs do not silently redefine its behavior.

A filtering strategy is one focused example:

```ts
// features/product-list: supported filtering seam
type Product = { id: string; available: boolean };
type ProductListOptions = {
  itemFilter?: (
    items: ReadonlyArray<Product>,
  ) => ReadonlyArray<Product>;
};

export function selectItems(
  items: ReadonlyArray<Product>,
  options: ProductListOptions = {},
) {
  return options.itemFilter ? options.itemFilter(items) : items;
}
```

Application composition supplies the strategy through that public interface:

```ts
const availableProducts = ProductList.selectItems(products, {
  itemFilter: items => items.filter(item => item.available),
});
```

The hook/view split and dependency-binding variants serve different needs; filtering does not require either. These snippets illustrate contracts, not an implemented product-list feature.

### Composition-root distribution

Application wiring reads a supported public slice from one feature and supplies it to another feature's declared inputs. Use this for composition-specific data that is not itself a shared domain concept; the receiving feature does not import its sibling.

### Mutual reference resolution

Resolve bidirectional coupling without sibling imports: review whether the specifications describe one capability, extract genuinely shared concepts, or coordinate supported public interfaces at composition.

## Fusion ladder

Resolve coupling at the narrowest scope justified by the specifications and actual reuse. One capability can remain one feature; distinct specified subfeatures can share a kernel; wider shared concepts can move to `core/`. Coupling alone does not decide specification boundaries.

## Choosing a pattern

Use the required connection to choose a pattern: handoff → Delegation; live UI at a host anchor → Extension; reused shell → Substrate consumer; common state/projection → Core coordination; common domain capability → Shared kernel; supported variation → Modification seams; composition-specific data passing → Composition-root distribution; mutual coupling → Mutual reference resolution.

## Bridging hosts

When a feature wraps a shared shell with extension anchors, map names and context at the wrapper boundary. The feature and shell do not need identical anchor vocabularies.

## Verification

Feature behavior and outward requirements; contract compatibility and application wiring.

See [Recipes](./recipes.md) for end-to-end scenarios.
