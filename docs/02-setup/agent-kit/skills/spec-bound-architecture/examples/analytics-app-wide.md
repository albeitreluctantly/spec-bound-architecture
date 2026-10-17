# Application-wide analytics

Rung 3: a fictional store measures commerce with GA4 and Klaviyo, whose event names differ. Measurement spans several areas, so the application's events and their bus live in `core/analytics`, and each provider integration is its own top-level feature. `createEventBus` stands for the project's generic bus helper in `library/`; `ga4Service` and `klaviyoService` stand for provider services in `core/analytics`, built like the one in [Local analytics](analytics-local.md).

## Measurement specification

| Event               | Emission point         | GA4 event        | Klaviyo event      | Data             |
| ------------------- | ---------------------- | ---------------- | ------------------ | ---------------- |
| `checkoutStarted`   | Checkout has opened    | `begin_checkout` | `Started Checkout` | Current cart     |
| `purchaseCompleted` | The order is confirmed | `purchase`       | `Placed Order`     | The placed order |

Provider property names are illustrative; follow each provider's documentation.

## Folders

```text
src/
  library/modules/
    index.ts
    event-bus/                         generic event bus
  core/analytics/                      base event type, application events and bus, provider services
  core/cart/                           cart state
  features/checkout/                   emits checkoutStarted and purchaseCompleted
  features/ga4-commerce/               GA4 mapping
  features/klaviyo-commerce/           Klaviyo mapping
  app/bootstrap.ts
```

## Events in core

`src/core/analytics/events.ts`

```ts
import { createEventBus } from "@library/modules";
import type { AnalyticsEvent } from "./event";

export type OrderItem = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

export type OrderSnapshot = {
  id: string;
  currency: string;
  total: number;
  items: ReadonlyArray<OrderItem>;
};

type CheckoutStarted = AnalyticsEvent<"checkoutStarted", { cartId: string }>;
type PurchaseCompleted = AnalyticsEvent<
  "purchaseCompleted",
  { order: OrderSnapshot }
>;
type PageViewed = AnalyticsEvent<"pageViewed", { page: string }>;

export type ApplicationEvent = CheckoutStarted | PurchaseCompleted | PageViewed;

export const appEvents = createEventBus<ApplicationEvent>();
```

`src/core/analytics/index.ts`

```ts
export type { AnalyticsEvent } from "./event";
export {
  appEvents,
  type ApplicationEvent,
  type OrderItem,
  type OrderSnapshot,
} from "./events";
export { ga4Service, klaviyoService } from "./providers";
```

`purchaseCompleted` carries the order: by the time a handler runs, the cart has been cleared.

## Producer

`src/features/checkout/completePurchase.ts`

```ts
import { appEvents } from "@core/analytics";
import { orders } from "./orders";

export async function completePurchase(cartId: string) {
  const order = await orders.place(cartId);
  appEvents.emit({ type: "purchaseCompleted", order });
  return order;
}
```

## Provider features

Each feature handles every application event and ignores the ones it does not measure. GA4 enriches `checkoutStarted` with the current cart from `core/cart`. `cartState` stands for the cart's reactive state: an atom in Jotai or Effect, or a selector in Redux.

`src/features/ga4-commerce/initGa4Commerce.ts`

```ts
import { appEvents, ga4Service, type OrderItem } from "@core/analytics";
import { cartState } from "@core/cart";

function toGa4Item(item: OrderItem) {
  return {
    item_id: item.productId,
    item_name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function initGa4Commerce() {
  return appEvents.on((event) => {
    switch (event.type) {
      case "checkoutStarted": {
        const cart = cartState.get();
        return ga4Service.track("begin_checkout", {
          currency: cart.currency,
          value: cart.total,
          items: cart.items.map(toGa4Item),
        });
      }
      case "purchaseCompleted":
        return ga4Service.track("purchase", {
          transaction_id: event.order.id,
          currency: event.order.currency,
          value: event.order.total,
          items: event.order.items.map(toGa4Item),
        });
    }
  });
}
```

`src/features/klaviyo-commerce/initKlaviyoCommerce.ts`

```ts
import { appEvents, klaviyoService } from "@core/analytics";

export function initKlaviyoCommerce() {
  return appEvents.on((event) => {
    switch (event.type) {
      case "checkoutStarted":
        return klaviyoService.track("Started Checkout", {
          CartId: event.cartId,
        });
      case "purchaseCompleted":
        return klaviyoService.track("Placed Order", {
          OrderId: event.order.id,
          $value: event.order.total,
          Currency: event.order.currency,
        });
    }
  });
}
```

`src/features/ga4-commerce/index.ts`

```ts
export { initGa4Commerce as init } from "./initGa4Commerce";
```

`src/features/klaviyo-commerce/index.ts`

```ts
export { initKlaviyoCommerce as init } from "./initKlaviyoCommerce";
```

## Application bootstrap

`src/app/bootstrap.ts`

```ts
import * as Ga4Commerce from "@features/ga4-commerce";
import * as KlaviyoCommerce from "@features/klaviyo-commerce";

export function bootstrap() {
  const disposers = [Ga4Commerce.init(), KlaviyoCommerce.init()];
  return () => disposers.forEach((dispose) => dispose());
}
```

## Page views

Only navigation knows when a page has opened, so `app/` emits page views. `usePathname` stands for the project's navigation API.

`src/app/usePageViews.ts`

```ts
import { useEffect } from "react";
import { appEvents } from "@core/analytics";
import { usePathname } from "@library/navigation";

export function usePageViews() {
  const pathname = usePathname();

  useEffect(
    function emitPageViewed() {
      appEvents.emit({ type: "pageViewed", page: pathname });
    },
    [pathname],
  );
}
```

`src/app/_layout.tsx`

```tsx
import { Outlet } from "@library/navigation";
import { usePageViews } from "./usePageViews";

export default function RootLayout() {
  usePageViews();

  return <Outlet />;
}
```

## Analytics in areas

For measurement that only an area's specifications define, the area's analytics subfeature can add its events to the application events and handle them on the same bus, or keep a bus of the area's own, as in [Local analytics](analytics-local.md).
