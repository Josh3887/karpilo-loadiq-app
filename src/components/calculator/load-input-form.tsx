"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  defaultLoadInputValues,
  loadInputSchema,
  LoadInputFormValues,
} from "@/lib/load-schema";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { getDieselPrice } from "@/services/fuel-prices";
import {
  hoursToPlanningDays,
  milesToBenchmarkHours,
  minutesToHumanDuration,
  minutesToQuarterHours,
  toDateInputValue,
  toTimeInputValue,
} from "@/services/trip-dates";
import {
  DeadheadContinuitySuggestion,
  getDeadheadContinuitySuggestion,
} from "@/services/saved-load-input";
import { isRunningLoadStatus } from "@/services/trip-validation";
import { LOAD_RUN_STATUS_OPTIONS } from "@/lib/fuel-gauge";
import {
  GOOGLE_ROUTE_DISCLAIMER,
  RouteEstimate,
  RouteEstimateResponse,
  RouteStopKind,
  TRIMBLE_ROUTE_PLACEHOLDER,
} from "@/types/route-intelligence";
import { RouteStopInput } from "@/types/load";
import type { FscSourceMode } from "@/services/fsc-intelligence";

type LoadInputRawValues = z.input<typeof loadInputSchema>;

type LoadInputFormProps = {
  onCalculate: (values: LoadInputFormValues) => void;
  initialValues?: LoadInputFormValues | null;
  previewMode?: boolean;
};

const BENCHMARK_MPH = 50;
const PLANNING_HOURS_PER_DAY = 10;
const DEFAULT_STOP_DWELL_HOURS = 2;
const FSC_SOURCE_MODE_OPTIONS: Array<{
  value: FscSourceMode;
  label: string;
}> = [
  { value: "actual_fsc_entered", label: "Enter actual FSC" },
  { value: "fsc_built_into_gross", label: "Included in gross" },
  { value: "fsc_separate_missing", label: "Separate, amount missing" },
  { value: "unknown", label: "Unknown" },
];

export function LoadInputForm({
  onCalculate,
  initialValues,
  previewMode = false,
}: LoadInputFormProps) {
  const [fuelStatus, setFuelStatus] = useState("");
  const [routeStatus, setRouteStatus] = useState("");
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(
    initialValues?.routeEstimate ?? null
  );
  const [continuitySuggestion, setContinuitySuggestion] =
    useState<DeadheadContinuitySuggestion | null>(null);
  const [isEstimatingRoute, setIsEstimatingRoute] = useState(false);
  const userOverrodeFuelPrice = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<LoadInputRawValues>({
    resolver: zodResolver(loadInputSchema),
    defaultValues: defaultLoadInputValues,
  });
  const watchedDeadheadStartDate =
    toDateInputValue(useWatch({ control, name: "deadheadStartDate" }));
  const rawDeadheadStartTime = toInputString(
    useWatch({ control, name: "deadheadStartTime" })
  );
  const watchedDeadheadStartTime =
    normalizeMilitaryTimeValue(rawDeadheadStartTime);
  const watchedPickupDate = toDateInputValue(
    useWatch({ control, name: "pickupDate" })
  );
  const rawPickupTime = toInputString(
    useWatch({ control, name: "pickupTime" })
  );
  const watchedPickupTime = normalizeMilitaryTimeValue(rawPickupTime);
  const watchedPickupWindowStartDate = toDateInputValue(
    useWatch({ control, name: "pickupWindowStartDate" })
  );
  const rawPickupWindowStart = toInputString(
    useWatch({ control, name: "pickupWindowStart" })
  );
  const watchedPickupWindowStart =
    normalizeMilitaryTimeValue(rawPickupWindowStart);
  const watchedPickupWindowEndDate = toDateInputValue(
    useWatch({ control, name: "pickupWindowEndDate" })
  );
  const rawPickupWindowEnd = toInputString(
    useWatch({ control, name: "pickupWindowEnd" })
  );
  const watchedPickupWindowEnd =
    normalizeMilitaryTimeValue(rawPickupWindowEnd);
  const watchedPickupWindowOpenEnded = Boolean(
    useWatch({ control, name: "pickupWindowOpenEnded" })
  );
  const watchedDeliveryDate =
    toDateInputValue(useWatch({ control, name: "deliveryDate" }));
  const rawDeliveryTime = toInputString(
    useWatch({ control, name: "deliveryTime" })
  );
  const watchedDeliveryTime = normalizeMilitaryTimeValue(rawDeliveryTime);
  const watchedDeliveryWindowStartDate = toDateInputValue(
    useWatch({ control, name: "deliveryWindowStartDate" })
  );
  const rawDeliveryWindowStart = toInputString(
    useWatch({ control, name: "deliveryWindowStart" })
  );
  const watchedDeliveryWindowStart =
    normalizeMilitaryTimeValue(rawDeliveryWindowStart);
  const watchedDeliveryWindowEndDate = toDateInputValue(
    useWatch({ control, name: "deliveryWindowEndDate" })
  );
  const rawDeliveryWindowEnd = toInputString(
    useWatch({ control, name: "deliveryWindowEnd" })
  );
  const watchedDeliveryWindowEnd =
    normalizeMilitaryTimeValue(rawDeliveryWindowEnd);
  const watchedDeliveryWindowOpenEnded = Boolean(
    useWatch({ control, name: "deliveryWindowOpenEnded" })
  );
  const revenueInputMode =
    useWatch({ control, name: "revenueInputMode" }) ?? "rpm";
  const fuelSurchargeIncludedInGross = Boolean(
    useWatch({ control, name: "fuelSurchargeIncludedInGross" })
  );
  const fscSourceMode =
    (useWatch({ control, name: "fscSourceMode" }) as FscSourceMode) ??
    "actual_fsc_entered";
  const routeStops = (useWatch({ control, name: "routeStops" }) ??
    []) as RouteStopInput[];
  const loadRunStatus =
    useWatch({ control, name: "loadRunStatus" }) ?? "planned";
  const applyDeadheadSuggestion = useCallback(
    (suggestion: DeadheadContinuitySuggestion) => {
      setValue("deadheadStartAddress", suggestion.address, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("deadheadStartCity", suggestion.city, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("deadheadStartState", suggestion.state, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("deadheadStartZip", suggestion.zip, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("deadheadOriginSuggestionApplied", true, {
        shouldDirty: true,
      });
      setValue("deadheadOriginSuggestionSourceLoadId", suggestion.sourceLoadId, {
        shouldDirty: true,
      });

      if (suggestion.suggestedOriginOdometer) {
        setValue("suggestedOriginOdometer", suggestion.suggestedOriginOdometer, {
          shouldDirty: true,
        });
      }
    },
    [setValue]
  );

  useEffect(() => {
    async function loadDefaults() {
      try {
        const defaults = await getCalculatorDefaults();

        setValue("overhead", defaults.weeklyOverhead, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("targetTrueRpm", defaults.targetTrueRpm);
        setValue("mpg", defaults.defaultMpg);
        setValue("maintenanceReserve", defaults.maintenanceReserve);
        setValue("tireReserve", defaults.tireReserve);
        setValue("trailerFee", defaults.trailerFee);
        setValue("insuranceAllocation", defaults.insuranceAllocation);
        setValue("variableCostPerMile", defaults.variableCostPerMile);
        setValue("fixedCostAllocation", defaults.fixedCostAllocation);
        setValue("dispatchPercent", defaults.dispatchPercent);
        setValue("factoringPercent", defaults.factoringPercent);

        if (defaults.defaultPayStructure) {
          setValue("payStructure", defaults.defaultPayStructure);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadDefaults();
  }, [setValue]);

  useEffect(() => {
    async function loadFuelPrice() {
      try {
        const fuel = await getDieselPrice();

        if (userOverrodeFuelPrice.current) {
          return;
        }

        if (fuel.status === "available" && fuel.fuel) {
          setValue("fuelPrice", fuel.fuel.pricePerGallon.toFixed(2), {
            shouldDirty: false,
            shouldValidate: true,
          });
          setValue("fuelPriceSource", "EIA");
          setValue("fuelPriceSourceLabel", fuel.fuel.sourceLabel);
          setValue("fuelPriceRegion", fuel.fuel.region);
          setValue("fuelPricePeriod", fuel.fuel.period);
          setValue("fuelPriceFetchedAt", fuel.fuel.fetchedAt);
          setValue("fuelPriceExpiresAt", fuel.fuel.expiresAt);
          setValue("fuelPriceIsEstimate", fuel.fuel.isEstimate);

          const updatedDate = new Date(
            fuel.fuel.fetchedAt
          ).toLocaleDateString();

          setFuelStatus(
            `EIA market estimate · U.S. National ULSD · Updated ${updatedDate}`
          );
          return;
        }

        setValue("fuelPriceSource", "MANUAL");
        setValue("fuelPriceIsEstimate", false);
        setFuelStatus(fuel.message);
      } catch {
        setFuelStatus("Fuel lookup unavailable. Manual entry active.");
      }
    }

    loadFuelPrice();
  }, [setValue]);

  useEffect(() => {
    if (!initialValues) return;

    reset(normalizeScheduleInputValues(initialValues));
    if (initialValues.fuelPriceSource === "USER_OVERRIDE") {
      userOverrodeFuelPrice.current = true;
      queueMicrotask(() => {
        setFuelStatus("User override · actual fuel price");
      });
    } else if (initialValues.fuelPriceSource === "EIA") {
      queueMicrotask(() => {
        setFuelStatus(
          "EIA market estimate · U.S. National ULSD · Updated weekly"
        );
      });
    }

    queueMicrotask(() => {
      setRouteEstimate(initialValues.routeEstimate ?? null);
    });
  }, [initialValues, reset]);

  useEffect(() => {
    if (previewMode || initialValues) return;

    let cancelled = false;

    async function loadContinuitySuggestion() {
      try {
        const suggestion = await getDeadheadContinuitySuggestion();

        if (cancelled || !suggestion) return;

        setContinuitySuggestion(suggestion);

        const currentValues = getValues();
        const hasDeadheadOrigin = Boolean(
          currentValues.deadheadStartAddress ||
            currentValues.deadheadStartCity ||
            currentValues.deadheadStartState ||
            currentValues.deadheadStartZip
        );

        if (!hasDeadheadOrigin) {
          applyDeadheadSuggestion(suggestion);
        }
      } catch (error) {
        console.error(error);
      }
    }

    void loadContinuitySuggestion();

    return () => {
      cancelled = true;
    };
  }, [applyDeadheadSuggestion, getValues, initialValues, previewMode]);

  function submit(values: LoadInputRawValues) {
    const paidMiles = Number(values.loadedMiles ?? 0);
    const submittedFscSourceMode = normalizeFscSourceMode(
      values.fscSourceMode
    );
    const submittedFuelSurchargeIncludedInGross =
      submittedFscSourceMode === "fsc_built_into_gross" ||
      (submittedFscSourceMode === "actual_fsc_entered" &&
        Boolean(values.fuelSurchargeIncludedInGross));
    const submittedFuelSurcharge =
      submittedFscSourceMode === "actual_fsc_entered"
        ? Number(values.fuelSurcharge ?? 0)
        : 0;
    const runningStatus = isRunningLoadStatus(
      String(values.loadRunStatus ?? "planned")
    );
    const submittedOriginOdometer = runningStatus
      ? Number(values.originOdometer ?? 0)
      : 0;
    const submittedOdometerValidation =
      submittedOriginOdometer > 0
        ? {
            originOdometer: submittedOriginOdometer,
            capturedAtStatus: String(values.loadRunStatus ?? "planned"),
            warnings: [],
          }
        : null;
    const submittedRouteEstimate = routeEstimate
      ? {
          ...routeEstimate,
          routeMileageVariance: getRouteMileageVariance(
            routeEstimate,
            paidMiles
          ),
        }
      : null;
    const parsedValues = normalizeScheduleInputValues(
      loadInputSchema.parse({
        ...values,
        fscSourceMode: submittedFscSourceMode,
        fuelSurchargeIncludedInGross: submittedFuelSurchargeIncludedInGross,
        fuelSurcharge: submittedFuelSurcharge,
        originOdometer: submittedOriginOdometer,
        endOdometer: 0,
        accessorialItems: [],
        tolls: 0,
        lumpers: 0,
        routeEstimate: submittedRouteEstimate,
        actualTotalMiles: 0,
        odometerValidation: submittedOdometerValidation,
      })
    );
    const derivedLinehaulRevenue =
      parsedValues.revenueInputMode === "gross"
        ? Math.max(
            parsedValues.grossRevenue -
              (parsedValues.fuelSurchargeIncludedInGross
                ? parsedValues.fuelSurcharge
                : 0),
            0
          )
        : parsedValues.loadedMiles * parsedValues.ratePerMile;
    const derivedRatePerMile =
      parsedValues.loadedMiles > 0
        ? derivedLinehaulRevenue / parsedValues.loadedMiles
        : parsedValues.ratePerMile;
    const normalizedValues = {
      ...parsedValues,
      ratePerMile: Number(derivedRatePerMile.toFixed(4)),
      fscSourceMode: submittedFscSourceMode,
      fuelSurchargeIncludedInGross: submittedFuelSurchargeIncludedInGross,
      fuelSurcharge: submittedFuelSurcharge,
      grossRevenue:
        parsedValues.revenueInputMode === "gross"
          ? parsedValues.grossRevenue
          : derivedLinehaulRevenue + parsedValues.fuelSurcharge,
    };

    onCalculate(normalizedValues);
  }

  function handleManualFuelOverride() {
    userOverrodeFuelPrice.current = true;
    setValue("fuelPriceSource", "USER_OVERRIDE");
    setValue("fuelPriceIsEstimate", false);
    setFuelStatus("User override · actual fuel price");
  }

  function buildRouteAddress(values: LoadInputRawValues, type: "pickup" | "delivery") {
    const parts =
      type === "pickup"
        ? [
            values.pickupAddress,
            values.pickupCity,
            values.pickupState,
            values.pickupZip,
          ]
        : [
            values.deliveryAddress,
            values.deliveryCity,
            values.deliveryState,
            values.deliveryZip,
          ];

    return parts
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }

  function buildDeadheadAddress(values: LoadInputRawValues) {
    return [
      values.deadheadStartAddress,
      values.deadheadStartCity,
      values.deadheadStartState,
      values.deadheadStartZip,
    ]
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter(Boolean)
      .join(", ");
  }

  function buildStopAddress(stop: RouteStopInput) {
    return [stop.address, stop.city, stop.state, stop.zip]
      .filter(Boolean)
      .map((part) => String(part).trim())
      .filter(Boolean)
      .join(", ");
  }

  function addRouteStop() {
    setValue(
      "routeStops",
      [
        ...routeStops,
        {
          id: createRouteStopId(),
          stopType: "pickup",
          address: "",
          city: "",
          state: "",
          zip: "",
          appointmentDate: "",
          appointmentTime: "",
          appointmentWindowStartDate: "",
          appointmentWindowStart: "",
          appointmentWindowEndDate: "",
          appointmentWindowEnd: "",
          appointmentWindowOpenEnded: false,
          dwellHours: DEFAULT_STOP_DWELL_HOURS,
          milesFromPrevious: 0,
          stopRevenue: 0,
          stopExpense: 0,
          notes: "",
        },
      ],
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function updateRouteStop(
    index: number,
    updates: Partial<RouteStopInput>
  ) {
    setValue(
      "routeStops",
      routeStops.map((stop, stopIndex) =>
        stopIndex === index ? { ...stop, ...updates } : stop
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function removeRouteStop(index: number) {
    setValue(
      "routeStops",
      routeStops.filter((_, stopIndex) => stopIndex !== index),
      {
        shouldDirty: true,
        shouldValidate: true,
      }
    );
  }

  function clearDeadheadSuggestion() {
    setValue("deadheadStartAddress", "", { shouldDirty: true });
    setValue("deadheadStartCity", "", { shouldDirty: true });
    setValue("deadheadStartState", "", { shouldDirty: true });
    setValue("deadheadStartZip", "", { shouldDirty: true });
    setValue("deadheadOriginSuggestionApplied", false, { shouldDirty: true });
    setValue("deadheadOriginSuggestionSourceLoadId", "", { shouldDirty: true });
  }

  function applySuggestedOriginOdometer() {
    if (!continuitySuggestion?.suggestedOriginOdometer) return;

    setValue("originOdometer", continuitySuggestion.suggestedOriginOdometer, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function markPlanningOverride(
    field:
      | "deadheadPlanningHoursUserOverridden"
      | "deadheadDaysUserOverridden"
      | "loadedPlanningHoursUserOverridden"
      | "loadedDaysUserOverridden"
  ) {
    setValue(field, true, { shouldDirty: true });
  }

  function applyPlanningSuggestions(estimate: RouteEstimate | null) {
    const values = getValues();
    const suggestion = buildPlanningSuggestion(values, estimate);

    setValue("googleRouteDurationHuman", suggestion.googleDurationHuman, {
      shouldDirty: true,
    });
    setValue(
      "googleRouteDurationQuarterHours",
      suggestion.googleDurationQuarterHours,
      {
        shouldDirty: true,
      }
    );
    setValue("deadheadBenchmarkHours", suggestion.deadheadBenchmarkHours, {
      shouldDirty: true,
    });
    setValue("loadedBenchmarkHours", suggestion.loadedBenchmarkHours, {
      shouldDirty: true,
    });
    setValue("deadheadBenchmarkDays", suggestion.deadheadBenchmarkDays, {
      shouldDirty: true,
    });
    setValue("loadedBenchmarkDays", suggestion.loadedBenchmarkDays, {
      shouldDirty: true,
    });

    if (!values.deadheadPlanningHoursUserOverridden) {
      setValue("deadheadPlanningHours", suggestion.deadheadPlanningHours, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (!values.deadheadDaysUserOverridden) {
      setValue("deadheadDays", suggestion.deadheadPlanningDays, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (!values.loadedPlanningHoursUserOverridden) {
      setValue("loadedPlanningHours", suggestion.loadedPlanningHours, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    if (!values.loadedDaysUserOverridden) {
      setValue("dispatchDays", Math.max(suggestion.loadedPlanningDays, 1), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  async function handleRouteEstimate() {
    const values = getValues();
    const pickupAddress = buildRouteAddress(values, "pickup");
    const deliveryAddress = buildRouteAddress(values, "delivery");
    const deadheadOrigin = buildDeadheadAddress(values);
    const stops = routeStops
      .map((stop, index) => ({
        id: stop.id,
        address: buildStopAddress(stop),
        kind: stop.stopType,
        sequence: index + 1,
      }))
      .filter((stop) => stop.address.length >= 3);

    if (pickupAddress.length < 3 || deliveryAddress.length < 3) {
      setRouteStatus(
        "Enter pickup and delivery address details before estimating mileage."
      );
      return;
    }

    try {
      setIsEstimatingRoute(true);
      setRouteStatus("Estimating route with Google...");

      const response = await fetch("/api/route-intelligence/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deadheadOrigin: deadheadOrigin || undefined,
          pickupAddress,
          deliveryAddress,
          stops,
          provider: "google_estimate",
        }),
      });
      const payload = (await response.json()) as RouteEstimateResponse;
      const estimate = payload.estimate;

      setRouteStatus(payload.message);
      setRouteEstimate(estimate);
      setValue("routeEstimate", estimate, {
        shouldDirty: true,
      });

      if (
        response.ok &&
        payload.status === "available" &&
        estimate?.loadedEstimate?.estimatedLoadedMiles !== null &&
        estimate?.loadedEstimate?.estimatedLoadedMiles !== undefined
      ) {
        setValue("routeLoadedMiles", estimate.loadedEstimate.estimatedLoadedMiles, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }

      if (
        response.ok &&
        estimate?.deadheadEstimate?.estimatedDeadheadMiles !== null &&
        estimate?.deadheadEstimate?.estimatedDeadheadMiles !== undefined
      ) {
        setValue(
          "routeDeadheadMiles",
          estimate.deadheadEstimate.estimatedDeadheadMiles,
          {
            shouldDirty: true,
            shouldValidate: true,
          }
        );
      }

      applyPlanningSuggestions(estimate);
    } catch {
      setRouteStatus(
        "Route estimate unavailable. Manual mileage entry remains active."
      );
      setRouteEstimate(null);
      setValue("routeEstimate", null, {
        shouldDirty: true,
      });
      applyPlanningSuggestions(null);
    } finally {
      setIsEstimatingRoute(false);
    }
  }

  function handleUseEstimateAsPaidMiles() {
    const estimatedLoadedMiles =
      routeEstimate?.loadedEstimate?.estimatedLoadedMiles ??
      routeEstimate?.estimatedMiles;

    if (
      estimatedLoadedMiles === null ||
      estimatedLoadedMiles === undefined
    ) {
      return;
    }

    setValue("loadedMiles", estimatedLoadedMiles, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setRouteStatus(
      "Google estimated loaded miles copied into paid loaded miles by user action."
    );
  }

  function setCalculatorTimeField(
    field:
      | "deadheadStartTime"
      | "pickupTime"
      | "pickupWindowStart"
      | "pickupWindowEnd"
      | "deliveryTime"
      | "deliveryWindowStart"
      | "deliveryWindowEnd",
    value: string,
    shouldValidate = false
  ) {
    setValue(field, value, {
      shouldDirty: true,
      shouldValidate,
    });
  }

  const fuelPriceField = register("fuelPrice");
  const deadheadPlanningHoursField = register("deadheadPlanningHours");
  const deadheadDaysField = register("deadheadDays");
  const loadedPlanningHoursField = register("loadedPlanningHours");
  const dispatchDaysField = register("dispatchDays");

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <input type="hidden" {...register("fuelPriceSource")} />
      <input type="hidden" {...register("fuelPriceSourceLabel")} />
      <input type="hidden" {...register("fuelPriceRegion")} />
      <input type="hidden" {...register("fuelPricePeriod")} />
      <input type="hidden" {...register("fuelPriceFetchedAt")} />
      <input type="hidden" {...register("fuelPriceExpiresAt")} />
      <input type="hidden" {...register("revenueInputMode")} />

      <section className="space-y-4">
        <SectionTitle title="EIA Fuel Baseline" />

        <div className="space-y-4 rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <InputField
            label="Fuel Price"
            type="text"
            inputMode="decimal"
            placeholder="4.00"
            error={errors.fuelPrice?.message}
            {...fuelPriceField}
            onChange={(event) => {
              void fuelPriceField.onChange(event);
              handleManualFuelOverride();
            }}
          />

          <div className="space-y-2 rounded-lg border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-5 text-slate-300">
            <p className="font-semibold text-sky-200">
              {fuelStatus || "EIA diesel baseline loads when available."}
            </p>
            <p className="text-slate-500">
              EIA is a public fuel-price reference baseline. User fuel price
              overrides are allowed. Actual fuel purchases belong to load
              actuals after the trip. This fuel price estimate is decision
              support only.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Deadhead Details" />

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Load Status
          </span>
          <select
            {...register("loadRunStatus")}
            className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          >
            {LOAD_RUN_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                Deadhead Origin
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Start location, date, time, and mileage for the truck position
                before pickup.
              </p>
            </div>
            {continuitySuggestion && (
              <button
                type="button"
                onClick={clearDeadheadSuggestion}
                className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 transition hover:border-sky-400 hover:text-sky-200"
              >
                Clear Suggestion
              </button>
            )}
          </div>

          {continuitySuggestion && (
            <p className="mb-3 rounded-lg border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-5 text-sky-100">
              Suggested deadhead origin from previous delivery:{" "}
              {continuitySuggestion.formattedAddress}. This default is not
              forced.
            </p>
          )}

          <div className="space-y-4">
            <InputField
              label="Deadhead Origin Address"
              placeholder="Previous delivery, yard, truck stop, or current city"
              error={errors.deadheadStartAddress?.message}
              {...register("deadheadStartAddress")}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="Deadhead City"
                error={errors.deadheadStartCity?.message}
                {...register("deadheadStartCity")}
              />
              <InputField
                label="Deadhead State"
                error={errors.deadheadStartState?.message}
                {...register("deadheadStartState")}
              />
              <InputField
                label="Deadhead ZIP"
                error={errors.deadheadStartZip?.message}
                {...register("deadheadStartZip")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Deadhead Origin Date"
                type="date"
                error={errors.deadheadStartDate?.message}
                {...register("deadheadStartDate", {
                  setValueAs: toDateInputValue,
                })}
              />

              <MilitaryTimeInput
                label="Deadhead Origin Time"
                value={rawDeadheadStartTime}
                error={errors.deadheadStartTime?.message}
                onChange={(value) =>
                  setCalculatorTimeField("deadheadStartTime", value)
                }
                onBlur={(value) =>
                  setCalculatorTimeField("deadheadStartTime", value, true)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="Deadhead Miles"
                type="number"
                error={errors.deadheadMiles?.message}
                {...register("deadheadMiles")}
              />

              <InputField
                label="Deadhead Planning Hours"
                type="number"
                step="0.25"
                min="0"
                error={errors.deadheadPlanningHours?.message}
                {...deadheadPlanningHoursField}
                onChange={(event) => {
                  void deadheadPlanningHoursField.onChange(event);
                  markPlanningOverride("deadheadPlanningHoursUserOverridden");
                }}
              />

              <InputField
                label="Deadhead Planning Days"
                type="number"
                step="0.25"
                min="0"
                error={errors.deadheadDays?.message}
                {...deadheadDaysField}
                onChange={(event) => {
                  void deadheadDaysField.onChange(event);
                  markPlanningOverride("deadheadDaysUserOverridden");
                }}
              />
            </div>
          </div>

          {hasBroadWindow(
            watchedDeadheadStartDate,
            watchedDeadheadStartTime
          ) && (
            <WindowContextNotice>
              Date captured without a fixed time. LoadIQ treats this as broad
              planning context, not an input error.
            </WindowContextNotice>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
              Odometer Validation
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Odometer mileage validates what you actually drove. Use it for
              profitability intelligence, not as a substitute for ELD, tax,
              legal, or compliance records.
            </p>
          </div>

          {isRunningLoadStatus(loadRunStatus) ? (
            <div className="space-y-4">
              {continuitySuggestion?.suggestedOriginOdometer && (
                <div className="rounded-lg border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-5 text-sky-100">
                  Suggested from previous load end odometer:{" "}
                  {continuitySuggestion.suggestedOriginOdometer.toLocaleString()}
                  <button
                    type="button"
                    onClick={applySuggestedOriginOdometer}
                    className="ml-3 rounded-md border border-sky-300/30 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-sky-200"
                  >
                    Use
                  </button>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Origin Odometer"
                  type="number"
                  step="1"
                  error={errors.originOdometer?.message}
                  {...register("originOdometer")}
                />
              </div>

              <p className="rounded-lg border border-slate-800 bg-[#0B1220] p-3 text-xs leading-5 text-slate-400">
                End odometer and actual mileage validation are captured in the
                saved-load post-trip actuals workflow.
              </p>
            </div>
          ) : loadRunStatus === "ran" ? (
            <p className="rounded-lg border border-slate-800 bg-[#0B1220] p-3 text-xs leading-5 text-slate-400">
              Completed loads show locked odometer values only when they were
              captured during the running load workflow.
            </p>
          ) : (
            <p className="rounded-lg border border-slate-800 bg-[#0B1220] p-3 text-xs leading-5 text-slate-400">
              Odometer input is available only when the load status is Running.
              Planned, booked, and dispatched loads do not allow odometer input.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Pickup Details" />

        <InputField
          label="Pickup Address"
          placeholder="Street, dock, or facility"
          error={errors.pickupAddress?.message}
          {...register("pickupAddress")}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Pickup City"
            error={errors.pickupCity?.message}
            {...register("pickupCity")}
          />

          <InputField
            label="Pickup State"
            error={errors.pickupState?.message}
            {...register("pickupState")}
          />

          <InputField
            label="Pickup ZIP"
            error={errors.pickupZip?.message}
            {...register("pickupZip")}
          />
        </div>

        <EndpointWindowCard
          title="Pickup Window"
          appointmentDateField={
            <InputField
              label="Pickup Date"
              type="date"
              error={errors.pickupDate?.message}
              {...register("pickupDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          appointmentTimeField={
            <MilitaryTimeInput
              label="Pickup Time"
              value={rawPickupTime}
              error={errors.pickupTime?.message}
              onChange={(value) => setCalculatorTimeField("pickupTime", value)}
              onBlur={(value) =>
                setCalculatorTimeField("pickupTime", value, true)
              }
            />
          }
          windowStartDateField={
            <InputField
              label="Window Start Date"
              type="date"
              error={errors.pickupWindowStartDate?.message}
              {...register("pickupWindowStartDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          windowStartTimeField={
            <MilitaryTimeInput
              label="Window Start Time"
              value={rawPickupWindowStart}
              error={errors.pickupWindowStart?.message}
              onChange={(value) =>
                setCalculatorTimeField("pickupWindowStart", value)
              }
              onBlur={(value) =>
                setCalculatorTimeField("pickupWindowStart", value, true)
              }
            />
          }
          windowEndDateField={
            <InputField
              label="Window End Date"
              type="date"
              error={errors.pickupWindowEndDate?.message}
              {...register("pickupWindowEndDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          windowEndTimeField={
            <MilitaryTimeInput
              label="Window End Time"
              value={rawPickupWindowEnd}
              error={errors.pickupWindowEnd?.message}
              onChange={(value) =>
                setCalculatorTimeField("pickupWindowEnd", value)
              }
              onBlur={(value) =>
                setCalculatorTimeField("pickupWindowEnd", value, true)
              }
            />
          }
          openEndedField={
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-sm text-slate-300">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400"
                {...register("pickupWindowOpenEnded")}
              />
              <span>
                <span className="block font-semibold text-slate-200">
                  Open-ended pickup window
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  The appointment is flexible, but start and end dates still
                  define the window context. Times may stay blank.
                </span>
              </span>
            </label>
          }
          dwellField={
            <InputField
              label="Loading / Dwell Hours"
              type="number"
              step="0.25"
              min="0"
              error={errors.pickupDwellHours?.message}
              {...register("pickupDwellHours")}
            />
          }
          windowContextMessage={getWindowContextMessage({
            appointmentDate: watchedPickupDate,
            appointmentTime: watchedPickupTime,
            windowStartDate: watchedPickupWindowStartDate,
            windowStartTime: watchedPickupWindowStart,
            windowEndDate: watchedPickupWindowEndDate,
            windowEndTime: watchedPickupWindowEnd,
            openEnded: watchedPickupWindowOpenEnded,
          })}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Stop Details" />

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                Ordered Stops
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Stops are routed in the order entered.
              </p>
            </div>
            <button
              type="button"
              onClick={addRouteStop}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
            >
              + Add Stop
            </button>
          </div>

          {routeStops.length === 0 ? (
            <p className="rounded-lg border border-slate-800 bg-[#0B1220] p-3 text-xs leading-5 text-slate-500">
              Add freight pickup or delivery stops only when they are part of
              the planned loaded route. Fuel and DEF purchases belong in load
              actuals.
            </p>
          ) : (
            <div className="space-y-4">
              {routeStops.map((stop, index) => (
                <RouteStopEditor
                  key={stop.id ?? index}
                  index={index}
                  stop={stop}
                  onChange={(updates) => updateRouteStop(index, updates)}
                  onRemove={() => removeRouteStop(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Delivery Details" />

        <InputField
          label="Delivery Address"
          placeholder="Street, dock, or facility"
          error={errors.deliveryAddress?.message}
          {...register("deliveryAddress")}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <InputField
            label="Delivery City"
            error={errors.deliveryCity?.message}
            {...register("deliveryCity")}
          />

          <InputField
            label="Delivery State"
            error={errors.deliveryState?.message}
            {...register("deliveryState")}
          />

          <InputField
            label="Delivery ZIP"
            error={errors.deliveryZip?.message}
            {...register("deliveryZip")}
          />
        </div>

        <EndpointWindowCard
          title="Delivery Window"
          appointmentDateField={
            <InputField
              label="Delivery Date"
              type="date"
              error={errors.deliveryDate?.message}
              {...register("deliveryDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          appointmentTimeField={
            <MilitaryTimeInput
              label="Delivery Time"
              value={rawDeliveryTime}
              error={errors.deliveryTime?.message}
              onChange={(value) =>
                setCalculatorTimeField("deliveryTime", value)
              }
              onBlur={(value) =>
                setCalculatorTimeField("deliveryTime", value, true)
              }
            />
          }
          windowStartDateField={
            <InputField
              label="Window Start Date"
              type="date"
              error={errors.deliveryWindowStartDate?.message}
              {...register("deliveryWindowStartDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          windowStartTimeField={
            <MilitaryTimeInput
              label="Window Start Time"
              value={rawDeliveryWindowStart}
              error={errors.deliveryWindowStart?.message}
              onChange={(value) =>
                setCalculatorTimeField("deliveryWindowStart", value)
              }
              onBlur={(value) =>
                setCalculatorTimeField("deliveryWindowStart", value, true)
              }
            />
          }
          windowEndDateField={
            <InputField
              label="Window End Date"
              type="date"
              error={errors.deliveryWindowEndDate?.message}
              {...register("deliveryWindowEndDate", {
                setValueAs: toDateInputValue,
              })}
            />
          }
          windowEndTimeField={
            <MilitaryTimeInput
              label="Window End Time"
              value={rawDeliveryWindowEnd}
              error={errors.deliveryWindowEnd?.message}
              onChange={(value) =>
                setCalculatorTimeField("deliveryWindowEnd", value)
              }
              onBlur={(value) =>
                setCalculatorTimeField("deliveryWindowEnd", value, true)
              }
            />
          }
          openEndedField={
            <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-sm text-slate-300">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400"
                {...register("deliveryWindowOpenEnded")}
              />
              <span>
                <span className="block font-semibold text-slate-200">
                  Open-ended delivery window
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  The appointment is flexible, but start and end dates still
                  define the window context. Times may stay blank.
                </span>
              </span>
            </label>
          }
          dwellField={
            <InputField
              label="Unloading / Dwell Hours"
              type="number"
              step="0.25"
              min="0"
              error={errors.deliveryDwellHours?.message}
              {...register("deliveryDwellHours")}
            />
          }
          windowContextMessage={getWindowContextMessage({
            appointmentDate: watchedDeliveryDate,
            appointmentTime: watchedDeliveryTime,
            windowStartDate: watchedDeliveryWindowStartDate,
            windowStartTime: watchedDeliveryWindowStart,
            windowEndDate: watchedDeliveryWindowEndDate,
            windowEndTime: watchedDeliveryWindowEnd,
            openEnded: watchedDeliveryWindowOpenEnded,
          })}
        />

        <div className="space-y-4 rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                Route Intelligence Actions
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Estimate route miles and duration for operational intelligence.
                Estimated miles and benchmarks render in results, not as
                primary calculator inputs.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRouteEstimate}
              disabled={isEstimatingRoute}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
            >
              {isEstimatingRoute ? "Estimating Route" : "Estimate Route Miles"}
            </button>
          </div>

          {(routeStatus || routeEstimate) && (
            <div className="space-y-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-5 text-slate-300">
              <p className="font-semibold text-sky-200">
                {routeStatus ||
                  "Route estimate loaded. Mileage, duration, variance, and benchmark context appear in results after analysis."}
              </p>

              {routeEstimate && (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        applyPlanningSuggestions(routeEstimate);
                        setRouteStatus(
                          "Planning suggestions refreshed from route duration or 50 mph benchmark."
                        );
                      }}
                      className="rounded-xl border border-sky-400/30 bg-[#060B14] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/10"
                    >
                      Apply Planning Suggestions
                    </button>

                    {routeEstimate.estimatedMiles !== null && (
                      <button
                        type="button"
                        onClick={handleUseEstimateAsPaidMiles}
                        className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
                      >
                        Use Estimate As Paid Miles
                      </button>
                    )}
                  </div>

                  <RouteWarnings estimate={routeEstimate} />
                </>
              )}

              <p className="font-semibold text-slate-300">
                {routeEstimate?.disclaimer ?? GOOGLE_ROUTE_DISCLAIMER}
              </p>
              <p className="text-slate-500">
                Google estimates are not truck-legal routing.
              </p>
              <p className="text-slate-500">{TRIMBLE_ROUTE_PLACEHOLDER}</p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Loaded Planning Hours"
            type="number"
            step="0.25"
            min="0"
            error={errors.loadedPlanningHours?.message}
            {...loadedPlanningHoursField}
            onChange={(event) => {
              void loadedPlanningHoursField.onChange(event);
              markPlanningOverride("loadedPlanningHoursUserOverridden");
            }}
          />

          <InputField
            label="Loaded Planning Days"
            type="number"
            step="0.25"
            min="1"
            error={errors.dispatchDays?.message}
            {...dispatchDaysField}
            onChange={(event) => {
              void dispatchDaysField.onChange(event);
              markPlanningOverride("loadedDaysUserOverridden");
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Load Weight" />

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <InputField
            label="Cargo Weight (lb)"
            type="number"
            step="1"
            min="0"
            error={errors.estimatedLoadWeightLbs?.message}
            {...register("estimatedLoadWeightLbs")}
          />

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Load weight is planning context only. It is not permit, legal,
            bridge, axle, scale, or compliance authority.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Financial Inputs" />

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Load Number"
            error={errors.loadNumber?.message}
            {...register("loadNumber")}
          />

          <InputField
            label="Paid Loaded Miles"
            type="number"
            error={errors.loadedMiles?.message}
            {...register("loadedMiles")}
          />
        </div>

        <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-400">
          Paid loaded miles are the miles you are paid on. Google estimated
          route miles remain separate Route Intelligence context and are copied
          into paid miles only by explicit user action.
        </p>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-[#060B14] p-1">
          <RevenueModeButton
            active={revenueInputMode === "rpm"}
            label="RPM"
            onClick={() => setValue("revenueInputMode", "rpm", {
              shouldDirty: true,
              shouldValidate: true,
            })}
          />
          <RevenueModeButton
            active={revenueInputMode === "gross"}
            label="Load Gross"
            onClick={() => setValue("revenueInputMode", "gross", {
              shouldDirty: true,
              shouldValidate: true,
            })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {revenueInputMode === "gross" ? (
            <InputField
              label="Load Gross"
              type="number"
              step="0.01"
              error={errors.grossRevenue?.message}
              {...register("grossRevenue")}
            />
          ) : (
            <InputField
              label="RPM"
              type="number"
              step="0.01"
              error={errors.ratePerMile?.message}
              {...register("ratePerMile")}
            />
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
              FSC Treatment
            </span>
            <select
              {...register("fscSourceMode")}
              className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
            >
              {FSC_SOURCE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {fscSourceMode === "actual_fsc_entered" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Fuel Surcharge"
              type="number"
              step="0.01"
              error={errors.fuelSurcharge?.message}
              {...register("fuelSurcharge")}
            />

            <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-5 text-slate-500">
              Enter actual FSC when it is listed on the load paperwork.
              Karpilo FSC Intelligence still compares it against the EIA-indexed
              baseline model for education.
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
            {getFscModeHelpText(fscSourceMode)}
          </p>
        )}

        {revenueInputMode === "gross" &&
          fscSourceMode === "actual_fsc_entered" && (
          <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400"
              {...register("fuelSurchargeIncludedInGross")}
            />
            <span>
              <span className="block font-semibold text-slate-200">
                FSC is included in load gross
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {fuelSurchargeIncludedInGross
                  ? "Linehaul will be derived by subtracting FSC from the entered gross."
                  : "Entered gross will be treated as linehaul, with FSC modeled separately."}
              </span>
            </span>
          </label>
        )}

        <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-500">
          Fuel surcharge rules vary by carrier, broker, customer, contract, and
          individual load. When actual FSC is not provided, Karpilo LoadIQ uses
          an adopted baseline FSC model for estimation and education only.
          Actual user-entered FSC remains the source of truth when provided.
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Operational Disclaimer" />
        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          Operational overhead, pay template, MPG, reserves, dispatch,
          factoring, and target profitability come from Settings. Accessorials,
          tolls, fuel purchases, DEF purchases, and lumpers are captured as
          saved-load actuals after the trip. Calculator output is decision
          support only and does not replace settlement, tax, legal, ELD, permit,
          scale, or compliance records.
        </p>
      </section>

      <div className="sticky bottom-3 z-20">
        <button
          type="submit"
          className="w-full rounded-xl bg-sky-400 px-5 py-4 text-sm font-black uppercase tracking-[0.22em] text-[#060B14] shadow-[0_0_25px_rgba(56,189,248,0.35)] transition hover:bg-sky-300"
        >
          Analyze Load
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-slate-800 pb-2 text-xs font-bold uppercase tracking-[0.25em] text-sky-300">
      {title}
    </div>
  );
}

function RevenueModeButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-lg bg-sky-400 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#060B14]"
          : "rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400 transition hover:bg-slate-900 hover:text-slate-200"
      }
    >
      {label}
    </button>
  );
}

function MilitaryTimeInput({
  label,
  value,
  error,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        placeholder="HH:mm"
        maxLength={5}
        pattern="([01]?[0-9]|2[0-3]):[0-5][0-9]"
        value={value}
        onChange={(event) =>
          onChange(normalizeMilitaryTimeDraft(event.target.value))
        }
        onBlur={(event) =>
          onBlur(normalizeMilitaryTimeValue(event.currentTarget.value))
        }
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </label>
  );
}

function EndpointWindowCard({
  title,
  appointmentDateField,
  appointmentTimeField,
  windowStartDateField,
  windowStartTimeField,
  windowEndDateField,
  windowEndTimeField,
  openEndedField,
  dwellField,
  windowContextMessage,
}: {
  title: string;
  appointmentDateField: React.ReactNode;
  appointmentTimeField: React.ReactNode;
  windowStartDateField: React.ReactNode;
  windowStartTimeField: React.ReactNode;
  windowEndDateField: React.ReactNode;
  windowEndTimeField: React.ReactNode;
  openEndedField: React.ReactNode;
  dwellField: React.ReactNode;
  windowContextMessage: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="mb-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          {title}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Appointment timing, window, and dwell context for planning.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {appointmentDateField}
        {appointmentTimeField}
        {windowStartDateField}
        {windowStartTimeField}
        {windowEndDateField}
        {windowEndTimeField}
        {dwellField}
      </div>

      <div className="mt-4">{openEndedField}</div>

      {windowContextMessage && (
        <WindowContextNotice>{windowContextMessage}</WindowContextNotice>
      )}
    </div>
  );
}

function WindowContextNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-xs leading-5 text-amber-100">
      {children}
    </p>
  );
}

const ROUTE_STOP_KIND_OPTIONS: Array<{
  value: RouteStopKind;
  label: string;
}> = [
  { value: "pickup", label: "P/U" },
  { value: "delivery", label: "DEL" },
];

function RouteStopEditor({
  index,
  stop,
  onChange,
  onRemove,
}: {
  index: number;
  stop: RouteStopInput;
  onChange: (updates: Partial<RouteStopInput>) => void;
  onRemove: () => void;
}) {
  const windowContextMessage = getWindowContextMessage({
    appointmentDate: stop.appointmentDate,
    appointmentTime: stop.appointmentTime,
    windowStartDate: stop.appointmentWindowStartDate,
    windowStartTime: stop.appointmentWindowStart,
    windowEndDate: stop.appointmentWindowEndDate,
    windowEndTime: stop.appointmentWindowEnd,
    openEnded: stop.appointmentWindowOpenEnded,
  });

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0B1220] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
            Stop {index + 1}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Routed after pickup and before delivery.
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-200 transition hover:bg-red-500/20"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
            Stop Type
          </span>
          <select
            value={stop.stopType}
            onChange={(event) =>
              onChange({ stopType: event.target.value as RouteStopKind })
            }
            className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          >
            {ROUTE_STOP_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <ControlledTextField
          label="Stop Address"
          value={stop.address}
          onChange={(value) => onChange({ address: value })}
        />
        <ControlledTextField
          label="Stop City"
          value={stop.city}
          onChange={(value) => onChange({ city: value })}
        />
        <ControlledTextField
          label="Stop State"
          value={stop.state}
          onChange={(value) => onChange({ state: value })}
        />
        <ControlledTextField
          label="Stop ZIP"
          value={stop.zip}
          onChange={(value) => onChange({ zip: value })}
        />
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-[#060B14] p-4">
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
            Stop Window
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Stop appointment timing and dwell context for planning.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ControlledTextField
            label="Stop Date"
            type="date"
            value={toDateInputValue(stop.appointmentDate)}
            onChange={(value) =>
              onChange({ appointmentDate: toDateInputValue(value) })
            }
          />
          <MilitaryTimeInput
            label="Stop Time"
            value={toInputString(stop.appointmentTime)}
            onChange={(value) => onChange({ appointmentTime: value })}
            onBlur={(value) => onChange({ appointmentTime: value })}
          />
          <ControlledTextField
            label="Window Start Date"
            type="date"
            value={toDateInputValue(stop.appointmentWindowStartDate)}
            onChange={(value) =>
              onChange({ appointmentWindowStartDate: toDateInputValue(value) })
            }
          />
          <MilitaryTimeInput
            label="Window Start Time"
            value={toInputString(stop.appointmentWindowStart)}
            onChange={(value) => onChange({ appointmentWindowStart: value })}
            onBlur={(value) => onChange({ appointmentWindowStart: value })}
          />
          <ControlledTextField
            label="Window End Date"
            type="date"
            value={toDateInputValue(stop.appointmentWindowEndDate)}
            onChange={(value) =>
              onChange({ appointmentWindowEndDate: toDateInputValue(value) })
            }
          />
          <MilitaryTimeInput
            label="Window End Time"
            value={toInputString(stop.appointmentWindowEnd)}
            onChange={(value) => onChange({ appointmentWindowEnd: value })}
            onBlur={(value) => onChange({ appointmentWindowEnd: value })}
          />
          <ControlledNumberField
            label="Dwell Hours"
            value={stop.dwellHours}
            onChange={(value) => onChange({ dwellHours: value })}
          />
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={Boolean(stop.appointmentWindowOpenEnded)}
            onChange={(event) =>
              onChange({ appointmentWindowOpenEnded: event.target.checked })
            }
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400"
          />
          <span>
            <span className="block font-semibold text-slate-200">
              Open-ended stop window
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-500">
              The stop is flexible, but start and end dates still define the
              window context. Times may stay blank.
            </span>
          </span>
        </label>

        {windowContextMessage && (
          <WindowContextNotice>{windowContextMessage}</WindowContextNotice>
        )}
      </div>
    </div>
  );
}

function ControlledTextField({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function ControlledNumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <input
        type="number"
        step="0.25"
        min="0"
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function getRouteMileageVariance(
  estimate: RouteEstimate | null,
  paidLoadedMiles: number
) {
  const estimatedLoadedMiles =
    estimate?.loadedEstimate?.estimatedLoadedMiles ?? estimate?.estimatedMiles;

  if (
    estimatedLoadedMiles === null ||
    estimatedLoadedMiles === undefined ||
    !Number.isFinite(paidLoadedMiles) ||
    paidLoadedMiles <= 0
  ) {
    return null;
  }

  return Number((estimatedLoadedMiles - paidLoadedMiles).toFixed(1));
}

type PlanningSuggestion = {
  googleDurationHuman: string;
  googleDurationQuarterHours: number;
  deadheadPlanningHours: number;
  deadheadPlanningDays: number;
  loadedPlanningHours: number;
  loadedPlanningDays: number;
  deadheadBenchmarkHours: number;
  loadedBenchmarkHours: number;
  deadheadBenchmarkDays: number;
  loadedBenchmarkDays: number;
};

function buildPlanningSuggestion(
  values: Partial<LoadInputRawValues>,
  estimate: RouteEstimate | null
): PlanningSuggestion {
  const deadheadMiles =
    positivePlanningNumber(estimate?.deadheadEstimate?.estimatedDeadheadMiles) ||
    positivePlanningNumber(values.routeDeadheadMiles) ||
    positivePlanningNumber(values.deadheadMiles);
  const loadedMiles =
    positivePlanningNumber(estimate?.loadedEstimate?.estimatedLoadedMiles) ||
    positivePlanningNumber(estimate?.estimatedMiles) ||
    positivePlanningNumber(values.routeLoadedMiles) ||
    positivePlanningNumber(values.loadedMiles);
  const deadheadGoogleMinutes = positivePlanningNumber(
    estimate?.deadheadEstimate?.estimatedDeadheadDurationMinutes
  );
  const loadedGoogleMinutes = positivePlanningNumber(
    estimate?.loadedEstimate?.estimatedLoadedDurationMinutes ??
      estimate?.estimatedDurationMinutes
  );
  const totalGoogleMinutes =
    positivePlanningNumber(estimate?.totalEstimate?.estimatedDurationMinutes) ||
    positivePlanningNumber(estimate?.estimatedDurationMinutes) ||
    deadheadGoogleMinutes + loadedGoogleMinutes;
  const deadheadBenchmarkHours = milesToBenchmarkHours(
    deadheadMiles,
    BENCHMARK_MPH
  );
  const loadedBenchmarkHours = milesToBenchmarkHours(loadedMiles, BENCHMARK_MPH);
  const deadheadPlanningHours =
    deadheadGoogleMinutes > 0
      ? minutesToQuarterHours(deadheadGoogleMinutes)
      : deadheadBenchmarkHours;
  const loadedPlanningHours =
    loadedGoogleMinutes > 0
      ? minutesToQuarterHours(loadedGoogleMinutes)
      : loadedBenchmarkHours;

  return {
    googleDurationHuman:
      totalGoogleMinutes > 0 ? minutesToHumanDuration(totalGoogleMinutes) : "",
    googleDurationQuarterHours:
      totalGoogleMinutes > 0 ? minutesToQuarterHours(totalGoogleMinutes) : 0,
    deadheadPlanningHours,
    deadheadPlanningDays: hoursToPlanningDays(
      deadheadPlanningHours,
      PLANNING_HOURS_PER_DAY
    ),
    loadedPlanningHours,
    loadedPlanningDays: hoursToPlanningDays(
      loadedPlanningHours,
      PLANNING_HOURS_PER_DAY
    ),
    deadheadBenchmarkHours,
    loadedBenchmarkHours,
    deadheadBenchmarkDays: hoursToPlanningDays(
      deadheadBenchmarkHours,
      PLANNING_HOURS_PER_DAY
    ),
    loadedBenchmarkDays: hoursToPlanningDays(
      loadedBenchmarkHours,
      PLANNING_HOURS_PER_DAY
    ),
  };
}

function positivePlanningNumber(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  return numeric;
}

function toInputString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeMilitaryTimeDraft(value: string) {
  const trimmed = value.trim();

  if (trimmed.includes(":")) {
    const [hoursValue = "", minutesValue = ""] = trimmed.split(":");
    const hours = hoursValue.replace(/\D/g, "").slice(0, 2);
    const minutes = minutesValue.replace(/\D/g, "").slice(0, 2);

    return hours ? `${hours}:${minutes}` : "";
  }

  const digits = trimmed.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  const hourLength = digits.length === 3 ? 1 : 2;

  return `${digits.slice(0, hourLength)}:${digits.slice(hourLength)}`;
}

function normalizeMilitaryTimeValue(value: unknown) {
  if (value instanceof Date) {
    return toTimeInputValue(value);
  }

  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  const timeOnly = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (timeOnly) {
    return formatMilitaryTimeParts(timeOnly[1], timeOnly[2]);
  }

  const compactTime = /^(\d{1,2})(\d{2})$/.exec(trimmed);
  if (compactTime) {
    return formatMilitaryTimeParts(compactTime[1], compactTime[2]);
  }

  return "";
}

function formatMilitaryTimeParts(hoursValue: string, minutesValue: string) {
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "";
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function hasBroadWindow(
  date: string | undefined,
  time?: string,
  windowStart?: string,
  windowEnd?: string,
  openEnded?: boolean
) {
  return Boolean(
    toDateInputValue(date) &&
      !toTimeInputValue(time) &&
      !toTimeInputValue(windowStart) &&
      !toTimeInputValue(windowEnd) &&
      !openEnded
  );
}

function getWindowContextMessage({
  appointmentDate,
  appointmentTime,
  windowStartDate,
  windowStartTime,
  windowEndDate,
  windowEndTime,
  openEnded,
}: {
  appointmentDate?: string;
  appointmentTime?: string;
  windowStartDate?: string;
  windowStartTime?: string;
  windowEndDate?: string;
  windowEndTime?: string;
  openEnded?: boolean;
}) {
  const normalizedAppointmentDate = toDateInputValue(appointmentDate);
  const normalizedAppointmentTime = toTimeInputValue(appointmentTime);
  const normalizedStartDate = toDateInputValue(windowStartDate);
  const normalizedStartTime = toTimeInputValue(windowStartTime);
  const normalizedEndDate = toDateInputValue(windowEndDate);
  const normalizedEndTime = toTimeInputValue(windowEndTime);

  if (openEnded && (!normalizedStartDate || !normalizedEndDate)) {
    return "Open-ended windows still need start and end dates. Times can stay blank for broad date context.";
  }

  if (normalizedStartDate && !normalizedEndDate) {
    return "Window start date is set. Add an end date or clear the start date to avoid incomplete window context.";
  }

  if (!normalizedStartDate && normalizedEndDate) {
    return "Window end date is set. Add a start date or clear the end date to avoid incomplete window context.";
  }

  if (
    normalizedStartDate &&
    normalizedEndDate &&
    !normalizedStartTime &&
    !normalizedEndTime
  ) {
    return "Start and end dates captured without exact times. LoadIQ treats this as broad date-window context.";
  }

  if (
    normalizedAppointmentDate &&
    !normalizedAppointmentTime &&
    !normalizedStartDate &&
    !normalizedEndDate &&
    !normalizedStartTime &&
    !normalizedEndTime &&
    !openEnded
  ) {
    return "Date captured without a fixed time/window. LoadIQ treats this as broad planning context, not an input error.";
  }

  return "";
}

function normalizeScheduleInputValues(
  values: LoadInputFormValues
): LoadInputFormValues {
  const pickupWindow = normalizeWindowDates({
    appointmentDate: values.pickupDate,
    startDate: values.pickupWindowStartDate,
    endDate: values.pickupWindowEndDate,
  });
  const deliveryWindow = normalizeWindowDates({
    appointmentDate: values.deliveryDate,
    startDate: values.deliveryWindowStartDate,
    endDate: values.deliveryWindowEndDate,
  });

  return {
    ...values,
    deadheadStartDate: toDateInputValue(values.deadheadStartDate),
    deadheadStartTime: toTimeInputValue(values.deadheadStartTime),
    deadheadEndDate: toDateInputValue(values.deadheadEndDate),
    pickupDate: toDateInputValue(values.pickupDate),
    pickupTime: toTimeInputValue(values.pickupTime),
    pickupWindowStartDate: pickupWindow.startDate,
    pickupWindowStart: toTimeInputValue(values.pickupWindowStart),
    pickupWindowEndDate: pickupWindow.endDate,
    pickupWindowEnd: toTimeInputValue(values.pickupWindowEnd),
    deliveryDate: toDateInputValue(values.deliveryDate),
    deliveryTime: toTimeInputValue(values.deliveryTime),
    deliveryWindowStartDate: deliveryWindow.startDate,
    deliveryWindowStart: toTimeInputValue(values.deliveryWindowStart),
    deliveryWindowEndDate: deliveryWindow.endDate,
    deliveryWindowEnd: toTimeInputValue(values.deliveryWindowEnd),
    routeStops: values.routeStops.map((stop) => {
      const stopWindow = normalizeWindowDates({
        appointmentDate: stop.appointmentDate,
        startDate: stop.appointmentWindowStartDate,
        endDate: stop.appointmentWindowEndDate,
      });

      return {
        ...stop,
        appointmentDate: toDateInputValue(stop.appointmentDate),
        appointmentTime: toTimeInputValue(stop.appointmentTime),
        appointmentWindowStartDate: stopWindow.startDate,
        appointmentWindowStart: toTimeInputValue(stop.appointmentWindowStart),
        appointmentWindowEndDate: stopWindow.endDate,
        appointmentWindowEnd: toTimeInputValue(stop.appointmentWindowEnd),
      };
    }),
  };
}

function normalizeWindowDates({
  appointmentDate,
  startDate,
  endDate,
}: {
  appointmentDate: string;
  startDate: string;
  endDate: string;
}) {
  const normalizedAppointmentDate = toDateInputValue(appointmentDate);
  const normalizedStartDate = toDateInputValue(startDate);
  const normalizedEndDate = toDateInputValue(endDate);

  if (!normalizedStartDate && !normalizedEndDate && normalizedAppointmentDate) {
    return {
      startDate: normalizedAppointmentDate,
      endDate: normalizedAppointmentDate,
    };
  }

  return {
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
  };
}

function normalizeFscSourceMode(value: unknown): FscSourceMode {
  if (
    value === "actual_fsc_entered" ||
    value === "fsc_built_into_gross" ||
    value === "fsc_separate_missing" ||
    value === "unknown"
  ) {
    return value;
  }

  return "actual_fsc_entered";
}

function getFscModeHelpText(mode: FscSourceMode) {
  if (mode === "fsc_built_into_gross") {
    return "Karpilo FSC Intelligence will estimate the FSC portion built into the entered gross and separate it from estimated linehaul for decision support.";
  }

  if (mode === "fsc_separate_missing") {
    return "Karpilo FSC Intelligence will estimate separate FSC and add it to the revenue model because the actual FSC amount is missing.";
  }

  if (mode === "unknown") {
    return "FSC treatment is unknown. The calculator will keep the load conservative and show education-only FSC context in the readout.";
  }

  return "User-entered FSC is treated as the source of truth.";
}

function RouteWarnings({ estimate }: { estimate: RouteEstimate }) {
  const warnings = estimate.warnings
    .filter((warning) => warning !== estimate.disclaimer)
    .slice(0, 3);

  if (warnings.length === 0) return null;

  return (
    <ul className="space-y-1 text-slate-400">
      {warnings.map((warning) => (
        <li key={warning}>- {warning}</li>
      ))}
    </ul>
  );
}

function createRouteStopId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

function InputField({ label, error, ...props }: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>

      <input
        {...props}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />

      {error && (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      )}
    </label>
  );
}
