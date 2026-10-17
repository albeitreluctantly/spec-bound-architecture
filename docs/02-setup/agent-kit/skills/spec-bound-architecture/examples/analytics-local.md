# Local analytics

A fictional vehicle catalog has **Browse vehicles**, **Vehicle details**, **Saved vehicles**, and **Vehicle analytics** specifications under one parent. Measurement follows that area's specifications, so it is an area-local analytics subfeature with one provider. `createEventBus` and `sendToAmplitude` stand for the project's analytics infrastructure in `library/analytics`.

## Measurement specification

| Trigger | Application event | Provider event | Data |
| --- | --- | --- | --- |
| Vehicle details have loaded | `vehicleViewed` | `Vehicle Viewed` | Vehicle ID |
| Saving a vehicle succeeds | `vehicleSaved` | `Vehicle Saved` | Vehicle ID |

## Folders

```text
src/
  library/analytics/         event bus and provider transports
  features/vehicles/
    index.ts
    shared/
      index.ts
      events.ts              vehicle event contracts and the area's bus
    browse-vehicles/
    vehicle-details/         emits vehicleViewed
    saved-vehicles/          emits vehicleSaved
    analytics/               provider mapping and handler registration
  app/bootstrap.ts           runs the startup steps features export
```

## Contracts in the parent's shared code

`src/features/vehicles/shared/events.ts`

```ts
import { createEventBus } from '@library/analytics';

export type VehicleEvent =
  | { type: 'vehicleViewed'; vehicleId: string }
  | { type: 'vehicleSaved'; vehicleId: string };

export const vehicleEvents = createEventBus<VehicleEvent>();
```

`src/features/vehicles/shared/index.ts`

```ts
export { vehicleEvents, type VehicleEvent } from './events';
```

## Emission in product features

`src/features/vehicles/saved-vehicles/saveVehicle.ts`

```ts
import { vehicleEvents } from '../shared';
import { savedVehicles } from './savedVehicles';

export async function saveVehicle(vehicleId: string) {
  await savedVehicles.add(vehicleId);
  vehicleEvents.emit({ type: 'vehicleSaved', vehicleId });
}
```

`src/features/vehicles/vehicle-details/useVehicleViewedEvent.ts`

```ts
import { useEffect } from 'react';
import { vehicleEvents } from '../shared';

export function useVehicleViewedEvent(loadedVehicleId: string | undefined) {
  useEffect(
    function emitVehicleViewed() {
      if (loadedVehicleId) {
        vehicleEvents.emit({ type: 'vehicleViewed', vehicleId: loadedVehicleId });
      }
    },
    [loadedVehicleId],
  );
}
```

## Analytics subfeature

`src/features/vehicles/analytics/toAmplitudeEvent.ts`

```ts
import type { VehicleEvent } from '../shared';

export function toAmplitudeEvent(event: VehicleEvent) {
  switch (event.type) {
    case 'vehicleViewed':
      return { name: 'Vehicle Viewed', properties: { vehicle_id: event.vehicleId } };
    case 'vehicleSaved':
      return { name: 'Vehicle Saved', properties: { vehicle_id: event.vehicleId } };
  }
}
```

`src/features/vehicles/analytics/initVehicleAnalytics.ts`

```ts
import { sendToAmplitude } from '@library/analytics';
import { vehicleEvents } from '../shared';
import { toAmplitudeEvent } from './toAmplitudeEvent';

export function initVehicleAnalytics() {
  return vehicleEvents.on((event) => {
    const { name, properties } = toAmplitudeEvent(event);
    return sendToAmplitude(name, properties);
  });
}
```

`src/features/vehicles/analytics/index.ts`

```ts
export { initVehicleAnalytics as init } from './initVehicleAnalytics';
```

`src/features/vehicles/index.ts`

```ts
export * as Analytics from './analytics';
export * as BrowseVehicles from './browse-vehicles';
export * as SavedVehicles from './saved-vehicles';
export * as VehicleDetails from './vehicle-details';
```

## Application bootstrap

`src/app/bootstrap.ts`

```ts
import { Analytics as VehicleAnalytics } from '@features/vehicles';

export function bootstrap() {
  const disposers = [VehicleAnalytics.init()];
  return () => disposers.forEach((dispose) => dispose());
}
```

`app/` runs `bootstrap` once at startup and its returned function at teardown, so measurement outlives any vehicle screen.
