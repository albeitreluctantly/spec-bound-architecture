# Composition-root distribution

On the pickup screen, shoppers choose a store with **Store picker**, and **Pickup slots** shows times for the chosen store. The selected store ID is screen-specific data, not a shared domain concept, so `app/` passes it from one feature to the other.

## Features

Store picker reports a selection through its SPI; it does not know who uses it.

`src/features/store-picker/StorePicker.tsx`

```tsx
import { Select } from '@library/ui';
import { useNearbyStores } from './useNearbyStores';

type StorePickerProps = {
  selectedStoreId: string | null;
  onSelect: (storeId: string) => void;
};

export function StorePicker({ selectedStoreId, onSelect }: StorePickerProps) {
  const stores = useNearbyStores();

  return (
    <Select
      options={stores.map((store) => ({ value: store.id, label: store.name }))}
      value={selectedStoreId}
      onChange={onSelect}
    />
  );
}
```

Pickup slots declares the input it needs:

`src/features/pickup-slots/PickupSlots.tsx`

```tsx
import { Text } from '@library/ui';
import { SlotList } from './SlotList';

type PickupSlotsProps = { storeId: string | null };

export function PickupSlots({ storeId }: PickupSlotsProps) {
  if (!storeId) return <Text>Choose a store to see pickup times</Text>;
  return <SlotList storeId={storeId} />;
}
```

`src/features/store-picker/index.ts`

```ts
export { StorePicker as Widget } from './StorePicker';
```

`src/features/pickup-slots/index.ts`

```ts
export { PickupSlots as Widget } from './PickupSlots';
```

## Composition

`src/app/routes/PickupRoute.tsx`

```tsx
import { useState } from 'react';
import * as PickupSlots from '@features/pickup-slots';
import * as StorePicker from '@features/store-picker';

export function PickupRoute() {
  const [storeId, setStoreId] = useState<string | null>(null);

  return (
    <>
      <StorePicker.Widget selectedStoreId={storeId} onSelect={setStoreId} />
      <PickupSlots.Widget storeId={storeId} />
    </>
  );
}
```

Neither feature imports the other; their contract meets at the route. If other features or screens need the selected store, it becomes shared state instead; see [Core coordination](core-coordination.md). If the specifications define the picker and slots as one combined experience, see [Mutual reference resolution](mutual-reference-resolution.md).
