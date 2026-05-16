"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AccessorialManager } from "@/components/calculator/accessorial-manager";
import { LearnMore } from "@/components/ui/learn-more";
import {
  defaultLoadInputValues,
  loadInputSchema,
  LoadInputFormValues,
} from "@/lib/load-schema";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { getDieselPrice } from "@/services/fuel-prices";
import { AccessorialInputItem } from "@/types/accessorial";
import { ProfileDerivedValues } from "@/types/load";
import { formatCurrency, formatRpm } from "@/utils/format";

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
  const [profileValues, setProfileValues] =
    useState<ProfileDerivedValues | null>(null);
  const [overrideFields, setOverrideFields] = useState<Record<string, boolean>>(
    {}
  );
  const userOverrodeFuelPrice = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    getValues,
    control,
    formState: { errors },
  } = useForm<LoadInputRawValues>({
    resolver: zodResolver(loadInputSchema),
    defaultValues: defaultLoadInputValues,
  });
  const watchedValues = useWatch({ control });

  useEffect(() => {
    async function loadDefaults() {
      try {
        const defaults = await getCalculatorDefaults();
        const derivedValues: ProfileDerivedValues = {
          dailyFixedOverhead: defaults.dailyOverhead,
          operatingDaysPerWeek: defaults.operatingDaysPerWeek,
          operatingDaysPerMonth: defaults.operatingDaysPerMonth,
          dispatchPercent: defaults.dispatchPercent,
          factoringPercent: defaults.factoringPercent,
          maintenanceReserve: defaults.maintenanceReserve,
          tireReserve: defaults.tireReserve,
          trailerFee: defaults.trailerFee,
          insuranceAllocation: defaults.insuranceAllocation,
          variableCostPerMile: defaults.variableCostPerMile,
          fixedCostAllocation: defaults.fixedCostAllocation,
          mpg: defaults.defaultMpg,
          targetTrueRpm: defaults.targetTrueRpm,
          incomeTargetDaily: defaults.incomeTargetDaily,
          incomeTargetWeekly: defaults.incomeTargetWeekly,
          minimumHourlyProfitability: defaults.minimumHourlyProfitability,
        };

        setProfileValues(derivedValues);
        setValue("profileDerivedValues", derivedValues);
        setValue("temporaryOverrides", {});
        setValue("calculationSource", "profile");
        setValue("overhead", defaults.dailyOverhead, {
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
    queueMicrotask(() => {
      setProfileValues(initialValues.profileDerivedValues);
      setOverrideFields(
        Object.keys(initialValues.temporaryOverrides ?? {}).reduce<
          Record<string, boolean>
        >((accumulator, key) => {
          accumulator[key] = true;
          return accumulator;
        }, {})
      );
    });
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
      profileDerivedValues: profileValues ?? values.profileDerivedValues,
    });

    const derivedLinehaul =
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
        ? derivedLinehaul / parsedValues.loadedMiles
        : parsedValues.ratePerMile;

    onCalculate({
      ...parsedValues,
      ratePerMile: derivedRatePerMile,
      grossRevenue:
        parsedValues.revenueInputMode === "gross"
          ? parsedValues.grossRevenue
          : derivedLinehaul + parsedValues.fuelSurcharge,
    });
  }

  function handleManualFuelOverride() {
    userOverrodeFuelPrice.current = true;
    setValue("fuelPriceSource", "USER_OVERRIDE");
    setValue("fuelPriceIsEstimate", false);
    setFuelStatus("User override · actual fuel price");
  }

  function enableTemporaryOverride(field: keyof ProfileDerivedValues) {
    setOverrideFields((current) => ({
      ...current,
      [field]: true,
    }));
    setValue("calculationSource", "temporary_override");
  }

  function recordTemporaryOverride(
    field: keyof ProfileDerivedValues,
    value: number
  ) {
    setValue(fieldToInputName(field), value, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(
      "temporaryOverrides",
      {
        ...(getValues("temporaryOverrides") ?? {}),
        [field]: value,
      },
      {
        shouldDirty: true,
      }
    );
    setValue("calculationSource", "temporary_override");
  }

  function fieldToInputName(field: keyof ProfileDerivedValues) {
    const map = {
      dailyFixedOverhead: "overhead",
      dispatchPercent: "dispatchPercent",
      factoringPercent: "factoringPercent",
      maintenanceReserve: "maintenanceReserve",
      tireReserve: "tireReserve",
      trailerFee: "trailerFee",
      insuranceAllocation: "insuranceAllocation",
      variableCostPerMile: "variableCostPerMile",
      fixedCostAllocation: "fixedCostAllocation",
      mpg: "mpg",
      targetTrueRpm: "targetTrueRpm",
      operatingDaysPerWeek: "overhead",
      operatingDaysPerMonth: "overhead",
      incomeTargetDaily: "targetTrueRpm",
      incomeTargetWeekly: "targetTrueRpm",
      minimumHourlyProfitability: "targetTrueRpm",
    } satisfies Record<keyof ProfileDerivedValues, keyof LoadInputRawValues>;

    return map[field];
  }

  function watchedNumber(name: keyof LoadInputRawValues, fallback: number) {
    const value = watchedValues?.[name];
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  const fuelPriceField = register("fuelPrice");
  const fuelSurchargeIncludedField = register("fuelSurchargeIncludedInGross");
  const revenueInputMode = watchedValues?.revenueInputMode ?? "rpm";
  const fuelSurchargeIncludedInGross = Boolean(
    watchedValues?.fuelSurchargeIncludedInGross
  );

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-8">
      <input type="hidden" {...register("fuelPriceSource")} />
      <input type="hidden" {...register("fuelPriceSourceLabel")} />
      <input type="hidden" {...register("fuelPriceRegion")} />
      <input type="hidden" {...register("fuelPricePeriod")} />
      <input type="hidden" {...register("fuelPriceFetchedAt")} />
      <input type="hidden" {...register("fuelPriceExpiresAt")} />
      <input type="hidden" {...register("loadRunStatus")} />
      <input type="hidden" {...register("overhead")} />
      <input type="hidden" {...register("mpg")} />
      <input type="hidden" {...register("maintenanceReserve")} />
      <input type="hidden" {...register("tireReserve")} />
      <input type="hidden" {...register("trailerFee")} />
      <input type="hidden" {...register("insuranceAllocation")} />
      <input type="hidden" {...register("variableCostPerMile")} />
      <input type="hidden" {...register("fixedCostAllocation")} />
      <input type="hidden" {...register("dispatchPercent")} />
      <input type="hidden" {...register("factoringPercent")} />
      <input type="hidden" {...register("targetTrueRpm")} />
      <input type="hidden" {...register("calculationSource")} />
      <input type="hidden" {...register("revenueInputMode")} />

      <section className="space-y-4">
        <SectionTitle title="Load Identity" />

        <InputField
          label="Trip Number / Broker Reference"
          error={errors.loadNumber?.message}
          {...register("loadNumber")}
        />
        <p className="text-xs leading-5 text-slate-500">
          Karpilo LoadIQ assigns the system Load ID when the load is saved. Use
          this field only for broker, dispatcher, carrier, or customer trip
          references. If left blank, the saved load can use an AUTO trip number.
        </p>
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
        <SectionTitle title="Profile-Controlled Values" />

        <LearnMore
          title="Profile values in the calculator"
          summary="LoadIQ uses final values from Settings so you do not re-enter recurring business assumptions."
          detail="Profile-controlled values are read-only by default. If a load needs a one-time change, use a temporary override. Overrides are saved with the calculation but do not update your profile unless you change Settings yourself."
        />

        {!profileValues && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs leading-6 text-red-200">
            Profile defaults are not fully loaded. Manual entry remains active,
            but completing Settings improves overhead, MPG, and deduction
            accuracy.
          </p>
        )}

        {profileValues && (
          <div className="grid gap-3">
            <ProfileValueField
              label="Daily Fixed Overhead"
              value={watchedNumber("overhead", profileValues.dailyFixedOverhead)}
              formatter={formatCurrency}
              help="Your profile stores fixed business costs. LoadIQ converts them into a daily overhead number so each load only carries the cost for the days it uses your truck."
              isOverride={overrideFields.dailyFixedOverhead}
              onEnableOverride={() => enableTemporaryOverride("dailyFixedOverhead")}
              onOverride={(value) =>
                recordTemporaryOverride("dailyFixedOverhead", value)
              }
            />
            <ProfileValueField
              label="Default MPG"
              value={watchedNumber("mpg", profileValues.mpg)}
              formatter={(value) => `${value.toFixed(2)} MPG`}
              help="Your truck profile MPG is used as the fuel burn baseline. Override only when this load has a different operating expectation."
              isOverride={overrideFields.mpg}
              onEnableOverride={() => enableTemporaryOverride("mpg")}
              onOverride={(value) => recordTemporaryOverride("mpg", value)}
            />
            <ProfileValueField
              label="Dispatch Deduction"
              value={watchedNumber(
                "dispatchPercent",
                profileValues.dispatchPercent
              )}
              formatter={(value) => `${value.toFixed(2)}%`}
              help="This percentage comes from your operational profile and is applied against gross load revenue."
              isOverride={overrideFields.dispatchPercent}
              onEnableOverride={() => enableTemporaryOverride("dispatchPercent")}
              onOverride={(value) =>
                recordTemporaryOverride("dispatchPercent", value)
              }
            />
            <ProfileValueField
              label="Factoring Deduction"
              value={watchedNumber(
                "factoringPercent",
                profileValues.factoringPercent
              )}
              formatter={(value) => `${value.toFixed(2)}%`}
              help="This percentage comes from your profile or active percentage overhead items."
              isOverride={overrideFields.factoringPercent}
              onEnableOverride={() => enableTemporaryOverride("factoringPercent")}
              onOverride={(value) =>
                recordTemporaryOverride("factoringPercent", value)
              }
            />
            <ProfileValueField
              label="Variable Cost / Mile"
              value={
                watchedNumber(
                  "variableCostPerMile",
                  profileValues.variableCostPerMile
                )
              }
              formatter={formatRpm}
              help="Variable cost per mile comes from Settings and CPM overhead items such as maintenance reserves or wear allowances."
              isOverride={overrideFields.variableCostPerMile}
              onEnableOverride={() =>
                enableTemporaryOverride("variableCostPerMile")
              }
              onOverride={(value) =>
                recordTemporaryOverride("variableCostPerMile", value)
              }
            />
            <ProfileValueField
              label="Target True RPM"
              value={watchedNumber("targetTrueRpm", profileValues.targetTrueRpm)}
              formatter={formatRpm}
              help="Your target true RPM is the operating guardrail LoadIQ uses to flag weak freight."
              isOverride={overrideFields.targetTrueRpm}
              onEnableOverride={() => enableTemporaryOverride("targetTrueRpm")}
              onOverride={(value) =>
                recordTemporaryOverride("targetTrueRpm", value)
              }
            />
          </div>
        )}

        <LinkToSettings />
      </section>

      <section className="space-y-4">
        <SectionTitle title="Financial Inputs" />

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-[#060B14] p-2">
          <button
            type="button"
            onClick={() => setValue("revenueInputMode", "rpm", { shouldDirty: true })}
            className={
              revenueInputMode === "rpm"
                ? "rounded-lg bg-sky-400 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#060B14]"
                : "rounded-lg border border-slate-800 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400"
            }
          >
            RPM
          </button>
          <button
            type="button"
            onClick={() => setValue("revenueInputMode", "gross", { shouldDirty: true })}
            className={
              revenueInputMode === "gross"
                ? "rounded-lg bg-sky-400 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#060B14]"
                : "rounded-lg border border-slate-800 px-3 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400"
            }
          >
            Gross
          </button>
        </div>

        {revenueInputMode === "gross" ? (
          <InputField
            label="Gross Revenue"
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

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Fuel Surcharge"
            type="number"
            step="0.01"
            error={errors.fuelSurcharge?.message}
            {...register("fuelSurcharge")}
          />
        </div>

        {revenueInputMode === "gross" && (
          <label className="flex items-start gap-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-5 text-sky-100">
            <input
              {...fuelSurchargeIncludedField}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-[#060B14]"
              checked={fuelSurchargeIncludedInGross}
              onChange={(event) => {
                void fuelSurchargeIncludedField.onChange(event);
                setValue("fuelSurchargeIncludedInGross", event.target.checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <span>
              Fuel surcharge is already included in gross revenue. Karpilo
              LoadIQ will subtract the FSC before deriving linehaul RPM so it is
              not counted twice.
            </span>
          </label>
        )}

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
          and target profitability come from Settings. Overhead is applied as
          daily overhead × dispatch days, not as a full monthly cost on one load.
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

function LinkToSettings() {
  return (
    <a
      href="/dashboard/settings"
      className="inline-flex text-xs font-bold uppercase tracking-[0.18em] text-sky-300 underline decoration-sky-400/40 underline-offset-4 transition hover:text-sky-200"
    >
      Edit profile values in Settings
    </a>
  );
}

type ProfileValueFieldProps = {
  label: string;
  value: number;
  formatter: (value: number) => string;
  help: string;
  isOverride?: boolean;
  onEnableOverride: () => void;
  onOverride: (value: number) => void;
};

function ProfileValueField({
  label,
  value,
  formatter,
  help,
  isOverride = false,
  onEnableOverride,
  onOverride,
}: ProfileValueFieldProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {label}
            </span>
            <Badge tone={isOverride ? "red" : "sky"}>
              {isOverride ? "Temporary Override" : "From Profile"}
            </Badge>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{help}</p>
        </div>

        <div className="min-w-32 text-left sm:text-right">
          {isOverride ? (
            <input
              type="number"
              step="0.01"
              defaultValue={value}
              onChange={(event) => onOverride(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-red-500/30 bg-red-500/5 px-3 text-base font-black text-red-100 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20 sm:w-36"
            />
          ) : (
            <div className="text-lg font-black text-slate-100">
              {formatter(value)}
            </div>
          )}

          {!isOverride && (
            <button
              type="button"
              onClick={onEnableOverride}
              className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-sky-300 transition hover:text-sky-200"
            >
              Override Once
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "sky" | "red";
}) {
  return (
    <span
      className={
        tone === "sky"
          ? "rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-sky-200"
          : "rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-red-200"
      }
    >
      {children}
    </span>
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
