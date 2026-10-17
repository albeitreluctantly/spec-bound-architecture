# Analytics callbacks

Rung 4: product features stay unaware of measurement. They report outcomes through callback props, and analytics connects where those callbacks are wired. `amplitudeService` and `ga4Service` stand for the provider services in `core/analytics`.

## Analytics in an area

**Vehicle bookmarks** reports a removed bookmark. The vehicles parent connects that callback to its analytics subfeature and exports the connected page, so the callback stays inside the area.

`src/features/vehicles/vehicle-bookmarks/VehicleBookmarks.tsx`

```tsx
import { Stack } from "@library/ui";
import { BookmarkCard } from "./BookmarkCard";
import { bookmarkService } from "./bookmarkService";
import { useBookmarkedVehicles } from "./useBookmarkedVehicles";

type VehicleBookmarksProps = {
  onBookmarkRemoved?: (vehicleId: string) => void;
};

export function VehicleBookmarks({ onBookmarkRemoved }: VehicleBookmarksProps) {
  const vehicles = useBookmarkedVehicles();

  return (
    <Stack>
      {vehicles.map((vehicle) => (
        <BookmarkCard
          key={vehicle.id}
          vehicle={vehicle}
          onRemove={async () => {
            await bookmarkService.remove(vehicle.id);
            onBookmarkRemoved?.(vehicle.id);
          }}
        />
      ))}
    </Stack>
  );
}
```

`src/features/vehicles/vehicle-bookmarks/index.ts`

```ts
export { VehicleBookmarks as Page } from "./VehicleBookmarks";
```

`src/features/vehicles/analytics/trackBookmarkRemoved.ts`

```ts
import { amplitudeService } from "@core/analytics";

export function trackBookmarkRemoved(vehicleId: string) {
  return amplitudeService.track("Bookmark Removed", { vehicle_id: vehicleId });
}
```

`src/features/vehicles/analytics/index.ts`

```ts
export { trackBookmarkRemoved } from "./trackBookmarkRemoved";
```

`src/features/vehicles/VehicleBookmarksPage.tsx`

```tsx
import type { ComponentProps } from "react";
import * as Analytics from "./analytics";
import * as VehicleBookmarks from "./vehicle-bookmarks";

type VehicleBookmarksPageProps = Omit<
  ComponentProps<typeof VehicleBookmarks.Page>,
  "onBookmarkRemoved"
>;

export function VehicleBookmarksPage(props: VehicleBookmarksPageProps) {
  return (
    <VehicleBookmarks.Page
      {...props}
      onBookmarkRemoved={Analytics.trackBookmarkRemoved}
    />
  );
}
```

`src/features/vehicles/index.ts`

```ts
export { VehicleBookmarksPage } from "./VehicleBookmarksPage";
```

## Top-level analytics

**Checkout** reports a completed purchase. `app/` connects it to a top-level analytics feature that declares the shape it needs.

`src/features/checkout/Checkout.tsx`

```tsx
import { Button } from "@library/ui";
import { orders, type Order } from "./orders";

type CheckoutProps = {
  cartId: string;
  onPurchaseCompleted?: (order: Order) => void;
};

export function Checkout({ cartId, onPurchaseCompleted }: CheckoutProps) {
  return (
    <Button
      label="Place order"
      onPress={async () => {
        const order = await orders.place(cartId);
        onPurchaseCompleted?.(order);
      }}
    />
  );
}
```

`src/features/checkout/index.ts`

```ts
export { Checkout as Page } from "./Checkout";
```

`src/features/commerce-analytics/trackPurchaseCompleted.ts`

```ts
import { ga4Service } from "@core/analytics";

type CompletedOrder = { id: string; currency: string; total: number };

export function trackPurchaseCompleted(order: CompletedOrder) {
  return ga4Service.track("purchase", {
    transaction_id: order.id,
    currency: order.currency,
    value: order.total,
  });
}
```

`src/features/commerce-analytics/index.ts`

```ts
export { trackPurchaseCompleted } from "./trackPurchaseCompleted";
```

`src/app/routes/CheckoutRoute.tsx`

```tsx
import * as Checkout from "@features/checkout";
import * as CommerceAnalytics from "@features/commerce-analytics";
import { useRouteParams } from "@library/navigation";

export function CheckoutRoute() {
  const { cartId } = useRouteParams<{ cartId: string }>();

  return (
    <Checkout.Page
      cartId={cartId}
      onPurchaseCompleted={CommerceAnalytics.trackPurchaseCompleted}
    />
  );
}
```

Every measured outcome becomes a callback in the product feature's props, connected once by its parent or by `app/`.
