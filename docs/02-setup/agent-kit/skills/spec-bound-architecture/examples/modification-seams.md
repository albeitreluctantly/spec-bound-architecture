# Modification seams

A seam lets an integrating feature or `app/` vary a feature's behavior without editing its logic. The seam is added to the modified feature's code when an integration needs it; that feature's specification does not change, because its default behavior stays the same. Each seam below serves a different kind of variation.

## Strategy

**Gift guide** specifies: "The gift guide shows Browse products limited to gift-eligible products." Browse products gets a filtering seam. The eligibility policy belongs to Gift guide. The catalog's `Product` carries a `price` and `tags`.

`src/features/catalog/browse-products/BrowseProducts.tsx`

```tsx
import type { Product } from "../shared";
import { ProductList } from "./ProductList";
import { useProducts } from "./useProducts";

type BrowseProductsProps = {
  productVisibilityPolicy?: (product: Product) => boolean;
};

export function BrowseProducts({
  productVisibilityPolicy,
}: BrowseProductsProps) {
  const products = useProducts();
  const visibleProducts = productVisibilityPolicy
    ? products.filter(productVisibilityPolicy)
    : products;

  return <ProductList products={visibleProducts} />;
}
```

Without a policy, Browse products behaves exactly as its specification describes.

`src/features/gift-guide/giftEligibilityPolicy.ts`

```ts
type GiftCandidate = { price: number; tags: ReadonlyArray<string> };

const MAX_GIFT_PRICE = 150;

export function giftEligibilityPolicy(product: GiftCandidate) {
  return product.tags.includes("giftable") && product.price <= MAX_GIFT_PRICE;
}
```

`src/features/gift-guide/index.ts`

```ts
export { giftEligibilityPolicy } from "./giftEligibilityPolicy";
```

`app/` connects the seam to the policy on the gift guide route:

`src/app/routes/GiftGuideRoute.tsx`

```tsx
import { BrowseProducts } from "@features/catalog";
import * as GiftGuide from "@features/gift-guide";

export function GiftGuideRoute() {
  return (
    <BrowseProducts.Page
      productVisibilityPolicy={GiftGuide.giftEligibilityPolicy}
    />
  );
}
```

A comparator or a handler that replaces a default action follows the same shape: an optional, typed function with the default behavior when absent.

## Service binding

**Pickup points** specifies: "In checkout, the store locator lists pickup points: stores and parcel lockers." Store locator looks up nearby locations deep inside its hooks, so it gets a service seam: its page takes an optional service and provides it to those hooks through a private context, using its own store lookup when none is passed. The service interface is in `core/`, and each feature implements it next to its own data.

`src/core/storeLocationService.ts`

```ts
export type StoreLocation = { id: string; name: string; address: string };

export interface StoreLocationService {
  findNear(address: string): Promise<ReadonlyArray<StoreLocation>>;
}
```

`src/features/store-locator/nearbyStoreService.ts`

```ts
import type {
  StoreLocation,
  StoreLocationService,
} from "@core/storeLocationService";

class NearbyStoreService implements StoreLocationService {
  async findNear(address: string): Promise<ReadonlyArray<StoreLocation>> {
    const response = await fetch(
      `/api/stores?near=${encodeURIComponent(address)}`,
    );
    return response.json();
  }
}

export const nearbyStoreService = new NearbyStoreService();
```

`src/features/store-locator/StoreLocationServiceContext.ts`

```ts
import { createContext } from "react";
import type { StoreLocationService } from "@core/storeLocationService";
import { nearbyStoreService } from "./nearbyStoreService";

export const StoreLocationServiceContext =
  createContext<StoreLocationService>(nearbyStoreService);
```

`src/features/store-locator/StoreLocator.tsx`

```tsx
import type { StoreLocationService } from "@core/storeLocationService";
import { nearbyStoreService } from "./nearbyStoreService";
import { StoreLocationServiceContext } from "./StoreLocationServiceContext";
import { StoreSearch } from "./StoreSearch";

type StoreLocatorProps = { locationService?: StoreLocationService };

export function StoreLocator({
  locationService = nearbyStoreService,
}: StoreLocatorProps) {
  return (
    <StoreLocationServiceContext.Provider value={locationService}>
      <StoreSearch />
    </StoreLocationServiceContext.Provider>
  );
}
```

Store locator's search hook reads the service with `use(StoreLocationServiceContext)`. Without a `locationService`, it lists stores, as its specification describes.

`src/features/store-locator/index.ts`

```ts
export { StoreLocator as Page } from "./StoreLocator";
```

`src/features/pickup-points/pickupPointService.ts`

```ts
import type {
  StoreLocation,
  StoreLocationService,
} from "@core/storeLocationService";

class PickupPointService implements StoreLocationService {
  async findNear(address: string): Promise<ReadonlyArray<StoreLocation>> {
    const response = await fetch(
      `/api/pickup-points?near=${encodeURIComponent(address)}`,
    );
    return response.json();
  }
}

export const pickupPointService = new PickupPointService();
```

`src/features/pickup-points/index.ts`

```ts
export { pickupPointService } from "./pickupPointService";
```

Outside checkout, `app/` mounts Store locator as it is:

`src/app/routes/StoreLocatorRoute.tsx`

```tsx
import * as StoreLocator from "@features/store-locator";

export function StoreLocatorRoute() {
  return <StoreLocator.Page />;
}
```

On the checkout route, it swaps in Pickup points' service:

`src/app/routes/CheckoutPickupRoute.tsx`

```tsx
import * as PickupPoints from "@features/pickup-points";
import * as StoreLocator from "@features/store-locator";

export function CheckoutPickupRoute() {
  return (
    <StoreLocator.Page locationService={PickupPoints.pickupPointService} />
  );
}
```

Pickup points owns which pickup points appear and where they come from; Store locator lists whatever its service returns.

## Separate logic and view

**Gift wrapping** specifies: "WHEN gift wrapping is selected, the order summary includes a gift wrap line."
**Order summary** exposes a supported logic slice and its view, so the composition can render the view with an added line.

`src/features/order-summary/useOrderSummary.ts`

```ts
import { useCart } from "@core/cart";

export function useOrderSummary() {
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
import { Row, Stack, Text } from "@library/ui";

type SummaryLine = { label: string; amount: number };

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
import { OrderSummaryView } from "./OrderSummaryView";
import { useOrderSummary } from "./useOrderSummary";

export function OrderSummaryPage() {
  return <OrderSummaryView {...useOrderSummary()} />;
}
```

`src/features/order-summary/index.ts`

```ts
export { OrderSummaryPage as Page } from "./OrderSummaryPage";
export { OrderSummaryView as View } from "./OrderSummaryView";
export { useOrderSummary as useSummary } from "./useOrderSummary";
```

`src/app/routes/GiftCheckoutRoute.tsx`

```tsx
import * as GiftWrapping from "@features/gift-wrapping";
import * as OrderSummary from "@features/order-summary";

export function GiftCheckoutRoute() {
  const summary = OrderSummary.useSummary();
  const giftWrapLine = GiftWrapping.useSummaryLine();

  return (
    <OrderSummary.View
      lines={giftWrapLine ? [...summary.lines, giftWrapLine] : summary.lines}
    />
  );
}
```

The seam leaves Order summary's own page unchanged. Gift wrapping owns when the line appears and its amount, returned in the same `{ label, amount }` shape without importing Order summary; `app/` combines the two on the gift checkout route.

When the requested variation would change the modified feature's own logic or observable behavior, it is not a seam: ask before proceeding.
