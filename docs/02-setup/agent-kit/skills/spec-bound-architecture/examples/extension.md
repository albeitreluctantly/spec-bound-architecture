# Extension

**Browse products** hosts contributions from other features: an action area on each product card and a footer below the list. **Compare products** is a widget whose specification places it in both.

## Specification excerpt

**Compare products**

1. A compare toggle appears on each product card in **Browse products**; a compare bar appears below the list.
2. WHEN shoppers toggle compare on a product, add it to or remove it from the comparison. At most three products can be selected.
3. WHILE fewer than two products are selected, the compare bar is disabled.
4. WHEN shoppers press Compare, open the **Product comparison** for the selected products.

Criterion 1 is an Embedding into Browse products; criterion 4 is a Handoff.

## Host anchors

The host declares each anchor and the context it passes. Anchor names describe places in the host.

`src/features/catalog/browse-products/anchors.ts`

```ts
import { createExtensions, type Extensions } from '@library/extensions';

export type BrowseProductsAnchors = {
  cardActions: { productId: string };
  footer: void;
};

export type BrowseProductsExtensions = Extensions<BrowseProductsAnchors>;

export const { ExtensionsProvider, ExtensionSlot } =
  createExtensions<BrowseProductsAnchors>();
```

## Shallow and deep anchors

A shallow anchor sits in the host's own layout and calls the render function inline. A deep anchor sits inside a child component; the host provides the extensions once and the child renders a slot.

`src/features/catalog/browse-products/BrowseProducts.tsx`

```tsx
import { Stack } from '@library/ui';
import { ExtensionsProvider, type BrowseProductsExtensions } from './anchors';
import { ProductCard } from './ProductCard';
import { useProducts } from './useProducts';

type BrowseProductsProps = {
  extensions?: BrowseProductsExtensions;
};

export function BrowseProducts({ extensions }: BrowseProductsProps) {
  const products = useProducts();

  return (
    <ExtensionsProvider extensions={extensions}>
      <Stack>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Stack>
      {extensions?.footer?.()}
    </ExtensionsProvider>
  );
}
```

`src/features/catalog/browse-products/ProductCard.tsx`

```tsx
import { Card, Text } from '@library/ui';
import type { Product } from '../shared';
import { ExtensionSlot } from './anchors';

type ProductCardProps = { product: Product };

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card>
      <Text>{product.name}</Text>
      <ExtensionSlot name="cardActions" context={{ productId: product.id }} />
    </Card>
  );
}
```

`src/features/catalog/browse-products/index.ts`

```ts
export { BrowseProducts as Page } from './BrowseProducts';
```

## Contribution

```text
src/features/compare-products/
  index.ts
  CompareProvider.tsx
  CompareSelection.ts      # private
  CompareToggle.tsx        # private
  CompareBar.tsx           # private
```

`src/features/compare-products/CompareSelection.ts`

```ts
import { createContext } from 'react';

export type CompareProductsIntent = {
  type: 'openComparison';
  productIds: ReadonlyArray<string>;
};

type CompareSelection = {
  selectedIds: ReadonlyArray<string>;
  toggle: (productId: string) => void;
  onIntent: (intent: CompareProductsIntent) => void;
};

export const CompareSelectionContext = createContext<CompareSelection>(null!);
```

`src/features/compare-products/CompareToggle.tsx`

```tsx
import { use } from 'react';
import { Toggle } from '@library/ui';
import { CompareSelectionContext } from './CompareSelection';

type CompareToggleProps = { productId: string };

export function CompareToggle({ productId }: CompareToggleProps) {
  const { selectedIds, toggle } = use(CompareSelectionContext);

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
import { use } from 'react';
import { Button } from '@library/ui';
import { CompareSelectionContext } from './CompareSelection';

const MIN_COMPARED_PRODUCTS = 2;

export function CompareBar() {
  const { selectedIds, onIntent } = use(CompareSelectionContext);

  return (
    <Button
      label={`Compare (${selectedIds.length})`}
      disabled={selectedIds.length < MIN_COMPARED_PRODUCTS}
      onPress={() => onIntent({ type: 'openComparison', productIds: selectedIds })}
    />
  );
}
```

`src/features/compare-products/CompareProvider.tsx`

```tsx
import { useState, type ReactNode } from 'react';
import { CompareBar } from './CompareBar';
import { CompareSelectionContext, type CompareProductsIntent } from './CompareSelection';
import { CompareToggle } from './CompareToggle';

const MAX_COMPARED_PRODUCTS = 3;

const extensions = {
  cardActions: ({ productId }: { productId: string }) => <CompareToggle productId={productId} />,
  footer: () => <CompareBar />,
};

type CompareProviderProps = {
  onIntent: (intent: CompareProductsIntent) => void;
  children: (contribution: { extensions: typeof extensions }) => ReactNode;
};

export function CompareProvider({ onIntent, children }: CompareProviderProps) {
  const [selectedIds, setSelectedIds] = useState<ReadonlyArray<string>>([]);

  const toggle = (productId: string) =>
    setSelectedIds((ids) => {
      if (ids.includes(productId)) return ids.filter((id) => id !== productId);
      if (ids.length >= MAX_COMPARED_PRODUCTS) return ids;
      return [...ids, productId];
    });

  return (
    <CompareSelectionContext value={{ selectedIds, toggle, onIntent }}>
      {children({ extensions })}
    </CompareSelectionContext>
  );
}
```

`src/features/compare-products/index.ts`

```ts
export { CompareProvider as Provider } from './CompareProvider';
```

## Composition wiring

`src/app/routes/CatalogRoute.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';
import * as CompareProducts from '@features/compare-products';
import { useRouter } from '@library/navigation';

export function CatalogRoute() {
  const router = useRouter();

  return (
    <CompareProducts.Provider
      onIntent={(intent) => router.push(`/compare?ids=${intent.productIds.join(',')}`)}
    >
      {({ extensions }) => <BrowseProducts.Page extensions={extensions} />}
    </CompareProducts.Provider>
  );
}
```

| Concern | Owner |
| --- | --- |
| Anchors and their context types | Host feature |
| Slot rendering inside the host | Host feature, through the extension helper |
| Fragments, their state, and the anchors they fill | Contributing feature |
| Which contribution reaches which host; provider placement and intent fulfillment | `app/` |

## Contribution hooks

A contribution can be a hook instead of a provider. Hooks keep several contributions on one screen flat and let `app/` pass one contribution's data to another.

**Price alerts** specifies: "WHILE products are selected for comparison, the list footer offers price-drop alerts for them."

`src/features/compare-products/useCompareContribution.tsx`

```tsx
import { useState } from 'react';
import { Button, Toggle } from '@library/ui';
import type { CompareProductsIntent } from './CompareSelection';

const MAX_COMPARED_PRODUCTS = 3;
const MIN_COMPARED_PRODUCTS = 2;

type CompareContributionOptions = {
  onIntent: (intent: CompareProductsIntent) => void;
};

export function useCompareContribution({ onIntent }: CompareContributionOptions) {
  const [selectedIds, setSelectedIds] = useState<ReadonlyArray<string>>([]);

  const toggle = (productId: string) =>
    setSelectedIds((ids) => {
      if (ids.includes(productId)) return ids.filter((id) => id !== productId);
      if (ids.length >= MAX_COMPARED_PRODUCTS) return ids;
      return [...ids, productId];
    });

  return {
    selectedIds,
    extensions: {
      cardActions: ({ productId }: { productId: string }) => (
        <Toggle
          label="Compare"
          value={selectedIds.includes(productId)}
          onChange={() => toggle(productId)}
        />
      ),
      footer: () => (
        <Button
          label={`Compare (${selectedIds.length})`}
          disabled={selectedIds.length < MIN_COMPARED_PRODUCTS}
          onPress={() => onIntent({ type: 'openComparison', productIds: selectedIds })}
        />
      ),
    },
  };
}
```

`src/features/compare-products/index.ts`

```ts
export { useCompareContribution as useContribution } from './useCompareContribution';
```

`src/features/price-alerts/usePriceAlertsContribution.tsx`

```tsx
import { useState } from 'react';
import { Button } from '@library/ui';
import { watchPrices } from './priceAlertService';

type PriceAlertsContributionOptions = {
  productIds: ReadonlyArray<string>;
};

export function usePriceAlertsContribution({ productIds }: PriceAlertsContributionOptions) {
  const [isWatching, setIsWatching] = useState(false);

  return {
    extensions: {
      footer: () =>
        productIds.length > 0 && (
          <Button
            label={isWatching ? 'Watching prices' : 'Alert me on price drops'}
            disabled={isWatching}
            onPress={() => watchPrices(productIds).then(() => setIsWatching(true))}
          />
        ),
    },
  };
}
```

`src/features/price-alerts/index.ts`

```ts
export { usePriceAlertsContribution as useContribution } from './usePriceAlertsContribution';
```

`src/app/routes/CatalogRoute.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';
import * as CompareProducts from '@features/compare-products';
import * as PriceAlerts from '@features/price-alerts';
import { useRouter } from '@library/navigation';

export function CatalogRoute() {
  const router = useRouter();
  const compare = CompareProducts.useContribution({
    onIntent: (intent) => router.push(`/compare?ids=${intent.productIds.join(',')}`),
  });
  const priceAlerts = PriceAlerts.useContribution({ productIds: compare.selectedIds });

  return (
    <BrowseProducts.Page
      extensions={{
        cardActions: compare.extensions.cardActions,
        footer: () => (
          <>
            {compare.extensions.footer()}
            {priceAlerts.extensions.footer()}
          </>
        ),
      }}
    />
  );
}
```

## Extension helper

The helper is generic infrastructure in `library/`. It types each anchor's render function by its context.

`src/library/extensions/index.tsx`

```tsx
import { createContext, use, type PropsWithChildren, type ReactNode } from 'react';

export type Extensions<Anchors extends Record<string, unknown>> = {
  [Name in keyof Anchors]?: Anchors[Name] extends void
    ? () => ReactNode
    : (context: Anchors[Name]) => ReactNode;
};

type SlotProps<
  Anchors extends Record<string, unknown>,
  Name extends keyof Anchors,
> = Anchors[Name] extends void ? { name: Name } : { name: Name; context: Anchors[Name] };

type AnyRender = (context?: unknown) => ReactNode;

export function createExtensions<Anchors extends Record<string, unknown>>() {
  const ExtensionsContext = createContext<Extensions<Anchors>>({});

  function ExtensionsProvider({
    extensions,
    children,
  }: PropsWithChildren<{ extensions?: Extensions<Anchors> }>) {
    return <ExtensionsContext value={extensions ?? {}}>{children}</ExtensionsContext>;
  }

  function ExtensionSlot<Name extends keyof Anchors>(props: SlotProps<Anchors, Name>) {
    const render = use(ExtensionsContext)[props.name] as AnyRender | undefined;
    if (!render) return null;
    return 'context' in props ? render(props.context) : render();
  }

  return { ExtensionsProvider, ExtensionSlot };
}
```
