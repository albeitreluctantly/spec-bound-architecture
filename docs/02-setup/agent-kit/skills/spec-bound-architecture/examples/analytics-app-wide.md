# Application-wide analytics

A fictional store measures commerce with GA4 and a second provider whose event names and checkpoints differ. Measurement spans several areas, so the event contracts live in `core/` and each provider integration is its own top-level feature. `createEventBus`, `sendToGa4`, and `sendToSecondProvider` stand for the project's analytics infrastructure in `library/analytics`.

## Measurement specification

| Application event | Emission point | GA4 event | Second provider | Data |
| --- | --- | --- | --- | --- |
| `checkoutStarted` | Checkout has opened | `begin_checkout` | `checkout_started` | Current cart |
| `purchaseCompleted` | The order is confirmed | `purchase` | `order_completed` | The placed order |

The second provider's names are fictional.

## Folders

```text
src/
  core/events/                         application event contracts and bus
  core/cart/                           cart reader
  features/checkout/                   emits checkoutStarted and purchaseCompleted
  features/ga4-commerce/               GA4 mapping and registration
  features/second-provider-commerce/   second provider mapping and registration
  library/analytics/                   event bus and provider transports
  app/bootstrap.ts
```

## Contracts in core

`src/core/events/index.ts`

```ts
import { createEventBus } from '@library/analytics';

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

export const appEvents = createEventBus<ApplicationEvent>();
```

`purchaseCompleted` carries the order: by the time a handler runs, the cart has been cleared.

## Producer

`src/features/checkout/completePurchase.ts`

```ts
import { appEvents } from '@core/events';
import { orders } from './orders';

export async function completePurchase(cartId: string) {
  const order = await orders.place(cartId);
  appEvents.emit({ type: 'purchaseCompleted', order });
  return order;
}
```

## Provider features

GA4 enriches `checkoutStarted` with the current cart from `core/cart`.

`src/features/ga4-commerce/initGa4Commerce.ts`

```ts
import { appEvents, type OrderItem } from '@core/events';
import { readCart } from '@core/cart';
import { sendToGa4 } from '@library/analytics';

function toGa4Item(item: OrderItem) {
  return {
    item_id: item.productId,
    item_name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}

export function initGa4Commerce() {
  return appEvents.on(async (event) => {
    switch (event.type) {
      case 'checkoutStarted': {
        const cart = await readCart(event.cartId);
        return sendToGa4('begin_checkout', {
          currency: cart.currency,
          value: cart.total,
          items: cart.items.map(toGa4Item),
        });
      }
      case 'purchaseCompleted':
        return sendToGa4('purchase', {
          transaction_id: event.order.id,
          currency: event.order.currency,
          value: event.order.total,
          items: event.order.items.map(toGa4Item),
        });
    }
  });
}
```

`src/features/second-provider-commerce/initSecondProviderCommerce.ts`

```ts
import { appEvents } from '@core/events';
import { sendToSecondProvider } from '@library/analytics';

export function initSecondProviderCommerce() {
  return appEvents.on((event) => {
    switch (event.type) {
      case 'checkoutStarted':
        return sendToSecondProvider('checkout_started', { cart_id: event.cartId });
      case 'purchaseCompleted':
        return sendToSecondProvider('order_completed', {
          order_id: event.order.id,
          revenue: event.order.total,
          currency: event.order.currency,
        });
    }
  });
}
```

`src/features/ga4-commerce/index.ts`

```ts
export { initGa4Commerce as init } from './initGa4Commerce';
```

`src/features/second-provider-commerce/index.ts`

```ts
export { initSecondProviderCommerce as init } from './initSecondProviderCommerce';
```

GA4 engagement, such as `pageViewed`, is a separate feature.

## Application bootstrap

`src/app/bootstrap.ts`

```ts
import * as Ga4Commerce from '@features/ga4-commerce';
import * as SecondProviderCommerce from '@features/second-provider-commerce';

export function bootstrap() {
  const disposers = [Ga4Commerce.init(), SecondProviderCommerce.init()];
  return () => disposers.forEach((dispose) => dispose());
}
```

`app/` also emits navigation measurements, such as `appEvents.emit({ type: 'pageViewed', page: 'catalog' })`, where its navigation decides a page has opened.

Adding a third provider adds its feature, its transport in `library/analytics`, and one step here. Producers change only if the new provider's specification needs a checkpoint or data the application events do not carry.
