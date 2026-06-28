"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AccessorialManager } from "@/components/calculator/accessorial-manager";
import {
  defaultLoadInputValues,
  loadInputSchema,
  LoadInputFormValues,
} from "@/lib/load-schema";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { getDieselPrice } from "@/services/fuel-prices";
import {
  DeadheadContinuitySuggestion,
  getDeadheadContinuitySuggestion,
} from "@/services/saved-load-input";
import { buildOdometerValidation, isRunningLoadStatus } from "@/services/trip-validation";
import { AccessorialInputItem } from "@/types/accessorial";
import { LOAD_RUN_STATUS_OPTIONS } from "@/lib/fuel-gauge";
import {
  GOOGLE_ROUTE_DISCLAIMER,
  RouteEstimate,
  RouteEstimateResponse,
  RouteStopKind,
  TRIMBLE_ROUTE_PLACEHOLDER,
} from "@/types/route-intelligence";
import { RouteStopInput } from "@/types/load";

type LoadInputRawValues = z.input<typeof loadInputSchema>;

type LoadInputFormProps = {
  onCalculate: (values: LoadInputFormValues) => void;
  initialValues?: LoadInputFormValues | null;
  previewMode?: boolean;
};

export function LoadInputForm({
  onCalculate,
  initialValues,
  previewMode = false,
}: LoadInputFormProps) {
  const [accessorialItems, setAccessorialItems] = useState<
    AccessorialInputItem[]
  >([]);
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
  const watchedPaidLoadedMiles = useWatch({
    control,
    name: "loadedMiles",
  });
  const paidLoadedMiles = Number(watchedPaidLoadedMiles ?? 0);
  const revenueInputMode =
    useWatch({ control, name: "revenueInputMode" }) ?? "rpm";
  const fuelSurchargeIncludedInGross = Boolean(
    useWatch({ control, name: "fuelSurchargeIncludedInGross" })
  );
  const routeStops = (useWatch({ control, name: "routeStops" }) ??
    []) as RouteStopInput[];
  const loadRunStatus =
    useWatch({ control, name: "loadRunStatus" }) ?? "planned";
  const deadheadMiles = Number(useWatch({ control, name: "deadheadMiles" }) ?? 0);
  const originOdometer = Number(
    useWatch({ control, name: "originOdometer" }) ?? 0
  );
  const endOdometer = Number(useWatch({ control, name: "endOdometer" }) ?? 0);
  const routeMileageVariance = getRouteMileageVariance(
    routeEstimate,
    paidLoadedMiles
  );
  const odometerValidation = buildOdometerValidation({
    originOdometer,
    endOdometer,
    estimatedTotalMiles:
      routeEstimate?.totalEstimate?.estimatedMiles ??
      deadheadMiles + paidLoadedMiles,
    paidLoadedMiles,
    capturedAtStatus: loadRunStatus,
  });
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
          setValue("fuelPrice", fuel.fuel.pricePerGallon, {
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

    reset(initialValues);
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
      setAccessorialItems(initialValues.accessorialItems);
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
    const submittedOdometerValidation = buildOdometerValidation({
      originOdometer: Number(values.originOdometer ?? 0),
      endOdometer: Number(values.endOdometer ?? 0),
      estimatedTotalMiles:
        routeEstimate?.totalEstimate?.estimatedMiles ??
        Number(values.loadedMiles ?? 0) + Number(values.deadheadMiles ?? 0),
      paidLoadedMiles: paidMiles,
      capturedAtStatus: String(values.loadRunStatus ?? "planned"),
    });
    const submittedRouteEstimate = routeEstimate
      ? {
          ...routeEstimate,
          routeMileageVariance: getRouteMileageVariance(
            routeEstimate,
            paidMiles
          ),
        }
      : null;
    const parsedValues = loadInputSchema.parse({
      ...values,
      accessorialItems,
      routeEstimate: submittedRouteEstimate,
      actualTotalMiles: submittedOdometerValidation.actualTotalMiles ?? 0,
      odometerValidation: submittedOdometerValidation,
    });
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
          stopType: "intermediate_stop",
          label: "",
          address: "",
          city: "",
          state: "",
          zip: "",
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

  async function handleRouteEstimate() {
    const values = getValues();
    const pickupAddress = buildRouteAddress(values, "pickup");
    const deliveryAddress = buildRouteAddress(values, "delivery");
    const deadheadOrigin = buildDeadheadAddress(values);
    const stops = routeStops
      .map((stop, index) => ({
        id: stop.id,
        address: buildStopAddress(stop),
        label: stop.label || `Stop ${index + 1}`,
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
    } catch {
      setRouteStatus(
        "Route estimate unavailable. Manual mileage entry remains active."
      );
      setRouteEstimate(null);
      setValue("routeEstimate", null, {
        shouldDirty: true,
      });
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

  const fuelPriceField = register("fuelPrice");

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
        <SectionTitle title="Load Identity" />

        <InputField
          label="Load Number"
          error={errors.loadNumber?.message}
          {...register("loadNumber")}
        />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Route Intelligence" />

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
                Deadhead
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Suggested deadhead origin from previous delivery is optional and
                can be edited or cleared.
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
          </div>
        </div>

        <InputField
          label="Pickup Address"
          placeholder="Street, dock, or facility"
          error={errors.pickupAddress?.message}
          {...register("pickupAddress")}
        />

        <InputField
          label="Delivery Address"
          placeholder="Street, dock, or facility"
          error={errors.deliveryAddress?.message}
          {...register("deliveryAddress")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Pickup ZIP"
            error={errors.pickupZip?.message}
            {...register("pickupZip")}
          />

          <InputField
            label="Delivery ZIP"
            error={errors.deliveryZip?.message}
            {...register("deliveryZip")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>

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
              Add fuel, DEF, scale, rest, customer, or other intermediate stops
              when they are part of the planned loaded route.
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

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Paid loaded miles"
            type="number"
            error={errors.loadedMiles?.message}
            {...register("loadedMiles")}
          />

          <InputField
            label="Deadhead Miles"
            type="number"
            error={errors.deadheadMiles?.message}
            {...register("deadheadMiles")}
          />
        </div>

        <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-400">
          Paid loaded miles are the miles you are paid on. Google estimated
          miles are planning estimates only.
        </p>

        <button
          type="button"
          onClick={handleRouteEstimate}
          disabled={isEstimatingRoute}
          className="w-full rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
        >
          {isEstimatingRoute ? "Estimating Route" : "Estimate Route Miles"}
        </button>

        {(routeStatus || routeEstimate) && (
          <div className="space-y-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-5 text-slate-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-sky-200">
                Google estimate
              </p>
              {routeStatus && <p className="text-slate-400">{routeStatus}</p>}
            </div>

            {routeEstimate && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {routeEstimate.deadheadEstimate?.origin && (
                    <RouteValue
                      label="Deadhead origin verified"
                      value={
                        routeEstimate.deadheadEstimate.origin.formattedAddress
                      }
                    />
                  )}
                  <RouteValue
                    label="Pickup verified"
                    value={routeEstimate.origin.formattedAddress}
                  />
                  <RouteValue
                    label="Delivery verified"
                    value={routeEstimate.destination.formattedAddress}
                  />
                  <RouteValue
                    label="Google estimated deadhead miles"
                    value={formatOptionalMiles(
                      routeEstimate.deadheadEstimate
                        ?.estimatedDeadheadMiles ?? null
                    )}
                  />
                  <RouteValue
                    label="Google estimated loaded miles"
                    value={formatOptionalMiles(
                      routeEstimate.loadedEstimate?.estimatedLoadedMiles ??
                        routeEstimate.estimatedMiles
                    )}
                  />
                  <RouteValue
                    label="Total Google estimated route miles"
                    value={formatOptionalMiles(
                      routeEstimate.totalEstimate?.estimatedMiles ??
                        routeEstimate.estimatedMiles
                    )}
                  />
                  <RouteValue
                    label="Estimated drive time"
                    value={formatOptionalMinutes(
                      routeEstimate.totalEstimate?.estimatedDurationMinutes ??
                        routeEstimate.estimatedDurationMinutes
                    )}
                  />
                  <RouteValue
                    label="Mileage variance"
                    value={
                      routeMileageVariance === null
                        ? "Enter paid miles"
                        : formatSignedMiles(routeMileageVariance)
                    }
                  />
                </div>

                {routeEstimate.routeLegs && routeEstimate.routeLegs.length > 0 && (
                  <div className="rounded-lg border border-slate-800 bg-[#060B14] p-3">
                    <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500">
                      Route Legs
                    </p>
                    <div className="space-y-2">
                      {routeEstimate.routeLegs.map((leg) => (
                        <div
                          key={`${leg.fromLabel}-${leg.toLabel}`}
                          className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-slate-400">
                            {leg.fromLabel} to {leg.toLabel}
                          </span>
                          <span className="font-semibold text-slate-200">
                            {formatOptionalMiles(leg.estimatedMiles)} ·{" "}
                            {formatOptionalMinutes(
                              leg.estimatedDurationMinutes
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {routeEstimate.estimatedMiles !== null && (
                  <button
                    type="button"
                    onClick={handleUseEstimateAsPaidMiles}
                    className="rounded-xl border border-slate-700 bg-[#060B14] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
                  >
                    Use Estimate As Paid Miles
                  </button>
                )}

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
      </section>

      <section className="space-y-4">
        <SectionTitle title="Operational Timing" />

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

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Dispatch Days"
            type="number"
            step="0.25"
            error={errors.dispatchDays?.message}
            {...register("dispatchDays")}
          />

          <InputField
            label="Deadhead Days"
            type="number"
            step="0.25"
            error={errors.deadheadDays?.message}
            {...register("deadheadDays")}
          />
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
                <InputField
                  label="End Odometer"
                  type="number"
                  step="1"
                  error={errors.endOdometer?.message}
                  {...register("endOdometer")}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <RouteValue
                  label="Actual odometer miles"
                  value={formatOptionalMiles(
                    odometerValidation.actualTotalMiles ?? null
                  )}
                />
                <RouteValue
                  label="Variance vs estimate"
                  value={
                    odometerValidation.odometerVarianceVsEstimated ===
                    undefined
                      ? "Unavailable"
                      : formatSignedMiles(
                          odometerValidation.odometerVarianceVsEstimated
                        )
                  }
                />
                <RouteValue
                  label="Variance vs paid"
                  value={
                    odometerValidation.odometerVarianceVsPaid === undefined
                      ? "Unavailable"
                      : formatSignedMiles(
                          odometerValidation.odometerVarianceVsPaid
                        )
                  }
                />
              </div>

              {odometerValidation.warnings.length > 0 && (
                <ul className="space-y-1 text-xs text-amber-200">
                  {odometerValidation.warnings.map((warning) => (
                    <li key={warning}>- {warning}</li>
                  ))}
                </ul>
              )}
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
        <SectionTitle title="Financial Inputs" />

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

          <InputField
            label="Fuel Surcharge"
            type="number"
            step="0.01"
            error={errors.fuelSurcharge?.message}
            {...register("fuelSurcharge")}
          />
        </div>

        {revenueInputMode === "gross" && (
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

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Fuel Price"
            type="number"
            step="0.01"
            error={errors.fuelPrice?.message}
            {...fuelPriceField}
            onChange={(event) => {
              void fuelPriceField.onChange(event);
              handleManualFuelOverride();
            }}
          />
        </div>

        {fuelStatus && (
          <div className="space-y-2 rounded-xl border border-sky-400/20 bg-sky-400/5 p-3 text-xs leading-5 text-slate-300">
            <p className="font-semibold text-sky-200">{fuelStatus}</p>
            <p className="text-slate-500">
              Fuel pricing uses the EIA diesel baseline when available. You can
              override it with your actual purchase price. EIA data is provided
              for informational estimation purposes only and does not imply
              endorsement.
            </p>
          </div>
        )}

        <AccessorialManager
          items={accessorialItems}
          onChange={setAccessorialItems}
        />

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Tolls"
            type="number"
            step="0.01"
            error={errors.tolls?.message}
            {...register("tolls")}
          />

          <InputField
            label="Lumpers"
            type="number"
            step="0.01"
            error={errors.lumpers?.message}
            {...register("lumpers")}
          />
        </div>

        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          Operational overhead, pay template, MPG, reserves, dispatch, factoring,
          and target profitability come from Settings.
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

const ROUTE_STOP_KIND_OPTIONS: Array<{
  value: RouteStopKind;
  label: string;
}> = [
  { value: "intermediate_stop", label: "Intermediate stop" },
  { value: "fuel", label: "Fuel" },
  { value: "def", label: "DEF" },
  { value: "scale", label: "Scale" },
  { value: "rest", label: "Rest" },
  { value: "customer", label: "Customer" },
  { value: "other", label: "Other" },
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
          label="Stop Label"
          value={stop.label ?? ""}
          onChange={(value) => onChange({ label: value })}
        />

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
    </div>
  );
}

function ControlledTextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function RouteValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words font-semibold text-slate-200">
        {value}
      </div>
    </div>
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

function formatOptionalMiles(value: number | null | undefined) {
  if (value === null || value === undefined) return "Unavailable";

  return `${value.toLocaleString()} mi`;
}

function formatOptionalMinutes(value: number | null | undefined) {
  if (value === null || value === undefined) return "Unavailable";

  return `${value.toLocaleString()} min`;
}

function formatSignedMiles(value: number) {
  if (value === 0) return "0 mi";

  const prefix = value > 0 ? "+" : "";

  return `${prefix}${value.toLocaleString()} mi`;
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
