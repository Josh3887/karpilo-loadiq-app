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
  "/petroleum/pri/gnd/data/?frequency=weekly&data[0]=value&facets[product][]=EPD2DXL0&facets[duoarea][]=NUS&facets[series][]=EMD_EPD2DXL0_PTE_NUS_DPG&facets[process][]=PTE&sort[0][column]=period&sort[0][direction]=desc&offset=0&length=5000";

export type EiaFuelFetchResult =
  | {
      fuel: NormalizedFuelPrice;
      failureReason: null;
    }
  | {
      fuel: null;
      failureReason: string;
    };

function eiaFailure(failureReason: string): EiaFuelFetchResult {
  console.error("EIA_DIESEL_FETCH_ERROR:", failureReason);

  return {
    fuel: null,
    failureReason,
  };
}

function latestDieselRow(data: EiaFuelDataPoint[] | undefined) {
  return [...(data ?? [])]
    .filter((row) => row.period)
    .sort((a, b) => String(b.period).localeCompare(String(a.period)))[0];
}

export async function fetchLatestEiaDieselPrice(): Promise<EiaFuelFetchResult> {
  const apiKey = process.env.EIA_API_KEY;

  if (!apiKey) {
    return eiaFailure("EIA_API_KEY is not configured.");
  }

  const baseUrl = process.env.EIA_BASE_URL ?? "https://api.eia.gov/v2";
  const url = new URL(`${baseUrl}${EIA_ULSD_PATH}`);
  url.searchParams.set("api_key", apiKey);

  let response: Response;

  try {
    response = await fetch(url, {
      cache: "no-store",
    });
  } catch (error) {
    return eiaFailure(
      error instanceof Error
        ? `EIA request failed: ${error.message}`
        : "EIA request failed."
    );
  }

  if (!response.ok) {
    return eiaFailure(`EIA returned HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as EiaResponse;
  const latest = latestDieselRow(payload.response?.data);

  if (!latest) {
    return eiaFailure("EIA response did not include a latest diesel row.");
  }

  const fuel = normalizeEiaDieselPrice(latest);

  if (!fuel) {
    return eiaFailure(
      "EIA response did not include a usable diesel price or period."
    );
  }

  return {
    fuel,
    failureReason: null,
  };
}
