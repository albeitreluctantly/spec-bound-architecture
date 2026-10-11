# Modification seams

A seam lets an integrating feature or `app/` vary a feature's behavior without editing its logic. The seam is added to the modified feature's code when an integration needs it; that feature's specification does not change, because its default behavior stays the same. Each seam below serves a different kind of variation.

## Strategy

**Gift guide** specifies: "The gift guide shows Browse products limited to gift-eligible products." Browse products gets a filtering seam. The eligibility rule belongs to Gift guide. The catalog's `Product` carries a `price` and `tags`.

`src/features/catalog/browse-products/BrowseProducts.tsx`

```tsx
import type { Product } from '../shared/products';
import { ProductList } from './ProductList';
import { useProducts } from './useProducts';

type BrowseProductsProps = {
  productFilter?: (products: ReadonlyArray<Product>) => ReadonlyArray<Product>;
};

export function BrowseProducts({ productFilter }: BrowseProductsProps) {
  const products = useProducts();
  const visibleProducts = productFilter ? productFilter(products) : products;

  return <ProductList products={visibleProducts} />;
}
```

Without a filter, Browse products behaves exactly as its specification describes.

`src/features/gift-guide/isGiftEligible.ts`

```ts
type GiftCandidate = { price: number; tags: ReadonlyArray<string> };

const MAX_GIFT_PRICE = 150;

export function isGiftEligible(product: GiftCandidate): boolean {
  return product.tags.includes('giftable') && product.price <= MAX_GIFT_PRICE;
}
```

`src/features/gift-guide/index.ts`

```ts
export { isGiftEligible } from './isGiftEligible';
```

`app/` connects the seam to the rule on the gift guide route:

`src/app/routes/GiftGuideRoute.tsx`

```tsx
import { BrowseProducts } from '@features/catalog';
import * as GiftGuide from '@features/gift-guide';

export function GiftGuideRoute() {
  return (
    <BrowseProducts.Page
      productFilter={(products) => products.filter(GiftGuide.isGiftEligible)}
    />
  );
}
```

A comparator, a predicate, or a handler that replaces a default action follows the same shape: an optional, typed function with the default behavior when absent.

## Service binding

**Store locator** finds stores near an address. It needs geocoding but does not choose a provider: it declares the service interface and `app/` binds an implementation.

`src/features/store-locator/geocoding.tsx`

```tsx
import { createContext, use, type PropsWithChildren } from 'react';

export type Coordinates = { latitude: number; longitude: number };

export type GeocodingService = {
  locate: (address: string) => Promise<Coordinates | null>;
};

const GeocodingContext = createContext<GeocodingService | null>(null);

export function GeocodingProvider({
  service,
  children,
}: PropsWithChildren<{ service: GeocodingService }>) {
  return <GeocodingContext value={service}>{children}</GeocodingContext>;
}

export function useGeocoding(): GeocodingService {
  const service = use(GeocodingContext);
  if (!service) throw new Error('Store locator requires a GeocodingProvider');
  return service;
}
```

`src/features/store-locator/index.ts`

```ts
export { GeocodingProvider, type GeocodingService } from './geocoding';
export { StoreLocator as Page } from './StoreLocator';
```

`src/app/providers.tsx`

```tsx
import type { PropsWithChildren } from 'react';
import * as StoreLocator from '@features/store-locator';
import { createMapGeocoding } from '@library/geocoding';

const geocoding: StoreLocator.GeocodingService = createMapGeocoding();

export function AppProviders({ children }: PropsWithChildren) {
  return <StoreLocator.GeocodingProvider service={geocoding}>{children}</StoreLocator.GeocodingProvider>;
}
```

The provider adapter in `library/geocoding` knows no product domain. A dependency-injection container is an equivalent mechanism: the feature declares the interface and its module bindings; `app/` loads them into the container.

## Separate logic and view

**Gift wrapping** specifies: "WHEN gift wrapping is selected, the order summary includes a gift wrap line." **Order summary** exposes a supported logic slice and its view, so the composition can render the view with an added line.

`src/features/order-summary/useOrderSummary.ts`

```ts
import { useCart } from '@core/cart';

export type SummaryLine = { label: string; amount: number };

export type OrderSummary = {
  lines: ReadonlyArray<SummaryLine>;
};

export function useOrderSummary(): OrderSummary {
  const cart = useCart();
  return {
    lines: cart.lines.map((line) => ({
      label: `${line.productId} × ${line.quantity}`,
      amount: line.unitPrice * line.quantity,
    })),
  };
}
```

`src/features/order-summary/OrderSummaryView.tsx`

```tsx
import { Row, Stack, Text } from '@library/ui';
import type { SummaryLine } from './useOrderSummary';

type OrderSummaryViewProps = { lines: ReadonlyArray<SummaryLine> };

export function OrderSummaryView({ lines }: OrderSummaryViewProps) {
  const total = lines.reduce((sum, line) => sum + line.amount, 0);

  return (
    <Stack>
      {lines.map((line) => (
        <Row key={line.label}>
          <Text>{line.label}</Text>
          <Text>{line.amount.toFixed(2)}</Text>
        </Row>
      ))}
      <Text>{`Total ${total.toFixed(2)}`}</Text>
    </Stack>
  );
}
```

`src/features/order-summary/OrderSummaryPage.tsx`

```tsx
import { OrderSummaryView } from './OrderSummaryView';
import { useOrderSummary } from './useOrderSummary';

export function OrderSummaryPage() {
  return <OrderSummaryView {...useOrderSummary()} />;
}
```

`src/features/order-summary/index.ts`

```ts
export { OrderSummaryPage as Page } from './OrderSummaryPage';
export { OrderSummaryView as View } from './OrderSummaryView';
export { useOrderSummary as useSummary } from './useOrderSummary';
```

`src/app/routes/GiftCheckoutRoute.tsx`

```tsx
import * as GiftWrapping from '@features/gift-wrapping';
import * as OrderSummary from '@features/order-summary';

export function GiftCheckoutRoute() {
  const summary = OrderSummary.useSummary();
  const giftWrapLine = GiftWrapping.useSummaryLine();

  return (
    <OrderSummary.View lines={giftWrapLine ? [...summary.lines, giftWrapLine] : summary.lines} />
  );
}
```

The seam leaves Order summary's own page unchanged. Gift wrapping owns when the line appears and its amount, returned in the same `{ label, amount }` shape without importing Order summary; `app/` combines the two on the gift checkout route.

When the requested variation would change the modified feature's own logic or observable behavior, it is not a seam: ask before proceeding.
