# Application-wide analytics

A fictional store measures commerce with GA4 and a second provider whose event names and checkpoints differ. Measurement spans several areas, so the event contracts live in `core/` and each provider integration is its own top-level feature. The generic bus is the one in [Local analytics](analytics-local.md).

## Measurement specification

| Application event | Emission point | GA4 event | Second provider | Data timing |
| --- | --- | --- | --- | --- |
| `checkoutStarted` | Checkout has opened | `begin_checkout` | `checkout_started` | Current cart when the handler runs |
| `purchaseCompleted` | The order is confirmed | `purchase` | `order_completed` | Order snapshot carried by the event |

A purchase is completed when the order is confirmed, not when the confirmation page opens. The second provider's names are fictional.

## Folders

```text
src/
  core/activity/                       application event contracts and bus
  core/cart/                           cart reader
  features/checkout/                   emits checkoutStarted and purchaseCompleted
  features/ga4-commerce/               GA4 mapping and registration
  features/second-provider-commerce/   second provider mapping and registration
  library/activity/                    generic event bus
  library/analytics/                   provider transport adapters
  app/startAnalytics.ts
```

## Contracts in core

`src/core/activity/index.ts`

```ts
import { createEventBus } from '@library/activity';
import { logError } from '@library/logging';

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

export type ApplicationEvent =
  | { type: 'checkoutStarted'; cartId: string }
  | { type: 'purchaseCompleted'; order: OrderSnapshot }
  | { type: 'pageViewed'; page: string };

export const activity = createEventBus<ApplicationEvent>(logError);
```

`purchaseCompleted` carries a snapshot: by the time a handler runs, the cart has been cleared.

## Producer

`src/features/checkout/completePurchase.ts`

```ts
import { activity } from '@core/activity';
import { orders } from './orders';

export async function completePurchase(cartId: string) {
  const order = await orders.place(cartId);
  activity.publish({ type: 'purchaseCompleted', order });
  return order;
}
```

Checkout knows when its action succeeds, not which providers observe it.

## Provider features

GA4 enriches `checkoutStarted` with the current cart through Core coordination; the purchase data comes from the snapshot.

`src/features/ga4-commerce/startGa4Commerce.ts`

```ts
import { activity, type OrderItem } from '@core/activity';
import { readCart } from '@core/cart';
import type { AnalyticsTransport } from '@library/analytics';

function toGa4Item(item: OrderItem) {
  return {
    item_id: item.productId,
    item_name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function startGa4Commerce(send: AnalyticsTransport) {
  return activity.register(async (event) => {
    switch (event.type) {
      case 'checkoutStarted': {
        const cart = await readCart(event.cartId);
        return send('begin_checkout', {
          currency: cart.currency,
          value: cart.total,
          items: cart.items.map(toGa4Item),
        });
      }
      case 'purchaseCompleted':
        return send('purchase', {
          transaction_id: event.order.id,
          currency: event.order.currency,
          value: event.order.total,
          items: event.order.items.map(toGa4Item),
        });
    }
  });
}
```

`src/features/second-provider-commerce/startSecondProviderCommerce.ts`

```ts
import { activity } from '@core/activity';
import type { AnalyticsTransport } from '@library/analytics';

export function startSecondProviderCommerce(send: AnalyticsTransport) {
  return activity.register((event) => {
    switch (event.type) {
      case 'checkoutStarted':
        return send('checkout_started', { cart_id: event.cartId });
      case 'purchaseCompleted':
        return send('order_completed', {
          order_id: event.order.id,
          revenue: event.order.total,
          currency: event.order.currency,
        });
    }
  });
}
```

Each feature's entry exports its start function:

`src/features/ga4-commerce/index.ts`

```ts
export { startGa4Commerce as start } from './startGa4Commerce';
```

`src/features/second-provider-commerce/index.ts`

```ts
export { startSecondProviderCommerce as start } from './startSecondProviderCommerce';
```

Neither analytics feature imports the other. Each ignores events it does not measure; GA4 engagement, such as `pageViewed`, is a separate feature.

## Application wiring

`src/app/startAnalytics.ts`

```ts
import * as Ga4Commerce from '@features/ga4-commerce';
import * as SecondProviderCommerce from '@features/second-provider-commerce';
import { sendToGa4, sendToSecondProvider } from '@library/analytics';

export function startAnalytics() {
  const stopHandlers = [
    Ga4Commerce.start(sendToGa4),
    SecondProviderCommerce.start(sendToSecondProvider),
  ];
  return () => stopHandlers.forEach((stop) => stop());
}
```

`app/` also publishes navigation measurements, such as `activity.publish({ type: 'pageViewed', page: 'catalog' })`, where its navigation decides a page has opened.

Adding a third provider adds its feature, its transport adapter, and one line here. Producers change only if the new provider's specification needs a checkpoint or data the application events do not carry.

## Delivery choices

This bus is best effort: handlers run independently and a provider failure is logged, never surfaced to checkout. Queueing, retries, consent, offline retention, and draining at shutdown are runtime decisions for the measurement specification; GA4 `items` details and other required parameters follow the provider's documentation for the version in use.
