# Widget feature

**Loyalty status** is a self-contained widget. Its specification names no host, so whoever places it decides where it appears.

## Specification excerpt

**Loyalty status** shows a shopper's loyalty points and progress to the next tier.

1. The widget shows the points balance and the points still needed for the next tier.
2. WHEN shoppers press View rewards, open **Rewards**.

Criterion 2 is a Handoff.

## Folders

```text
src/features/loyalty-status/
  index.ts
  LoyaltyStatus.tsx
  useLoyaltyStatus.ts      # private
```

## Widget

`src/features/loyalty-status/LoyaltyStatus.tsx`

```tsx
import { Button, Card, Text } from '@library/ui';
import { useLoyaltyStatus } from './useLoyaltyStatus';

type LoyaltyStatusIntent = { type: 'openRewards' };

type LoyaltyStatusProps = {
  onIntent: (intent: LoyaltyStatusIntent) => void;
};

export function LoyaltyStatus({ onIntent }: LoyaltyStatusProps) {
  const { points, pointsToNextTier, nextTier } = useLoyaltyStatus();

  return (
    <Card>
      <Text>{`${points} points`}</Text>
      <Text>{`${pointsToNextTier} points to ${nextTier}`}</Text>
      <Button label="View rewards" onPress={() => onIntent({ type: 'openRewards' })} />
    </Card>
  );
}
```

## Public entry

`src/features/loyalty-status/index.ts`

```ts
export { LoyaltyStatus as Widget } from './LoyaltyStatus';
```

## Placement

`src/app/routes/CartRoute.tsx`

```tsx
import * as Cart from '@features/cart';
import * as LoyaltyStatus from '@features/loyalty-status';
import { useRouter } from '@library/navigation';
import { Stack } from '@library/ui';

export function CartRoute() {
  const router = useRouter();

  return (
    <Stack>
      <Cart.Page />
      <LoyaltyStatus.Widget
        onIntent={(intent) => {
          switch (intent.type) {
            case 'openRewards':
              return router.push('/rewards');
          }
        }}
      />
    </Stack>
  );
}
```

A host whose specification places the widget at one of its anchors receives it through [Extension](extension.md) wiring in `app/`.
