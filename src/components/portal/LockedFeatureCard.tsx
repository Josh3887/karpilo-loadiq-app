"use client";

import { useEffect } from "react";
import { Lock } from "lucide-react";

import {
  ANALYTICS_EVENTS,
  type AnalyticsEventName,
  type AnalyticsScaffoldKey,
  trackAnalyticsEvent,
} from "@/lib/analytics";

const scaffoldEventByKey = {
  ai: ANALYTICS_EVENTS.AI_SCAFFOLD_VIEWED,
  maps: ANALYTICS_EVENTS.MAPS_SCAFFOLD_VIEWED,
  mileage: ANALYTICS_EVENTS.MILEAGE_SCAFFOLD_VIEWED,
} satisfies Record<AnalyticsScaffoldKey, AnalyticsEventName>;
const EMPTY_SCAFFOLD_KEYS: readonly AnalyticsScaffoldKey[] = [];

export function LockedFeatureCard({
  title,
  description,
  featureKey,
  scaffoldKeys = EMPTY_SCAFFOLD_KEYS,
}: {
  title: string;
  description: string;
  featureKey: string;
  scaffoldKeys?: readonly AnalyticsScaffoldKey[];
}) {
  useEffect(() => {
    void trackAnalyticsEvent(ANALYTICS_EVENTS.FEATURE_GATE_VIEWED, {
      route: "/portal",
      feature_key: featureKey,
    });

    scaffoldKeys.forEach((scaffoldKey) => {
      void trackAnalyticsEvent(scaffoldEventByKey[scaffoldKey], {
        route: "/portal",
        feature_key: featureKey,
        scaffold_key: scaffoldKey,
        scaffold_status: "not_built",
      });
    });
  }, [featureKey, scaffoldKeys]);

  function handleScaffoldClick() {
    void trackAnalyticsEvent(ANALYTICS_EVENTS.SCAFFOLD_CTA_CLICKED, {
      route: "/portal",
      feature_key: featureKey,
      scaffold_key: scaffoldKeys[0],
      scaffold_status: scaffoldKeys.length > 0 ? "not_built" : "locked",
    });
  }

  return (
    <article className="rounded-lg border border-white/10 bg-[#0B1220] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-100">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <Lock className="h-5 w-5 shrink-0 text-sky-300" />
      </div>
      <button
        type="button"
        onClick={handleScaffoldClick}
        className="mt-4 w-full rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2 text-left text-xs font-bold uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-500/15"
      >
        Coming soon / locked
      </button>
    </article>
  );
}
