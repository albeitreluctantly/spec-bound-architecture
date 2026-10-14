# Screen feature

**Create product** is a screen in the catalog. The project conventions map `specs/catalog/create-product.md` to `src/features/catalog/create-product/`.

## Specification

`specs/catalog/create-product.md`

```md
# Create product

Catalog staff add a product that becomes available in **Browse products**.

1. WHEN staff open Create product, the form shows an empty draft with Name, Price, and Description.
2. IF a submitted draft is invalid, THEN show field errors, keep the draft, and save nothing.
3. WHEN staff submit a valid draft, save the product, then open **Browse products**.
4. WHEN staff cancel, discard the draft and open **Browse products**.
```

Opening Browse products is a Handoff.

## Folders

```text
src/
  app/routes/
    CreateProductRoute.tsx
  features/catalog/
    index.ts
    shared/                  # product model and service; see Shared kernel
    browse-products/         # sibling subfeature
    create-product/
      index.ts               # public entry
      CreateProduct.tsx
      ProductForm.tsx        # private
      validateDraft.ts       # private
```

## Criteria to code

| Criterion | Code |
| --- | --- |
| 1. Empty draft | `ProductForm.tsx` |
| 2. Invalid draft | `validateDraft.ts`, applied by `ProductForm.tsx` |
| 3. Save, then open Browse products | `CreateProduct.tsx`: `productService.create`, then the `browseProducts` intent |
| 4. Cancel | `CreateProduct.tsx`: the `browseProducts` intent |
| Handoff to Browse products | `CreateProductRoute.tsx`: navigation for `browseProducts` |

## Owned behavior and intents

`src/features/catalog/create-product/CreateProduct.tsx`

```tsx
import { productService } from '../shared';
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
      validate={validateDraft}
      onSubmit={async (draft) => {
        await productService.create(draft);
        browseProducts();
      }}
      onCancel={browseProducts}
    />
  );
}
```

## Public entries

`src/features/catalog/create-product/index.ts`

```ts
export { CreateProduct as Page } from './CreateProduct';
```

`src/features/catalog/index.ts`

```ts
export * as BrowseProducts from './browse-products';
export * as CreateProduct from './create-product';
```

The catalog has no combined-experience specification, so its entry re-exports the subfeature entries for `app/`.

## Mounting in the application

`useRouter` stands for the project's navigation API.

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
