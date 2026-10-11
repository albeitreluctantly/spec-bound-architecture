# Core coordination

**Product details** adds products to the cart; **Cart badge** shows the item count in the header. Neither feature knows the other. Both read and write the same cart state through `core/cart`.

## Shared state

`createStore` and `useStore` stand for the project's state library.

`src/library/state/index.ts`

```ts
import { useSyncExternalStore } from 'react';

export type Store<State> = {
  read: () => State;
  set: (state: State) => void;
  subscribe: (listener: () => void) => () => void;
};

export function createStore<State>(initialState: State): Store<State> {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    read: () => state,
    set: (nextState) => {
      state = nextState;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function useStore<State>(store: Store<State>): State {
  return useSyncExternalStore(store.subscribe, store.read);
}
```

The cart module owns the state and its rules. Features change it only through these functions.

`src/core/cart/index.ts`

```ts
import { createStore, useStore } from '@library/state';

export type CartLine = { productId: string; unitPrice: number; quantity: number };
export type Cart = { lines: ReadonlyArray<CartLine> };

const cartStore = createStore<Cart>({ lines: [] });

export function useCart(): Cart {
  return useStore(cartStore);
}

export function readCart(): Cart {
  return cartStore.read();
}

export function addToCart(product: { id: string; price: number }) {
  const { lines } = cartStore.read();
  const existingLine = lines.find((line) => line.productId === product.id);
  cartStore.set({
    lines: existingLine
      ? lines.map((line) =>
          line === existingLine ? { ...line, quantity: line.quantity + 1 } : line,
        )
      : [...lines, { productId: product.id, unitPrice: product.price, quantity: 1 }],
  });
}

export function countCartItems(cart: Cart): number {
  return cart.lines.reduce((count, line) => count + line.quantity, 0);
}
```

## Consumers

`src/features/product-details/AddToCartButton.tsx`

```tsx
import { addToCart } from '@core/cart';
import { Button } from '@library/ui';

type AddToCartButtonProps = { product: { id: string; price: number } };

export function AddToCartButton({ product }: AddToCartButtonProps) {
  return <Button label="Add to cart" onPress={() => addToCart(product)} />;
}
```

`src/features/cart-badge/CartBadge.tsx`

```tsx
import { countCartItems, useCart } from '@core/cart';
import { Badge } from '@library/ui';

export function CartBadge() {
  return <Badge count={countCartItems(useCart())} />;
}
```

## Server state

For server-backed data, the shared module exposes a data hook keyed by a stable identity, such as a query key built from the cart ID. Every consumer addresses the same key; writes update or invalidate it, and all consumers refresh. Neither consumer constructs the key itself.

## Background state surfaced by the application

A `core/` module that saves in the background owns its status. `app/` shows application-level status without any feature knowing about the indicator.

`src/core/drafts/index.ts`

```ts
import { createStore, useStore } from '@library/state';

export type SaveStatus = 'saved' | 'saving' | 'failed';

const saveStatusStore = createStore<SaveStatus>('saved');

export function useSaveStatus(): SaveStatus {
  return useStore(saveStatusStore);
}

export async function saveDraft(write: () => Promise<void>) {
  saveStatusStore.set('saving');
  try {
    await write();
    saveStatusStore.set('saved');
  } catch {
    saveStatusStore.set('failed');
  }
}
```

`src/app/SaveIndicator.tsx`

```tsx
import { useSaveStatus } from '@core/drafts';
import { StatusDot } from '@library/ui';

export function SaveIndicator() {
  return <StatusDot status={useSaveStatus()} />;
}
```

Keep state inside a feature while one screen uses it, such as a form draft or a search input. Move it to `core/` when another top-level feature needs it beyond that screen.
