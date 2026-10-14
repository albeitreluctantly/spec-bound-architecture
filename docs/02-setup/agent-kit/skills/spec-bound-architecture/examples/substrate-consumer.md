# Substrate consumer

**Browse products** and **Wishlist** both show products in a grid with the same card layout. The grid is a reusable shell; each feature configures it. **Price alerts** adds an alert button to each wishlist card.

## Placement

The shell knows the `Product` model, so it is domain-aware. Two top-level features use it, so it lives in `core/`. If only subfeatures of the catalog used it, it would live in `features/catalog/shared/`; if it knew no product domain, in `library/`.

```text
src/
  core/product-grid/
    index.ts
    anchors.ts
    ProductGrid.tsx
    ProductTile.tsx
  core/products/
    index.ts             # Product model
  features/catalog/browse-products/
  features/wishlist/
  features/price-alerts/
```

## Shell

The shell owns layout and its anchors, not either feature's behavior.

`src/core/product-grid/anchors.ts`

```ts
import { createExtensions, type Extensions } from '@library/extensions';

export type ProductGridAnchors = {
  leadingItem: void;
  cardActions: { productId: string };
};

export type ProductGridExtensions = Extensions<ProductGridAnchors>;

export const { ExtensionsProvider, ExtensionSlot } =
  createExtensions<ProductGridAnchors>();
```

`src/core/product-grid/ProductGrid.tsx`

```tsx
import type { Product } from '@core/products';
import { Grid } from '@library/ui';
import { ExtensionsProvider, type ProductGridExtensions } from './anchors';
import { ProductTile } from './ProductTile';

type ProductGridProps = {
  products: ReadonlyArray<Product>;
  columnCount?: 2 | 3;
  showsPrices?: boolean;
  extensions?: ProductGridExtensions;
};

export function ProductGrid({
  products,
  columnCount = 2,
  showsPrices = true,
  extensions,
}: ProductGridProps) {
  return (
    <ExtensionsProvider extensions={extensions}>
      <Grid columnCount={columnCount}>
        {extensions?.leadingItem?.()}
        {products.map((product) => (
          <ProductTile key={product.id} product={product} showsPrice={showsPrices} />
        ))}
      </Grid>
    </ExtensionsProvider>
  );
}
```

`src/core/product-grid/ProductTile.tsx`

```tsx
import type { Product } from '@core/products';
import { Card, Text } from '@library/ui';
import { ExtensionSlot } from './anchors';

type ProductTileProps = { product: Product; showsPrice: boolean };

export function ProductTile({ product, showsPrice }: ProductTileProps) {
  return (
    <Card>
      <Text>{product.name}</Text>
      {showsPrice && <Text>{product.price.toFixed(2)}</Text>}
      <ExtensionSlot name="cardActions" context={{ productId: product.id }} />
    </Card>
  );
}
```

`src/core/product-grid/index.ts`

```ts
export { ProductGrid } from './ProductGrid';
export type { ProductGridAnchors, ProductGridExtensions } from './anchors';
```

## Consumer

`src/features/wishlist/WishlistPage.tsx`

```tsx
import { ProductGrid, type ProductGridExtensions } from '@core/product-grid';
import { Button } from '@library/ui';
import { removeFromWishlist, useWishlistProducts } from './wishlistService';

type WishlistPageProps = {
  extensions?: Pick<ProductGridExtensions, 'cardActions'>;
};

export function WishlistPage({ extensions }: WishlistPageProps) {
  const products = useWishlistProducts();

  return (
    <ProductGrid
      products={products}
      columnCount={3}
      extensions={{
        cardActions: (context) => (
          <>
            <Button label="Remove" onPress={() => removeFromWishlist(context.productId)} />
            {extensions?.cardActions?.(context)}
          </>
        ),
      }}
    />
  );
}
```

`src/features/wishlist/index.ts`

```ts
export { WishlistPage as Page } from './WishlistPage';
```

## Contributor

`src/features/price-alerts/cardActions.tsx`

```tsx
import type { ProductGridAnchors } from '@core/product-grid';
import { PriceAlertButton } from './PriceAlertButton';

export const cardActions = ({ productId }: ProductGridAnchors['cardActions']) => (
  <PriceAlertButton productId={productId} />
);
```

`src/features/price-alerts/index.ts`

```ts
export { cardActions } from './cardActions';
```

## Composition wiring

`src/app/routes/WishlistRoute.tsx`

```tsx
import * as PriceAlerts from '@features/price-alerts';
import * as Wishlist from '@features/wishlist';

export function WishlistRoute() {
  return <Wishlist.Page extensions={{ cardActions: PriceAlerts.cardActions }} />;
}
```

Browse products would use the same shell with its own configuration; neither feature imports the other.
