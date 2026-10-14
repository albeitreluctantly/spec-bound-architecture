# Headless feature

Capabilities without UI, each with a different trigger. The routing is file-based. `@library/navigation`, `@platform/notifications`, `useCompletedOrderCount`, `useCartItemCount`, `useCartLastChangedAt`, and `requestStoreReview` stand for the project's own APIs.

## Referral redemption

1. WHEN the application opens a referral link, apply the referrer's discount to the cart, then open **Browse products**.
2. IF the referral code is unknown or expired, THEN open **Browse products** with an invalid-referral notice.

`src/features/referrals/redeemReferral.ts`

```ts
import { referralService } from "./referralService";

export type ReferralIntent = {
  type: "browseProducts";
  notice?: "invalidReferral";
};

export async function redeemReferral(code: string): Promise<ReferralIntent> {
  const isRedeemed = await referralService.redeem(code);
  return isRedeemed
    ? { type: "browseProducts" }
    : { type: "browseProducts", notice: "invalidReferral" };
}
```

`src/features/referrals/index.ts`

```ts
export { redeemReferral as redeem } from "./redeemReferral";
```

The router opens `/r/<code>` links at this route file and rewrites links that match no route before routing.

`src/app/r/[code].tsx`

```tsx
import { useEffect } from "react";
import * as Referrals from "@features/referrals";
import { useRouteParams, useRouter } from "@library/navigation";

export default function ReferralRoute() {
  const { code } = useRouteParams<{ code: string }>();
  const router = useRouter();

  useEffect(
    function redeemAndContinue() {
      Referrals.redeem(code).then((intent) =>
        router.replace(
          intent.notice ? `/catalog?notice=${intent.notice}` : "/catalog",
        ),
      );
    },
    [code, router],
  );

  return null;
}
```

## Review prompt

1. WHEN a shopper completes their third order, ask for an app store review.

`src/features/review-prompt/useReviewPrompt.ts`

```ts
import { useEffect, useRef } from "react";
import { useCompletedOrderCount } from "@core/orders";
import { requestStoreReview } from "./requestStoreReview";

const ORDERS_BEFORE_PROMPT = 3;

export function useReviewPrompt() {
  const completedOrderCount = useCompletedOrderCount();
  const previousCount = useRef(completedOrderCount);

  useEffect(
    function askOnceThresholdIsReached() {
      if (
        previousCount.current < ORDERS_BEFORE_PROMPT &&
        completedOrderCount >= ORDERS_BEFORE_PROMPT
      ) {
        requestStoreReview();
      }
      previousCount.current = completedOrderCount;
    },
    [completedOrderCount],
  );
}
```

`src/features/review-prompt/index.ts`

```ts
export { useReviewPrompt } from "./useReviewPrompt";
```

## Cart reminders

The **Cart** specification groups **Cart overview** and **Cart reminders**, so reminders are a subfeature of the cart.

1. WHEN items stay in an unchanged cart for 24 hours, remind the shopper with a notification.

`src/features/cart/reminders/cartReminder.ts`

```ts
import {
  cancelNotification,
  scheduleNotification,
} from "@platform/notifications";

const CART_REMINDER_ID = "cart-reminder";

export function cancelCartReminder() {
  return cancelNotification(CART_REMINDER_ID);
}

export async function scheduleCartReminder(at: Date) {
  await cancelCartReminder();
  await scheduleNotification({
    id: CART_REMINDER_ID,
    title: "Items are waiting in your cart",
    at,
  });
}
```

`src/features/cart/reminders/useCartReminders.ts`

```ts
import { useEffect } from "react";
import { useCartItemCount, useCartLastChangedAt } from "@core/cart";
import { cancelCartReminder, scheduleCartReminder } from "./cartReminder";

const REMINDER_DELAY_MS = 24 * 60 * 60 * 1000;

export function useCartReminders() {
  const hasItems = useCartItemCount() > 0;
  const lastChangedAt = useCartLastChangedAt();

  useEffect(
    function remindAfterLastChange() {
      if (hasItems)
        scheduleCartReminder(new Date(lastChangedAt + REMINDER_DELAY_MS));
      else cancelCartReminder();
    },
    [hasItems, lastChangedAt],
  );
}
```

`src/features/cart/reminders/index.ts`

```ts
export { useCartReminders } from "./useCartReminders";
```

`src/features/cart/index.ts`

```ts
export * as Overview from "./overview";
export * as Reminders from "./reminders";
```

## Root layout

`src/app/_layout.tsx`

```tsx
import { Reminders } from "@features/cart";
import { useReviewPrompt } from "@features/review-prompt";
import { Outlet } from "@library/navigation";

const { useCartReminders } = Reminders;

export default function RootLayout() {
  useReviewPrompt();
  useCartReminders();

  return <Outlet />;
}
```
