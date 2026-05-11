import {
  EiaFuelDataPoint,
  normalizeEiaDieselPrice,
} from "@/services/fuel/fuel-normalizer";
import { NormalizedFuelPrice } from "@/types/fuel";

type EiaResponse = {
  response?: {
    data?: EiaFuelDataPoint[];
  };
};

const EIA_ULSD_PATH =
  "/petroleum/pri/gnd/data/?frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&facets[process][]=PTE&facets[duoarea][]=NUS&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=1";

export type EiaFuelFetchResult =
  | {
      fuel: NormalizedFuelPrice;
      failureReason: null;
    }
  | {
      fuel: null;
      failureReason: string;
    };

export async function fetchLatestEiaDieselPrice(): Promise<EiaFuelFetchResult> {
  const apiKey = process.env.EIA_API_KEY;

  if (!apiKey) {
    return {
      fuel: null,
      failureReason: "EIA_API_KEY is not configured.",
    };
  }

  const baseUrl = process.env.EIA_BASE_URL ?? "https://api.eia.gov/v2";
  const url = new URL(`${baseUrl}${EIA_ULSD_PATH}`);
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return {
      fuel: null,
      failureReason: `EIA returned HTTP ${response.status}.`,
    };
  }

  const payload = (await response.json()) as EiaResponse;
  const latest = payload.response?.data?.[0];

  if (!latest) {
    return {
      fuel: null,
      failureReason: "EIA response did not include a latest diesel row.",
    };
  }

  const fuel = normalizeEiaDieselPrice(latest);

  if (!fuel) {
    return {
      fuel: null,
      failureReason:
        "EIA response did not include a usable diesel price or period.",
    };
  }

  return {
    fuel,
    failureReason: null,
  };
}
