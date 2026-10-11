# Substrate consumer

**Browse products** and **Wishlist** both show products in a grid with the same card layout. The grid is a reusable shell; each feature configures it.

## Placement

The shell knows the `Product` model, so it is domain-aware. Two top-level features use it, so it lives in `core/`. If only subfeatures of the catalog used it, it would live in `features/catalog/shared/`; if it knew no product domain, in `library/`.

```text
src/
  core/product-grid/
    index.ts
    ProductGrid.tsx
  core/products/
    index.ts             # Product model
  features/catalog/browse-products/
  features/wishlist/
```

## Shell

The shell accepts configuration and typed extension slots. It owns layout, not either feature's behavior.

`src/core/product-grid/ProductGrid.tsx`

```tsx
import type { ReactNode } from 'react';
import type { Product } from '@core/products';
import { Card, Grid, Text } from '@library/ui';

type ProductGridProps = {
  products: ReadonlyArray<Product>;
  columnCount?: 2 | 3;
  showsPrices?: boolean;
  extensions?: {
    leadingItem?: () => ReactNode;
    cardFooter?: (context: { productId: string }) => ReactNode;
  };
};

export function ProductGrid({
  products,
  columnCount = 2,
  showsPrices = true,
  extensions,
}: ProductGridProps) {
  return (
    <Grid columnCount={columnCount}>
      {extensions?.leadingItem?.()}
      {products.map((product) => (
        <Card key={product.id}>
          <Text>{product.name}</Text>
          {showsPrices && <Text>{product.price.toFixed(2)}</Text>}
          {extensions?.cardFooter?.({ productId: product.id })}
        </Card>
      ))}
    </Grid>
  );
}
```

`src/core/product-grid/index.ts`

```ts
export { ProductGrid } from './ProductGrid';
```

## Consumers

Each feature configures the shell for its own specification.

`src/features/wishlist/WishlistPage.tsx`

```tsx
import { ProductGrid } from '@core/product-grid';
import { Button } from '@library/ui';
import { removeFromWishlist, useWishlistProducts } from './wishlistRepository';

export function WishlistPage() {
  const products = useWishlistProducts();

  return (
    <ProductGrid
      products={products}
      columnCount={3}
      extensions={{
        cardFooter: ({ productId }) => (
          <Button label="Remove" onPress={() => removeFromWishlist(productId)} />
        ),
      }}
    />
  );
}
```

The Remove action belongs to Wishlist and fills the shell's slot from inside the feature. When a slot must receive a different feature's live widget, the consuming feature exposes its own anchor and `app/` fills it; see [Extension](extension.md) and Bridging hosts in [integration patterns](../references/integration-patterns.md#bridging-hosts).

Browse products would use the same shell with its own configuration; neither feature imports the other.
