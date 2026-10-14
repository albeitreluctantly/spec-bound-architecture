# Extension

**Browse products** hosts contributions from other features: an action area on each product card and a footer below the list. The [Compare products widget](widget-feature.md) fills both.

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

## Composition wiring

`app/` decides who fills each anchor and places the contributor's provider around the host.

`src/app/routes/CatalogRoute.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';
import * as CompareWidget from '@features/compare-products';
import { useRouter } from '@library/navigation';

export function CatalogRoute() {
  const router = useRouter();

  return (
    <CompareWidget.Provider>
      <BrowseProducts.Page
        extensions={{
          cardActions: ({ productId }) => <CompareWidget.Toggle productId={productId} />,
          footer: () => (
            <CompareWidget.Bar
              onIntent={(intent) =>
                router.push(`/compare?ids=${intent.productIds.join(',')}`)
              }
            />
          ),
        }}
      />
    </CompareWidget.Provider>
  );
}
```

| Concern | Owner |
| --- | --- |
| Anchors and their context types | Host feature |
| Slot rendering inside the host | Host feature, through the extension helper |
| Rendered fragments and their state | Contributing feature |
| Which contributor fills which anchor; contributor provider placement | `app/` |

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
