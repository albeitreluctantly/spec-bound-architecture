# Local analytics

Rung 2: a fictional vehicle catalog has **Browse vehicles**, **Vehicle bookmarks**, and **Vehicle analytics** specifications under one parent, so measurement is an analytics subfeature of that area with its own event bus. `createEventBus` stands for the project's generic bus helper in `library/`, and `@platform/amplitude` for the provider SDK.

## Measurement specification

| Trigger                         | Provider event       | Data       |
| ------------------------------- | -------------------- | ---------- |
| Opening a vehicle from the list | `Vehicle Opened`     | Vehicle ID |
| Bookmarking a vehicle succeeds  | `Vehicle Bookmarked` | Vehicle ID |

## Folders

```text
src/
  library/modules/
    index.ts
    event-bus/               generic event bus
  core/analytics/            base event type and provider services
  features/vehicles/
    index.ts
    shared/
      index.ts
      events.ts              vehicle event types and the area's bus
    browse-vehicles/         emits vehicleOpened
    vehicle-bookmarks/       emits vehicleBookmarked
    analytics/               provider mapping
  app/bootstrap.ts
```

## Provider service in core

`src/core/analytics/event.ts`

```ts
export type AnalyticsEvent<
  Name extends string,
  Payload extends Record<string, unknown> = Record<string, unknown>,
> = { type: Name } & Payload;
```

`src/core/analytics/amplitudeService.ts`

```ts
import * as amplitude from "@platform/amplitude";
import { readSession } from "../session";

class AmplitudeService {
  track(name: string, properties: Readonly<Record<string, unknown>>) {
    return amplitude.track(name, {
      ...properties,
      user_id: readSession().userId,
    });
  }
}

export const amplitudeService = new AmplitudeService();
```

`src/core/analytics/index.ts`

```ts
export type { AnalyticsEvent } from "./event";
export { amplitudeService } from "./amplitudeService";
```

## Events in the parent's shared code

`src/features/vehicles/shared/events.ts`

```ts
import type { AnalyticsEvent } from "@core/analytics";
import { createEventBus } from "@library/modules";

type VehicleOpened = AnalyticsEvent<"vehicleOpened", { vehicleId: string }>;
type VehicleBookmarked = AnalyticsEvent<
  "vehicleBookmarked",
  { vehicleId: string }
>;

export type VehicleEvent = VehicleOpened | VehicleBookmarked;

export const vehicleEvents = createEventBus<VehicleEvent>();
```

`src/features/vehicles/shared/index.ts`

```ts
export { vehicleEvents, type VehicleEvent } from "./events";
```

## Emission in product features

`src/features/vehicles/browse-vehicles/BrowseVehicles.tsx`

```tsx
import { Stack } from "@library/ui";
import { vehicleEvents } from "../shared";
import { VehicleCard } from "./VehicleCard";
import { useVehicles } from "./useVehicles";

type BrowseVehiclesIntent = { type: "openVehicle"; vehicleId: string };

type BrowseVehiclesProps = {
  onIntent: (intent: BrowseVehiclesIntent) => void;
};

export function BrowseVehicles({ onIntent }: BrowseVehiclesProps) {
  const vehicles = useVehicles();

  return (
    <Stack>
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onPress={() => {
            vehicleEvents.emit({
              type: "vehicleOpened",
              vehicleId: vehicle.id,
            });
            onIntent({ type: "openVehicle", vehicleId: vehicle.id });
          }}
        />
      ))}
    </Stack>
  );
}
```

`src/features/vehicles/vehicle-bookmarks/bookmarkVehicle.ts`

```ts
import { vehicleEvents } from "../shared";
import { bookmarkService } from "./bookmarkService";

export async function bookmarkVehicle(vehicleId: string) {
  await bookmarkService.add(vehicleId);
  vehicleEvents.emit({ type: "vehicleBookmarked", vehicleId });
}
```

## Analytics subfeature

`src/features/vehicles/analytics/initVehicleAnalytics.ts`

```ts
import { amplitudeService } from "@core/analytics";
import { vehicleEvents } from "../shared";

export function initVehicleAnalytics() {
  return vehicleEvents.on((event) => {
    switch (event.type) {
      case "vehicleOpened":
        return amplitudeService.track("Vehicle Opened", {
          vehicle_id: event.vehicleId,
        });
      case "vehicleBookmarked":
        return amplitudeService.track("Vehicle Bookmarked", {
          vehicle_id: event.vehicleId,
        });
    }
  });
}
```

`src/features/vehicles/analytics/index.ts`

```ts
export { initVehicleAnalytics as init } from "./initVehicleAnalytics";
```

`src/features/vehicles/index.ts`

```ts
export * as Analytics from "./analytics";
export * as BrowseVehicles from "./browse-vehicles";
export * as VehicleBookmarks from "./vehicle-bookmarks";
```

## Application bootstrap

`src/app/bootstrap.ts`

```ts
import { Analytics as VehicleAnalytics } from "@features/vehicles";

export function bootstrap() {
  const disposers = [VehicleAnalytics.init()];
  return () => disposers.forEach((dispose) => dispose());
}
```

`app/` runs `bootstrap` once at startup and its returned function at teardown, so measurement outlives any vehicle screen.
