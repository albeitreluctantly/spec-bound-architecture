# Headless feature

**Product links** resolves links opened from outside the application. It has no UI: it decides what an incoming link means and requests the matching capability.

## Specification excerpt

1. WHEN the application opens a product link, open **Product details** for that product.
2. WHEN the application opens a catalog link, open **Browse products**.
3. IF a link is not recognized, THEN open **Browse products** with an invalid-link notice.

## Feature

The feature returns an intent instead of calling a callback; the result is the request.

`src/features/product-links/resolveProductLink.ts`

```ts
export type ProductLinkIntent =
  | { type: 'openProduct'; productId: string }
  | { type: 'browseProducts'; notice?: 'invalidLink' };

const PRODUCT_PATH = /^\/products\/([\w-]+)$/;
const CATALOG_PATH = /^\/catalog\/?$/;

export function resolveProductLink(url: URL): ProductLinkIntent {
  const productMatch = PRODUCT_PATH.exec(url.pathname);
  if (productMatch) return { type: 'openProduct', productId: productMatch[1] };
  if (CATALOG_PATH.test(url.pathname)) return { type: 'browseProducts' };
  return { type: 'browseProducts', notice: 'invalidLink' };
}
```

`src/features/product-links/index.ts`

```ts
export { resolveProductLink, type ProductLinkIntent } from './resolveProductLink';
```

The intent type is exported by name because `app/` names it in its handler.

## Application wiring

`app/` receives links from the platform and fulfills the intents. `onLinkOpened` and `useRouter` stand for the project's linking and navigation APIs.

`src/app/LinkHandler.tsx`

```tsx
import { useEffect } from 'react';
import { resolveProductLink, type ProductLinkIntent } from '@features/product-links';
import { onLinkOpened } from '@library/linking';
import { useRouter } from '@library/navigation';

export function LinkHandler() {
  const router = useRouter();

  useEffect(
    function followOpenedLinks() {
      const fulfill = (intent: ProductLinkIntent) => {
        switch (intent.type) {
          case 'openProduct':
            return router.push(`/products/${intent.productId}`);
          case 'browseProducts':
            return router.push(intent.notice ? `/catalog?notice=${intent.notice}` : '/catalog');
        }
      };
      return onLinkOpened((url) => fulfill(resolveProductLink(url)));
    },
    [router],
  );

  return null;
}
```
