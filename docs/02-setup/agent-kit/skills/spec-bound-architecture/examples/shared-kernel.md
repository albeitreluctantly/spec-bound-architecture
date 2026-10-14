# Shared kernel

**Browse products** and **Create product** are subfeatures of the catalog. Both use the product model and service; the parent specification's shared requirements describe them. The code lives in the catalog's `shared/`.

## Kernel

```text
src/features/catalog/
  index.ts
  shared/
    index.ts
    product.ts
    productService.ts
  browse-products/
  create-product/
```

`src/features/catalog/shared/product.ts`

```ts
export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
};

export type ProductDraft = Omit<Product, 'id'>;
```

`src/features/catalog/shared/productService.ts`

```ts
import type { Product, ProductDraft } from './product';

const storedProducts = new Map<string, Product>();

export const productService = {
  list: async (): Promise<ReadonlyArray<Product>> => [...storedProducts.values()],
  create: async (draft: ProductDraft): Promise<Product> => {
    const product = { id: crypto.randomUUID(), ...draft };
    storedProducts.set(product.id, product);
    return product;
  },
};
```

`src/features/catalog/shared/index.ts`

```ts
export type { Product, ProductDraft } from './product';
export { productService } from './productService';
```

Subfeatures import the kernel by relative path, never from each other:

`src/features/catalog/create-product/saveProduct.ts`

```ts
import { productService, type ProductDraft } from '../shared';

export function saveProduct(draft: ProductDraft) {
  return productService.create(draft);
}
```

Code that only Create product uses, such as draft validation, stays in `create-product/`.

## Promotion

**Wishlist**, a separate top-level feature, now needs the product model. Wishlist cannot import the catalog's `shared/`, so the model moves to `core/`:

```text
src/
  core/products/
    index.ts              # Product, ProductDraft, productService
  features/catalog/
    shared/               # removed if nothing else remains
    browse-products/      # imports '@core/products'
    create-product/       # imports '@core/products'
  features/wishlist/      # imports '@core/products'
```

1. Create `core/products/` with the same public contract.
2. Update the catalog subfeatures to import `@core/products`.
3. Delete the old kernel module in the same change, then add the Wishlist consumer.

Promotion follows an actual second top-level consumer. `app/` importing the model to wire a screen does not count.
