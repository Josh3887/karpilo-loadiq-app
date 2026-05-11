"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
  const userOverrodeFuelPrice = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LoadInputRawValues>({
    resolver: zodResolver(loadInputSchema),
    defaultValues: defaultLoadInputValues,
  });

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
    });
  }, [initialValues, reset]);

  function submit(values: LoadInputRawValues) {
    const parsedValues = loadInputSchema.parse({
      ...values,
      accessorialItems,
    });

    onCalculate(parsedValues);
  }

  function handleManualFuelOverride() {
    userOverrodeFuelPrice.current = true;
    setValue("fuelPriceSource", "USER_OVERRIDE");
    setValue("fuelPriceIsEstimate", false);
    setFuelStatus("User override · actual fuel price");
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Loaded Miles"
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

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="RPM"
            type="number"
            step="0.01"
            error={errors.ratePerMile?.message}
            {...register("ratePerMile")}
          />

          <InputField
            label="Fuel Surcharge"
            type="number"
            step="0.01"
            error={errors.fuelSurcharge?.message}
            {...register("fuelSurcharge")}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
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
              Fuel estimates may utilize publicly available U.S. Energy
              Information Administration (EIA) data. EIA data is provided for
              informational estimation purposes only and does not imply
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
