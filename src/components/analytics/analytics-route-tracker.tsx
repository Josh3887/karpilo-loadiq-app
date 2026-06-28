"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  ANALYTICS_EVENTS,
  type AnalyticsEventName,
  type AnalyticsScaffoldKey,
  getDeviceType,
  trackAnalyticsEvent,
} from "@/lib/analytics";

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackedKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!pathname) return;

    const route = pathname;
    const device_type = getDeviceType();
    const trackOnce = (key: string, callback: () => void) => {
      if (trackedKeys.current.has(key)) return;

      trackedKeys.current.add(key);
      callback();
    };
    const trackRouteEvent = (event: AnalyticsEventName, eventRoute: string) => {
      trackOnce(`${event}:${eventRoute}`, () =>
        trackAnalyticsEvent(event, {
          route: eventRoute,
          device_type: getDeviceType(),
        })
      );
    };
    const trackScaffoldEvent = (
      event: AnalyticsEventName,
      eventRoute: string,
      scaffold_key: AnalyticsScaffoldKey
    ) => {
      trackOnce(`${event}:${eventRoute}:${scaffold_key}`, () =>
        trackAnalyticsEvent(event, {
          route: eventRoute,
          device_type: getDeviceType(),
          scaffold_key,
          scaffold_status: "not_built",
        })
      );
    };

    trackOnce("app_loaded", () =>
      trackAnalyticsEvent(ANALYTICS_EVENTS.APP_LOADED, {
        device_type,
        route,
      })
    );

    if (matchesAny(route, ["/portal/settings", "/dashboard/settings"])) {
      trackRouteEvent(ANALYTICS_EVENTS.SETTINGS_VIEWED, route);
    }

    if (
      matchesAny(route, [
        "/portal/billing",
        "/dashboard/billing",
        "/dashboard/settings/billing",
      ])
    ) {
      trackRouteEvent(ANALYTICS_EVENTS.BILLING_VIEWED, route);
    }

    if (
      matchesAny(route, [
        "/portal/fit-check",
        "/dashboard/intake/fitcheck",
        "/dashboard/settings/fitcheck",
        "/app/intake/fitcheck",
      ])
    ) {
      trackRouteEvent(ANALYTICS_EVENTS.FIT_CHECK_STARTED, route);
    }

    if (route === "/dashboard") {
      trackRouteEvent(ANALYTICS_EVENTS.CALCULATOR_STARTED, route);
    }

    if (route.startsWith("/admin")) {
      trackRouteEvent(ANALYTICS_EVENTS.ADMIN_ACCESSED, route);
    }

    if (route === "/admin/posthog") {
      trackRouteEvent(ANALYTICS_EVENTS.ADMIN_DEVELOPER_TOOLS_VIEWED, route);
      trackRouteEvent(ANALYTICS_EVENTS.POSTHOG_STATUS_VIEWED, route);
    }

    if (route.includes("/ai") || route.includes("/atlas")) {
      trackScaffoldEvent(ANALYTICS_EVENTS.AI_SCAFFOLD_VIEWED, route, "ai");
    }

    if (route.includes("/maps") || route.includes("/map")) {
      trackScaffoldEvent(ANALYTICS_EVENTS.MAPS_SCAFFOLD_VIEWED, route, "maps");
    }

    if (route.includes("/mileage")) {
      trackScaffoldEvent(
        ANALYTICS_EVENTS.MILEAGE_SCAFFOLD_VIEWED,
        route,
        "mileage"
      );
    }

    if (
      route === "/dashboard/billing" &&
      searchParams.get("checkout") === "success"
    ) {
      trackRouteEvent(ANALYTICS_EVENTS.CHECKOUT_COMPLETED, route);
    }
  }, [pathname, searchParams]);

  return null;
}

function matchesAny(route: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => route === prefix || route.startsWith(`${prefix}/`)
  );
}
