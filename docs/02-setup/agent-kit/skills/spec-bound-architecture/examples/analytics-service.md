# Analytics service

Rung 1: measurement has no specifications of its own, so analytics is one service in `core/` that features call directly. `@platform/amplitude` stands for the provider SDK.

`src/core/analytics/analyticsService.ts`

```ts
import * as amplitude from "@platform/amplitude";

type AnalyticsEvent<
  Name extends string,
  Payload extends Record<string, unknown> = Record<string, unknown>,
> = { type: Name } & Payload;

type VehicleBookmarked = AnalyticsEvent<"vehicleBookmarked", { vehicleId: string }>;
type PurchaseCompleted = AnalyticsEvent<
  "purchaseCompleted",
  { orderId: string; revenue: number }
>;

type ApplicationEvent = VehicleBookmarked | PurchaseCompleted;

class AnalyticsService {
  track(event: ApplicationEvent) {
    switch (event.type) {
      case "vehicleBookmarked":
        return amplitude.track("Vehicle Bookmarked", {
          vehicle_id: event.vehicleId,
        });
      case "purchaseCompleted":
        return amplitude.track("Order Completed", {
          order_id: event.orderId,
          revenue: event.revenue,
        });
    }
  }
}

export const analyticsService = new AnalyticsService();
```

`src/core/analytics/index.ts`

```ts
export { analyticsService } from "./analyticsService";
```

`src/features/vehicles/vehicle-bookmarks/bookmarkVehicle.ts`

```ts
import { analyticsService } from "@core/analytics";
import { bookmarkService } from "./bookmarkService";

export async function bookmarkVehicle(vehicleId: string) {
  await bookmarkService.add(vehicleId);
  analyticsService.track({ type: "vehicleBookmarked", vehicleId });
}
```
