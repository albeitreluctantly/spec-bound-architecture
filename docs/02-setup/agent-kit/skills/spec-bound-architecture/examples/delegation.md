# Delegation

A feature emits a semantic intent; `app/` fulfills it. The same intent can be fulfilled by navigation, by presenting another feature in place, or by invoking a capability. Navigation is shown in [Screen feature](screen-feature.md); this example covers a result returned to the caller and a prerequisite with a continuation.

## Returning a result

**Checkout** lets shoppers choose a delivery address from their **Address book**: "WHEN shoppers press Change address, open the Address book; WHEN they pick an address, use it for delivery." The address book is presented over checkout and hands its result back.

The address type is shared domain code both features use.

`src/core/addresses/index.ts`

```ts
export type Address = {
  id: string;
  recipient: string;
  line: string;
  city: string;
};
```

Checkout requests a capability and says what to do with the result:

`src/features/checkout/Checkout.tsx`

```tsx
import { useState } from 'react';
import type { Address } from '@core/addresses';
import { Button, Text } from '@library/ui';

type CheckoutIntent = {
  type: 'pickAddress';
  onPicked: (address: Address) => void;
};

type CheckoutProps = {
  onIntent: (intent: CheckoutIntent) => void;
};

export function Checkout({ onIntent }: CheckoutProps) {
  const [address, setAddress] = useState<Address | null>(null);

  return (
    <>
      <Text>{address ? `${address.recipient}, ${address.line}` : 'No address selected'}</Text>
      <Button
        label="Change address"
        onPress={() => onIntent({ type: 'pickAddress', onPicked: setAddress })}
      />
    </>
  );
}
```

The address book exposes an imperative handle for presentation in place:

`src/features/address-book/AddressBookDialog.tsx`

```tsx
import { useImperativeHandle, useState, type Ref } from 'react';
import type { Address } from '@core/addresses';
import { Dialog } from '@library/ui';
import { AddressList } from './AddressList';

export type AddressBookHandle = {
  open: (onPicked: (address: Address) => void) => void;
};

type AddressBookDialogProps = { ref: Ref<AddressBookHandle> };

export function AddressBookDialog({ ref }: AddressBookDialogProps) {
  const [onPicked, setOnPicked] = useState<((address: Address) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    open: (pickedCallback) => setOnPicked(() => pickedCallback),
  }));

  return (
    <Dialog visible={onPicked !== null} onDismiss={() => setOnPicked(null)}>
      <AddressList
        onSelect={(address) => {
          onPicked?.(address);
          setOnPicked(null);
        }}
      />
    </Dialog>
  );
}
```

`app/` connects them on the checkout screen:

`src/app/routes/CheckoutRoute.tsx`

```tsx
import { useRef } from 'react';
import * as AddressBook from '@features/address-book';
import * as Checkout from '@features/checkout';

export function CheckoutRoute() {
  const addressBook = useRef<AddressBook.Handle>(null);

  return (
    <>
      <Checkout.Page
        onIntent={(intent) => {
          switch (intent.type) {
            case 'pickAddress':
              return addressBook.current?.open(intent.onPicked);
          }
        }}
      />
      <AddressBook.Dialog ref={addressBook} />
    </>
  );
}
```

`src/features/address-book/index.ts`

```ts
export { AddressBookDialog as Dialog, type AddressBookHandle as Handle } from './AddressBookDialog';
```

`src/features/checkout/index.ts`

```ts
export { Checkout as Page } from './Checkout';
```

Checkout never learns how the address book is shown. If the conventions present it as a route instead, only `app/` changes.

## Prerequisite with a continuation

**Wishlist** lets shoppers save products: "WHEN a signed-out shopper saves a product, ask them to sign in, then save the product." The feature owns the decision that saving requires sign-in and what happens afterward. `app/` owns how sign-in is presented.

Session state and the sign-in intent are shared mechanisms in `core/`. `createStore` is an illustrative state helper.

`src/core/session/index.ts`

```ts
import { createStore, useStore } from '@library/state';

export type SignInIntent = {
  type: 'requireSignIn';
  onSignedIn: () => void;
};

const sessionStore = createStore({ isSignedIn: false });

export function useSession() {
  return useStore(sessionStore);
}

export function markSignedIn() {
  sessionStore.set({ isSignedIn: true });
}
```

`src/features/wishlist/SaveToWishlistButton.tsx`

```tsx
import { useSession, type SignInIntent } from '@core/session';
import { Button } from '@library/ui';
import { saveToWishlist } from './wishlistRepository';

type SaveToWishlistButtonProps = {
  productId: string;
  onIntent: (intent: SignInIntent) => void;
};

export function SaveToWishlistButton({ productId, onIntent }: SaveToWishlistButtonProps) {
  const { isSignedIn } = useSession();
  const save = () => saveToWishlist(productId);

  return (
    <Button
      label="Save"
      onPress={() => (isSignedIn ? save() : onIntent({ type: 'requireSignIn', onSignedIn: save }))}
    />
  );
}
```

`app/` keeps the pending continuation and resumes it when the **Sign in** feature reports success. Sign in records the session through `core/session` before it emits `signedIn`.

`src/app/signIn.ts`

```ts
let pendingContinuation: (() => void) | null = null;

export function requestSignIn(onSignedIn: () => void, openSignIn: () => void) {
  pendingContinuation = onSignedIn;
  openSignIn();
}

export function resumeAfterSignIn() {
  pendingContinuation?.();
  pendingContinuation = null;
}
```

`src/app/routes/ProductRoute.tsx`

```tsx
import * as Wishlist from '@features/wishlist';
import { useRouter } from '@library/navigation';
import { requestSignIn } from '../signIn';

export function ProductRoute({ productId }: { productId: string }) {
  const router = useRouter();

  return (
    <Wishlist.SaveButton
      productId={productId}
      onIntent={(intent) => requestSignIn(intent.onSignedIn, () => router.push('/sign-in'))}
    />
  );
}
```

`src/app/routes/SignInRoute.tsx`

```tsx
import * as SignIn from '@features/sign-in';
import { useRouter } from '@library/navigation';
import { resumeAfterSignIn } from '../signIn';

export function SignInRoute() {
  const router = useRouter();

  return (
    <SignIn.Page
      onIntent={(intent) => {
        switch (intent.type) {
          case 'signedIn':
            router.back();
            return resumeAfterSignIn();
        }
      }}
    />
  );
}
```

`src/features/wishlist/index.ts`

```ts
export { SaveToWishlistButton as SaveButton } from './SaveToWishlistButton';
```

Tests of the wishlist assert both outcomes: signed in, saving happens immediately; signed out, the feature emits `requireSignIn` and saves when its continuation runs.
