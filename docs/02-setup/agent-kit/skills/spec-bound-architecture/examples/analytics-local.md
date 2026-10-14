# Local analytics

A fictional vehicle catalog has **Browse**, **Details**, **Saved vehicles**, and **Vehicle analytics** specifications under one parent. Measurement follows that area's specifications, so it is an area-local analytics subfeature with one provider.

## Measurement specification

| Trigger | Application event | Provider event | Data |
| --- | --- | --- | --- |
| Vehicle details have loaded | `vehicleViewed` | `Vehicle Viewed` | Vehicle ID |
| Saving a vehicle succeeds | `vehicleSaved` | `Vehicle Saved` | Vehicle ID |

Pressing a vehicle card is not a completed view; the event fires when the details have loaded.

## Folders

```text
src/
  library/activity/          generic event bus
  library/analytics/         provider transport adapters
  features/vehicles/
    index.ts
    shared/activity/         vehicle event contracts and the area's bus
    details/                 emits vehicleViewed
    saved/                   emits vehicleSaved
    analytics/               provider mapping and handler registration
  app/startAnalytics.ts      starts and stops measurement
```

## Generic bus

The bus runs each handler independently and never fails the publisher. A handler failure goes to the supplied reporter.

`src/library/activity/index.ts`

```ts
export type EventHandler<ActivityEvent> = (event: ActivityEvent) => void | Promise<void>;

export type EventBus<ActivityEvent> = {
  publish: (event: ActivityEvent) => void;
  register: (handler: EventHandler<ActivityEvent>) => () => void;
};

export function createEventBus<ActivityEvent>(
  reportHandlerFailure: (error: unknown) => void,
): EventBus<ActivityEvent> {
  const handlers = new Set<EventHandler<ActivityEvent>>();

  return {
    publish: (event) => {
      handlers.forEach((handler) => {
        Promise.resolve()
          .then(() => handler(event))
          .catch(reportHandlerFailure);
      });
    },
    register: (handler) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
}
```

`src/library/analytics/index.ts`

```ts
export type AnalyticsTransport = (
  eventName: string,
  properties: Readonly<Record<string, unknown>>,
) => Promise<void>;

export { sendToAmplitude } from './amplitudeTransport';
```

The transport adapter wraps the provider SDK and knows no product domain.

## Contracts in the parent's shared code

`src/features/vehicles/shared/activity/index.ts`

```ts
import { createEventBus } from '@library/activity';
import { logError } from '@library/logging';

export type VehicleEvent =
  | { type: 'vehicleViewed'; vehicleId: string }
  | { type: 'vehicleSaved'; vehicleId: string };

export const vehicleEvents = createEventBus<VehicleEvent>(logError);
```

Producers and the analytics subfeature share the contract without importing each other.

## Emission in product features

Each product feature emits at its own success condition. Emission is a supporting change: the feature's behavior is unchanged.

`src/features/vehicles/saved/saveVehicle.ts`

```ts
import { vehicleEvents } from '../shared/activity';
import { savedVehicles } from './savedVehicles';

export async function saveVehicle(vehicleId: string) {
  await savedVehicles.add(vehicleId);
  vehicleEvents.publish({ type: 'vehicleSaved', vehicleId });
}
```

`src/features/vehicles/details/useVehicleViewedEvent.ts`

```ts
import { useEffect } from 'react';
import { vehicleEvents } from '../shared/activity';

export function useVehicleViewedEvent(loadedVehicleId: string | undefined) {
  useEffect(
    function publishVehicleViewed() {
      if (loadedVehicleId) {
        vehicleEvents.publish({ type: 'vehicleViewed', vehicleId: loadedVehicleId });
      }
    },
    [loadedVehicleId],
  );
}
```

## Analytics subfeature

The mapping is a pure function the tests can check directly. Starting the handler registers it on the area's bus and returns the function that stops it.

`src/features/vehicles/analytics/toAmplitudeEvent.ts`

```ts
import type { VehicleEvent } from '../shared/activity';

export function toAmplitudeEvent(event: VehicleEvent) {
  switch (event.type) {
    case 'vehicleViewed':
      return { name: 'Vehicle Viewed', properties: { vehicle_id: event.vehicleId } };
    case 'vehicleSaved':
      return { name: 'Vehicle Saved', properties: { vehicle_id: event.vehicleId } };
  }
}
```

`src/features/vehicles/analytics/startVehicleAnalytics.ts`

```ts
import type { AnalyticsTransport } from '@library/analytics';
import { vehicleEvents } from '../shared/activity';
import { toAmplitudeEvent } from './toAmplitudeEvent';

export function startVehicleAnalytics(send: AnalyticsTransport) {
  return vehicleEvents.register((event) => {
    const { name, properties } = toAmplitudeEvent(event);
    return send(name, properties);
  });
}
```

`src/features/vehicles/analytics/index.ts`

```ts
export { startVehicleAnalytics as start } from './startVehicleAnalytics';
```

`src/features/vehicles/index.ts`

```ts
export * as Analytics from './analytics';
```

The parent entry also re-exports the Browse, Details, and Saved entries for application wiring.

## Application lifetime

`src/app/startAnalytics.ts`

```ts
import * as Vehicles from '@features/vehicles';
import { sendToAmplitude } from '@library/analytics';

export function startAnalytics() {
  return Vehicles.Analytics.start(sendToAmplitude);
}
```

`app/` calls `startAnalytics` at startup and the returned function at teardown, not when a vehicle screen unmounts. `app/` never imports the vehicles' `shared/`; the analytics subfeature registers itself through the parent's entry.
