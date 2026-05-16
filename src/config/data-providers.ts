export type DataProviderStatus = "active" | "planned";

export type DataProviderCategory =
  | "fuel"
  | "safety"
  | "weather"
  | "mapping"
  | "telematics"
  | "tolling"
  | "market";

export type DataProvider = {
  id: string;
  name: string;
  shortName: string;
  category: DataProviderCategory;
  status: DataProviderStatus;
  attribution: string;
  description: string;
  disclaimer: string;
  href?: string;
};

export const EIA_OPEN_DATA_URL = "https://www.eia.gov/opendata/";

export const EIA_ATTRIBUTION_TEXT =
  "Fuel pricing data may include publicly available datasets provided by the U.S. Energy Information Administration (EIA).";

export const DATA_PROVIDER_DISCLOSURE =
  "External operational datasets are used for informational decision support only. Provider data can be delayed, revised, unavailable, or vary from real-world operating conditions.";

export const DATA_PROVIDERS: DataProvider[] = [
  {
    id: "eia",
    name: "U.S. Energy Information Administration",
    shortName: "EIA",
    category: "fuel",
    status: "active",
    href: EIA_OPEN_DATA_URL,
    attribution: EIA_ATTRIBUTION_TEXT,
    description:
      "Karpilo LoadIQ may use EIA Open Data as a weekly U.S. national diesel reference for estimated fuel inputs.",
    disclaimer:
      "EIA fuel data is an informational market reference only. It is not guaranteed to reflect real-time pump pricing, regional pricing, fleet card discounts, taxes, fees, or actual purchased fuel cost.",
  },
  {
    id: "fmcsa",
    name: "FMCSA operational datasets",
    shortName: "FMCSA",
    category: "safety",
    status: "planned",
    attribution: "Future safety and compliance datasets may reference FMCSA public resources.",
    description:
      "Future Karpilo LoadIQ intelligence may support public carrier, safety, or compliance context when appropriate.",
    disclaimer:
      "Future FMCSA-related features would be informational only and would not provide regulatory guarantees.",
  },
  {
    id: "weather",
    name: "Weather data providers",
    shortName: "Weather",
    category: "weather",
    status: "planned",
    attribution: "Future route intelligence may include third-party weather providers.",
    description:
      "Future weather signals may help drivers understand operating risk around a lane or trip window.",
    disclaimer:
      "Weather data can change quickly and would not guarantee road conditions, delays, or safety outcomes.",
  },
  {
    id: "mapping",
    name: "Mapping and routing providers",
    shortName: "Mapping",
    category: "mapping",
    status: "planned",
    attribution: "Future routing intelligence may include third-party mapping providers.",
    description:
      "Future routing inputs may support mileage, route, toll, and location intelligence.",
    disclaimer:
      "Routing data can vary by equipment, restrictions, detours, traffic, and local conditions.",
  },
  {
    id: "telematics",
    name: "Telematics providers",
    shortName: "Telematics",
    category: "telematics",
    status: "planned",
    attribution: "Future integrations may support user-authorized telematics sources.",
    description:
      "Future telematics integrations may help compare planned operating assumptions against actual vehicle activity.",
    disclaimer:
      "Telematics provider availability, precision, and permissions would depend on each connected service.",
  },
  {
    id: "tolling",
    name: "Tolling data providers",
    shortName: "Tolling",
    category: "tolling",
    status: "planned",
    attribution: "Future toll estimates may include third-party tolling datasets.",
    description:
      "Future tolling signals may help estimate lane-specific costs before accepting freight.",
    disclaimer:
      "Toll pricing may vary by equipment class, transponder, agency rules, time, route, and account status.",
  },
  {
    id: "market-analytics",
    name: "Freight market analytics providers",
    shortName: "Market Analytics",
    category: "market",
    status: "planned",
    attribution: "Future market intelligence may include third-party freight analytics providers.",
    description:
      "Future market context may help users understand lane pressure and pricing signals.",
    disclaimer:
      "Market signals would be informational only and would not guarantee freight availability, rates, or business outcomes.",
  },
];

export const ACTIVE_DATA_PROVIDERS = DATA_PROVIDERS.filter(
  (provider) => provider.status === "active",
);

export const PLANNED_DATA_PROVIDERS = DATA_PROVIDERS.filter(
  (provider) => provider.status === "planned",
);
