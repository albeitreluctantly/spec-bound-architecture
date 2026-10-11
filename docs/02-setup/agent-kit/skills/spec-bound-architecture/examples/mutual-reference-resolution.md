# Mutual reference resolution

**Store search** shows stores on a map and in a list. Selecting a store on either one highlights it on the other. The map and the list depend on each other, and sibling imports are never allowed, so the coupling is resolved with the fusion ladder.

## Choosing the rung

1. **One feature.** If one specification describes the map, the list, and their synchronization, it is one feature with one folder. Map and list are private parts of it.
2. **Parent composition.** If **Store map** and **Store list** are separate specifications and the parent **Store search** specification defines their combined experience ("selecting a store on the map or in the list highlights it in both"), the parent composes them and shares the selection through its `shared/`.
3. **Shared foundation.** If several top-level features need the same synchronized selection, it moves to `core/`.

This example is rung 2.

```text
src/features/store-search/
  index.ts
  StoreSearchPage.tsx      # parent composition, specified by the parent
  shared/selection/
    index.ts
  store-map/
    index.ts
    StoreMap.tsx
  store-list/
    index.ts
    StoreList.tsx
```

## Shared selection

`src/features/store-search/shared/selection/index.ts`

```ts
import { createStore, useStore } from '@library/state';

const selectedStoreStore = createStore<string | null>(null);

export function useSelectedStoreId(): string | null {
  return useStore(selectedStoreStore);
}

export function selectStore(storeId: string) {
  selectedStoreStore.set(storeId);
}
```

## Subfeatures

Each subfeature reads and writes the selection through the parent's `shared/` and knows nothing of its sibling.

`src/features/store-search/store-map/StoreMap.tsx`

```tsx
import { MapView } from '@library/ui';
import { selectStore, useSelectedStoreId } from '../shared/selection';
import { useStoreLocations } from './useStoreLocations';

export function StoreMap() {
  const locations = useStoreLocations();

  return (
    <MapView
      markers={locations}
      highlightedMarkerId={useSelectedStoreId()}
      onMarkerPress={selectStore}
    />
  );
}
```

`src/features/store-search/store-list/StoreList.tsx`

```tsx
import { ListItem, Stack } from '@library/ui';
import { selectStore, useSelectedStoreId } from '../shared/selection';
import { useStores } from './useStores';

export function StoreList() {
  const stores = useStores();
  const selectedStoreId = useSelectedStoreId();

  return (
    <Stack>
      {stores.map((store) => (
        <ListItem
          key={store.id}
          title={store.name}
          isHighlighted={store.id === selectedStoreId}
          onPress={() => selectStore(store.id)}
        />
      ))}
    </Stack>
  );
}
```

`src/features/store-search/store-map/index.ts`

```ts
export { StoreMap as Widget } from './StoreMap';
```

`src/features/store-search/store-list/index.ts`

```ts
export { StoreList as Widget } from './StoreList';
```

## Parent composition

The parent composes the subfeatures through their entries because its own specification defines the combined experience.

`src/features/store-search/StoreSearchPage.tsx`

```tsx
import { Split } from '@library/ui';
import * as StoreList from './store-list';
import * as StoreMap from './store-map';

export function StoreSearchPage() {
  return (
    <Split>
      <StoreMap.Widget />
      <StoreList.Widget />
    </Split>
  );
}
```

`src/features/store-search/index.ts`

```ts
export { StoreSearchPage as Page } from './StoreSearchPage';
```

`app/` mounts `StoreSearch.Page`. Without the parent's combined-experience specification, the parent would only re-export the two entries and `app/` would place them, sharing the selection through [Composition-root distribution](composition-root-distribution.md) or [Core coordination](core-coordination.md).

The selection store here lives for the whole application. When the specification requires a fresh selection per visit, the parent provides it through a context instead.
