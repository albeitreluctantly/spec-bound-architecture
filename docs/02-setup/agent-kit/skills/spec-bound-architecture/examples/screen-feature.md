# Screen feature

A catalog has two specifications, **Browse products** and **Create product**, grouped under a catalog parent. Both are screens.

## Specification excerpt

**Create product** lets catalog staff add a product that becomes available in **Browse products**.

1. WHEN staff open Create product, the form shows an empty draft with Name, Price, and Description.
2. IF a submitted draft violates the validation rules, THEN show field errors, keep the draft, and save nothing.
3. WHEN staff submit a valid draft, save the product.
4. WHEN the product is saved, open **Browse products**.
5. WHEN staff cancel, discard the draft and open **Browse products**.

Opening Browse products is a Handoff: Create product requests it; `app/` fulfills the request.

## Folders

```text
src/
  app/routes/
    CatalogRoute.tsx
    CreateProductRoute.tsx
  features/catalog/
    index.ts
    browse-products/
      index.ts
      BrowseProducts.tsx
      ProductList.tsx          # private
      useProducts.ts           # private
    create-product/
      index.ts
      CreateProduct.tsx
      ProductForm.tsx          # private
      validateDraft.ts         # private
    shared/products/
      index.ts                 # product contract and repository used by both
```

## Owned behavior and intents

`src/features/catalog/create-product/CreateProduct.tsx`

```tsx
import { products } from '../shared/products';
import { ProductForm } from './ProductForm';
import { validateDraft } from './validateDraft';

type CreateProductIntent = { type: 'browseProducts' };

type CreateProductProps = {
  onIntent: (intent: CreateProductIntent) => void;
};

export function CreateProduct({ onIntent }: CreateProductProps) {
  const browseProducts = () => onIntent({ type: 'browseProducts' });

  return (
    <ProductForm
      onSubmit={async (draft) => {
        await products.create(validateDraft(draft));
        browseProducts();
      }}
      onCancel={browseProducts}
    />
  );
}
```

The feature decides when to leave and says what it needs, not where to go. The form, validation, pending state, and errors stay private.

`src/features/catalog/browse-products/BrowseProducts.tsx`

```tsx
import { ProductList } from './ProductList';
import { useProducts } from './useProducts';

type BrowseProductsIntent = { type: 'createProduct' };

type BrowseProductsProps = {
  onIntent: (intent: BrowseProductsIntent) => void;
};

export function BrowseProducts({ onIntent }: BrowseProductsProps) {
  const products = useProducts();

  return (
    <ProductList
      products={products}
      onCreatePress={() => onIntent({ type: 'createProduct' })}
    />
  );
}
```

A private button callback becomes a named intent before it crosses the feature boundary.

## Public entries

`src/features/catalog/create-product/index.ts`

```ts
export { CreateProduct as Page } from './CreateProduct';
```

`src/features/catalog/browse-products/index.ts`

```ts
export { BrowseProducts as Page } from './BrowseProducts';
```

`src/features/catalog/index.ts`

```ts
export * as BrowseProducts from './browse-products';
export * as CreateProduct from './create-product';
```

The catalog parent has no combined-experience specification, so it only re-exports the subfeature entries.

## Application wiring

`useRouter` stands for the project's navigation API.

`src/app/routes/CatalogRoute.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';
import { useRouter } from '@library/navigation';

export function CatalogRoute() {
  const router = useRouter();

  return (
    <BrowseProducts.Page
      onIntent={(intent) => {
        switch (intent.type) {
          case 'createProduct':
            return router.push('/catalog/create');
        }
      }}
    />
  );
}
```

`src/app/routes/CreateProductRoute.tsx`

```tsx
import { CreateProduct } from '@features/catalog';
import { useRouter } from '@library/navigation';

export function CreateProductRoute() {
  const router = useRouter();

  return (
    <CreateProduct.Page
      onIntent={(intent) => {
        switch (intent.type) {
          case 'browseProducts':
            return router.replace('/catalog');
        }
      }}
    />
  );
}
```

## Verification

- Feature tests drive the form and assert the emitted intent: saving a valid draft emits `browseProducts` after the save; an invalid draft emits nothing.
- An integration check confirms the route fulfills `browseProducts` by opening the catalog.
