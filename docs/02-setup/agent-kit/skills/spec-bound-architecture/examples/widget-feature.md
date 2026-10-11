# Widget feature

**Compare products** places a toggle on each product card and a bar at the bottom of the product list. Its fragments share an ephemeral selection, so the widget exports a provider.

## Specification excerpt

1. A compare toggle appears on each product card in **Browse products**; a compare bar appears below the list.
2. WHEN shoppers toggle compare on a product, add it to or remove it from the comparison. At most three products can be selected.
3. WHILE fewer than two products are selected, the compare bar is disabled.
4. WHEN shoppers press Compare, open the **Product comparison** for the selected products.

Criterion 1 is an Embedding into Browse products; criterion 4 is a Handoff.

## Folders

```text
src/features/compare-products/
  index.ts
  CompareSelection.tsx     # provider and private selection hook
  CompareToggle.tsx
  CompareBar.tsx
```

## Shared ephemeral state

`src/features/compare-products/CompareSelection.tsx`

```tsx
import { createContext, use, useState, type PropsWithChildren } from 'react';

type CompareSelection = {
  selectedIds: ReadonlyArray<string>;
  toggle: (productId: string) => void;
};

const MAX_COMPARED_PRODUCTS = 3;

const CompareSelectionContext = createContext<CompareSelection | null>(null);

export function CompareSelectionProvider({ children }: PropsWithChildren) {
  const [selectedIds, setSelectedIds] = useState<ReadonlyArray<string>>([]);

  const toggle = (productId: string) =>
    setSelectedIds((ids) => {
      if (ids.includes(productId)) return ids.filter((id) => id !== productId);
      if (ids.length >= MAX_COMPARED_PRODUCTS) return ids;
      return [...ids, productId];
    });

  return (
    <CompareSelectionContext value={{ selectedIds, toggle }}>
      {children}
    </CompareSelectionContext>
  );
}

export function useCompareSelection(): CompareSelection {
  const selection = use(CompareSelectionContext);
  if (!selection) {
    throw new Error('Compare fragments must be placed inside the compare Provider');
  }
  return selection;
}
```

## Fragments

`src/features/compare-products/CompareToggle.tsx`

```tsx
import { Toggle } from '@library/ui';
import { useCompareSelection } from './CompareSelection';

type CompareToggleProps = { productId: string };

export function CompareToggle({ productId }: CompareToggleProps) {
  const { selectedIds, toggle } = useCompareSelection();

  return (
    <Toggle
      label="Compare"
      value={selectedIds.includes(productId)}
      onChange={() => toggle(productId)}
    />
  );
}
```

`src/features/compare-products/CompareBar.tsx`

```tsx
import { Button } from '@library/ui';
import { useCompareSelection } from './CompareSelection';

type CompareProductsIntent = {
  type: 'openComparison';
  productIds: ReadonlyArray<string>;
};

type CompareBarProps = {
  onIntent: (intent: CompareProductsIntent) => void;
};

const MIN_COMPARED_PRODUCTS = 2;

export function CompareBar({ onIntent }: CompareBarProps) {
  const { selectedIds } = useCompareSelection();

  return (
    <Button
      label={`Compare (${selectedIds.length})`}
      disabled={selectedIds.length < MIN_COMPARED_PRODUCTS}
      onPress={() => onIntent({ type: 'openComparison', productIds: selectedIds })}
    />
  );
}
```

## Public entry

`src/features/compare-products/index.ts`

```ts
export { CompareBar as Bar } from './CompareBar';
export { CompareSelectionProvider as Provider } from './CompareSelection';
export { CompareToggle as Toggle } from './CompareToggle';
```

Consumers import the entry as a namespace: `import * as CompareWidget from '@features/compare-products'`. The selection hook stays private. The widget knows nothing about Browse products: the host exposes anchors and `app/` places the fragments and the provider. See [Extension](extension.md) for the host and wiring.
