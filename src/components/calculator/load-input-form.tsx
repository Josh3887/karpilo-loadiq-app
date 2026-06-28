"use client";

import { useEffect, useRef, useState } from "react";
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
import { AccessorialInputItem } from "@/types/accessorial";
import {
  GOOGLE_ROUTE_DISCLAIMER,
  RouteEstimate,
  RouteEstimateResponse,
  TRIMBLE_ROUTE_PLACEHOLDER,
} from "@/types/route-intelligence";

type LoadInputRawValues = z.input<typeof loadInputSchema>;

type LoadInputFormProps = {
  onCalculate: (values: LoadInputFormValues) => void;
  initialValues?: LoadInputFormValues | null;
};

export function LoadInputForm({
  onCalculate,
  initialValues,
}: LoadInputFormProps) {
  const [accessorialItems, setAccessorialItems] = useState<
    AccessorialInputItem[]
  >([]);
  const [fuelStatus, setFuelStatus] = useState("");
  const [routeStatus, setRouteStatus] = useState("");
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(
    initialValues?.routeEstimate ?? null
  );
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
  const routeMileageVariance = getRouteMileageVariance(
    routeEstimate,
    paidLoadedMiles
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

  function submit(values: LoadInputRawValues) {
    const paidMiles = Number(values.loadedMiles ?? 0);
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

  async function handleRouteEstimate() {
    const values = getValues();
    const origin = buildRouteAddress(values, "pickup");
    const destination = buildRouteAddress(values, "delivery");

    if (origin.length < 3 || destination.length < 3) {
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
          origin,
          destination,
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
        estimate?.estimatedMiles !== null &&
        estimate?.estimatedMiles !== undefined
      ) {
        setValue("routeLoadedMiles", estimate.estimatedMiles, {
          shouldDirty: true,
          shouldValidate: true,
        });
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
    if (
      routeEstimate?.estimatedMiles === null ||
      routeEstimate?.estimatedMiles === undefined
    ) {
      return;
    }

    setValue("loadedMiles", routeEstimate.estimatedMiles, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setRouteStatus(
      "Google estimate copied into paid loaded miles by user action."
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

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Paid Loaded Miles"
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
                  <RouteValue
                    label="Pickup verified"
                    value={routeEstimate.origin.formattedAddress}
                  />
                  <RouteValue
                    label="Delivery verified"
                    value={routeEstimate.destination.formattedAddress}
                  />
                  <RouteValue
                    label="Google estimated route miles"
                    value={
                      routeEstimate.estimatedMiles === null
                        ? "Unavailable"
                        : `${routeEstimate.estimatedMiles.toLocaleString()} mi`
                    }
                  />
                  <RouteValue
                    label="Estimated drive time"
                    value={
                      routeEstimate.estimatedDurationMinutes === null
                        ? "Unavailable"
                      : `${routeEstimate.estimatedDurationMinutes.toLocaleString()} min`
                    }
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
            <p className="text-slate-500">{TRIMBLE_ROUTE_PLACEHOLDER}</p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Operational Timing" />

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
  if (
    estimate?.estimatedMiles === null ||
    estimate?.estimatedMiles === undefined ||
    !Number.isFinite(paidLoadedMiles) ||
    paidLoadedMiles <= 0
  ) {
    return null;
  }

  return Number((estimate.estimatedMiles - paidLoadedMiles).toFixed(1));
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
