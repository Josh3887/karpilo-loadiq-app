"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FieldErrors, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { AtlasEducationalSignal } from "@/components/ai/atlas-educational-signal";
import { AccessorialManager } from "@/components/calculator/accessorial-manager";
import {
  type PreviewExplanationKey,
  usePreviewMode,
} from "@/components/preview/preview-mode-provider";
import { LearnMore } from "@/components/ui/learn-more";
import { ThemedSelect } from "@/components/ui/themed-select";
import {
  defaultLoadInputValues,
  loadInputSchema,
  LoadInputFormValues,
} from "@/lib/load-schema";
import {
  LOAD_PULLED_REASON_OPTIONS,
  LOAD_RUN_STATUS_OPTIONS,
  type LoadPulledReason,
  type LoadRunStatus,
} from "@/lib/fuel-gauge";
import {
  buildDefaultStructuredEquipmentProfile,
  type StructuredEquipmentProfile,
} from "@/lib/equipment-profile";
import { getCalculatorDefaults } from "@/services/calculator-defaults";
import { getDieselPrice } from "@/services/fuel-prices";
import {
  createRouteStopInput,
  normalizeRouteStops,
} from "@/services/route-intelligence";
import {
  calculateInclusiveTripDays,
  formatLocalDate,
  snapToQuarterDay,
} from "@/services/trip-dates";
import { AccessorialInputItem } from "@/types/accessorial";
import {
  ProfileDerivedValues,
  ReserveAllocationMode,
  RouteStopInput,
} from "@/types/load";
import { formatCurrency, formatRpm, roundFuelPrice } from "@/utils/format";

type LoadInputRawValues = z.input<typeof loadInputSchema>;

type LoadInputFormProps = {
  onCalculate: (values: LoadInputFormValues) => void;
  initialValues?: LoadInputFormValues | null;
  previewMode?: boolean;
};

const PREVIEW_PROFILE_VALUES: ProfileDerivedValues = {
  dailyFixedOverhead: 185,
  operatingDaysPerWeek: 5.5,
  operatingDaysPerMonth: 23.82,
  dispatchPercent: 8,
  factoringPercent: 2.5,
  reserveAllocation: 0,
  maintenanceReserve: 0.14,
  tireReserve: 0.04,
  trailerFee: 0,
  insuranceAllocation: 0,
  variableCostPerMile: 0.22,
  fixedCostAllocation: 185,
  mpg: 6.5,
  targetTrueRpm: 2.15,
  incomeTargetDaily: 450,
  incomeTargetWeekly: 2250,
  minimumHourlyProfitability: 65,
};

const PREVIEW_FUEL_STATUS =
  "Preview estimate · live EIA lookup is not called in preview mode.";

const PREVIEW_EQUIPMENT_PROFILE = buildDefaultStructuredEquipmentProfile();

const FIELD_VALIDATION_MESSAGES: Record<string, string> = {
  pickupZip: "Enter a pickup ZIP with at least 5 characters.",
  deliveryZip: "Enter a delivery ZIP with at least 5 characters.",
  loadedMiles: "Enter loaded miles greater than 0.",
  deadheadMiles: "Deadhead miles cannot be negative.",
  routeLoadedMiles: "Route loaded miles cannot be negative.",
  actualLoadedMiles: "Actual loaded miles cannot be negative.",
  routeDeadheadMiles: "Route deadhead miles cannot be negative.",
  actualDeadheadMiles: "Actual deadhead miles cannot be negative.",
  dispatchDays: "Dispatch days must be at least 1.",
  deadheadDays: "Deadhead days cannot be negative.",
  pickupDate: "Pickup date is optional, but it must be before delivery date.",
  deliveryDate: "Delivery date cannot be before pickup date.",
  deadheadStartDate:
    "Deadhead start date is optional, but it must be before the stop date.",
  deadheadEndDate: "Deadhead stop date cannot be before the start date.",
  grossRevenue: "Gross revenue cannot be negative.",
  ratePerMile: "Rate per mile cannot be negative.",
  fuelSurcharge: "Fuel surcharge cannot be negative.",
  fuelPrice: "Enter a fuel price greater than 0.",
  mpg: "Enter MPG greater than 0.",
  overhead: "Daily overhead cannot be negative.",
  reserveAllocationValue: "Reserve allocation cannot be negative.",
  reserveAllocation: "Reserve allocation cannot be negative.",
  maintenanceReserve: "Maintenance reserve cannot be negative.",
  tireReserve: "Tire reserve cannot be negative.",
  tolls: "Tolls cannot be negative.",
  lumpers: "Lumpers cannot be negative.",
  trailerFee: "Trailer fee cannot be negative.",
  insuranceAllocation: "Insurance allocation cannot be negative.",
  variableCostPerMile: "Variable cost per mile cannot be negative.",
  fixedCostAllocation: "Fixed cost allocation cannot be negative.",
  factoringPercent: "Factoring percent must be between 0 and 100.",
  dispatchPercent: "Dispatch percent must be between 0 and 100.",
  targetTrueRpm: "Target true RPM must be greater than 0.",
  estimatedLoadWeightLbs: "Estimated load weight cannot be negative.",
  loadRunStatus: "Select the load lifecycle status.",
  loadPulledReason: "Select why the load was pulled.",
  fuelTankCount: "Fuel tank count cannot be negative.",
  fuelTankCapacityGallons: "Tank size cannot be negative.",
  startingFuelPercent: "Starting fuel must be between 0 and 100%.",
};

export function LoadInputForm({
  onCalculate,
  initialValues,
  previewMode = false,
}: LoadInputFormProps) {
  const preview = usePreviewMode();
  const previewActive = previewMode || preview.enabled;
  const [accessorialItems, setAccessorialItems] = useState<
    AccessorialInputItem[]
  >([]);
  const [routeStops, setRouteStops] = useState<RouteStopInput[]>([]);
  const [fuelStatus, setFuelStatus] = useState(
    previewActive ? PREVIEW_FUEL_STATUS : ""
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dateErrors, setDateErrors] = useState<{
    deliveryDate?: string;
    deadheadEndDate?: string;
  }>({});
  const [profileValues, setProfileValues] =
    useState<ProfileDerivedValues | null>(
      previewActive ? PREVIEW_PROFILE_VALUES : null
    );
  const [overrideFields, setOverrideFields] = useState<Record<string, boolean>>(
    {}
  );
  const userOverrodeFuelPrice = useRef(false);
  const userOverrodeDispatchDays = useRef(false);
  const userOverrodeDeadheadDays = useRef(false);

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

  const setEquipmentProfileValues = useCallback(
    (profile: StructuredEquipmentProfile) => {
      setValue("equipmentType", profile.equipmentType);
      setValue("atlasEquipmentPack", profile.atlasEquipmentPack);
      setValue("combinationType", profile.combinationType);
      setValue("trailerLengthFeet", profile.trailerLengthFeet);
      setValue("trailerWidthInches", profile.trailerWidthInches);
      setValue("trailerHeightInches", profile.trailerHeightInches);
      setValue("vehicleTareWeightLbs", profile.vehicleTareWeightLbs);
      setValue("estimatedMaxGrossLbs", profile.estimatedMaxGrossLbs);
      setValue("maxPayloadLbs", profile.maxPayloadLbs);
      setValue(
        "grossVehicleWeightRatingLbs",
        profile.grossVehicleWeightRatingLbs
      );
      setValue("axleCount", profile.axleCount);
      setValue("hazmatCapable", profile.hazmatCapable);
      setValue("tankerCapable", profile.tankerCapable);
      setValue("refrigeratedCapable", profile.refrigeratedCapable);
      setValue("specializedCapabilities", profile.specializedCapabilities);
      setValue("securementEquipment", profile.securementEquipment);
      setValue("routeRestrictionNotes", profile.routeRestrictionNotes);
    },
    [setValue]
  );

  useEffect(() => {
    if (previewActive) {
      setValue("profileDerivedValues", PREVIEW_PROFILE_VALUES);
      setValue("temporaryOverrides", {});
      setValue("calculationSource", "profile");
      setValue("overhead", PREVIEW_PROFILE_VALUES.dailyFixedOverhead);
      setValue("targetTrueRpm", PREVIEW_PROFILE_VALUES.targetTrueRpm);
      setValue("mpg", PREVIEW_PROFILE_VALUES.mpg);
      setValue("fuelTankCount", 2);
      setValue("fuelTankCapacityGallons", 100);
      setValue("startingFuelPercent", 100);
      setEquipmentProfileValues(PREVIEW_EQUIPMENT_PROFILE);
      setValue("reserveAllocation", PREVIEW_PROFILE_VALUES.reserveAllocation);
      setValue("reserveAllocationValue", PREVIEW_PROFILE_VALUES.reserveAllocation);
      setValue("reserveAllocationMode", "flat");
      setValue("maintenanceReserve", PREVIEW_PROFILE_VALUES.maintenanceReserve);
      setValue("tireReserve", PREVIEW_PROFILE_VALUES.tireReserve);
      setValue("trailerFee", PREVIEW_PROFILE_VALUES.trailerFee);
      setValue("insuranceAllocation", PREVIEW_PROFILE_VALUES.insuranceAllocation);
      setValue("variableCostPerMile", PREVIEW_PROFILE_VALUES.variableCostPerMile);
      setValue("fixedCostAllocation", PREVIEW_PROFILE_VALUES.fixedCostAllocation);
      setValue("dispatchPercent", PREVIEW_PROFILE_VALUES.dispatchPercent);
      setValue("factoringPercent", PREVIEW_PROFILE_VALUES.factoringPercent);
      return;
    }

    async function loadDefaults() {
      try {
        const defaults = await getCalculatorDefaults();
        const derivedValues: ProfileDerivedValues = {
          dailyFixedOverhead: defaults.dailyOverhead,
          operatingDaysPerWeek: defaults.operatingDaysPerWeek,
          operatingDaysPerMonth: defaults.operatingDaysPerMonth,
          dispatchPercent: defaults.dispatchPercent,
          factoringPercent: defaults.factoringPercent,
          reserveAllocation: defaults.reserveAllocation,
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
        setValue("fuelTankCount", defaults.fuelTankCount);
        setValue("fuelTankCapacityGallons", defaults.fuelTankCapacityGallons);
        setEquipmentProfileValues(defaults.equipmentProfile);
        setValue("reserveAllocation", defaults.reserveAllocation);
        setValue("reserveAllocationValue", defaults.reserveAllocation);
        setValue("reserveAllocationMode", "flat");
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
  }, [previewActive, setEquipmentProfileValues, setValue]);

  useEffect(() => {
    if (previewActive) return;

    async function loadFuelPrice() {
      try {
        const fuel = await getDieselPrice();

        if (userOverrodeFuelPrice.current) {
          return;
        }

        if (fuel.status === "available" && fuel.fuel) {
          setValue("fuelPrice", roundFuelPrice(fuel.fuel.pricePerGallon), {
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
  }, [previewActive, setValue]);

  useEffect(() => {
    if (!initialValues) return;

    reset(initialValues);
    userOverrodeDispatchDays.current = false;
    userOverrodeDeadheadDays.current = false;
    queueMicrotask(() => {
      setDateErrors({});
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
      setRouteStops(normalizeRouteStops(initialValues.routeStops));
    });
  }, [initialValues, reset]);

  function submit(values: LoadInputRawValues) {
    if (previewMode || preview.enabled) {
      preview.explain("analyze-load");
      return;
    }

    const stopError = getRouteStopValidationError(routeStops);
    if (stopError) {
      setSubmitError(stopError);
      return;
    }

    let parsedValues: LoadInputFormValues;
    try {
      parsedValues = loadInputSchema.parse({
        ...values,
        accessorialItems,
        routeStops: normalizeRouteStops(routeStops),
        profileDerivedValues: profileValues ?? values.profileDerivedValues,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        setSubmitError(
          getValidationMessage(
            issue?.message,
            issue?.path.map(String).join(".")
          ) ??
            "Review the highlighted fields before analyzing this load."
        );
        return;
      }

      throw error;
    }

    if (dateErrors.deliveryDate || dateErrors.deadheadEndDate) {
      setSubmitError(
        dateErrors.deliveryDate ??
          dateErrors.deadheadEndDate ??
          "Review the timing dates before analyzing this load."
      );
      return;
    }

    setSubmitError(null);
    const reserveAllocationValue =
      parsedValues.reserveAllocationValue > 0
        ? parsedValues.reserveAllocationValue
        : parsedValues.reserveAllocation;

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
      dispatchDate: parsedValues.dispatchDate || formatLocalDate(),
      dispatchDays: Math.max(snapToQuarterDay(parsedValues.dispatchDays), 1),
      deadheadDays: Math.max(snapToQuarterDay(parsedValues.deadheadDays), 0),
      ratePerMile: derivedRatePerMile,
      fuelPrice: roundFuelPrice(parsedValues.fuelPrice),
      reserveAllocation: reserveAllocationValue,
      reserveAllocationValue,
      estimatedLoadWeightLbs: Math.max(
        Math.round(Number(parsedValues.estimatedLoadWeightLbs ?? 0)),
        0
      ),
      routeStops: normalizeRouteStops(routeStops),
      grossRevenue:
        parsedValues.revenueInputMode === "gross"
          ? parsedValues.grossRevenue
          : derivedLinehaul + parsedValues.fuelSurcharge,
    });
  }

  function handleInvalidSubmit(errors: FieldErrors<LoadInputRawValues>) {
    const firstError = findFirstFormError(errors);
    setSubmitError(
      firstError ??
        "Review the highlighted fields before analyzing this load."
    );
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
    if (field === "reserveAllocation") {
      setValue("reserveAllocation", value, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
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
      reserveAllocation: "reserveAllocationValue",
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
  const reserveAllocationMode =
    watchedValues?.reserveAllocationMode ?? "flat";
  const loadRunStatus =
    (watchedValues?.loadRunStatus ?? "planned") as LoadRunStatus;
  const fuelSurchargeIncludedInGross = Boolean(
    watchedValues?.fuelSurchargeIncludedInGross
  );

  function selectLoadRunStatus(status: LoadRunStatus) {
    if (preview.enabled) {
      preview.explain("calculator-field");
      return;
    }

    setValue("loadRunStatus", status, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (status !== "pulled") {
      setValue("loadPulledReason", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  function selectLoadPulledReason(reason: LoadPulledReason) {
    if (preview.enabled) {
      preview.explain("calculator-field");
      return;
    }

    setValue("loadPulledReason", reason, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function selectReserveAllocationMode(mode: ReserveAllocationMode) {
    if (preview.enabled) {
      preview.explain("overhead-item");
      return;
    }

    setValue("reserveAllocationMode", mode, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function addRouteStop() {
    if (preview.enabled) {
      preview.explain("calculator-field");
      return;
    }

    setRouteStops((current) => [...current, createRouteStopInput()]);
  }

  function removeRouteStop(stopIndex: number) {
    setRouteStops((current) =>
      current.filter((_, index) => index !== stopIndex)
    );
  }

  function updateRouteStop(
    stopIndex: number,
    updates: Partial<RouteStopInput>
  ) {
    setRouteStops((current) =>
      current.map((stop, index) =>
        index === stopIndex
          ? {
              ...stop,
              ...updates,
            }
          : stop
      )
    );
  }

  function setQuarterDayValue(
    field: "dispatchDays" | "deadheadDays",
    value: number
  ) {
    if (preview.enabled) {
      preview.explain("calculator-field");
      return;
    }

    const minimum = field === "dispatchDays" ? 1 : 0;
    const nextValue = Math.max(snapToQuarterDay(value), minimum);

    if (field === "dispatchDays") {
      userOverrodeDispatchDays.current = true;
    } else {
      userOverrodeDeadheadDays.current = true;
    }

    setValue(field, nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function presetQuarterDayValue(
    field: "dispatchDays" | "deadheadDays",
    value: number
  ) {
    const minimum = field === "dispatchDays" ? 1 : 0;

    setValue(field, Math.max(snapToQuarterDay(value), minimum), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function handleTimingDateChange(
    field:
      | "pickupDate"
      | "deliveryDate"
      | "deadheadStartDate"
      | "deadheadEndDate",
    value: string
  ) {
    const pickupDate =
      field === "pickupDate" ? value : String(getValues("pickupDate") ?? "");
    const deliveryDate =
      field === "deliveryDate"
        ? value
        : String(getValues("deliveryDate") ?? "");
    const deadheadStartDate =
      field === "deadheadStartDate"
        ? value
        : String(getValues("deadheadStartDate") ?? "");
    const deadheadEndDate =
      field === "deadheadEndDate"
        ? value
        : String(getValues("deadheadEndDate") ?? "");

    const loadDaysPreset = calculateInclusiveTripDays(
      pickupDate,
      deliveryDate,
      "Delivery date cannot be before pickup date."
    );
    const deadheadDaysPreset = calculateInclusiveTripDays(
      deadheadStartDate,
      deadheadEndDate,
      "Deadhead stop date cannot be before deadhead start date."
    );

    setDateErrors({
      deliveryDate: loadDaysPreset.error ?? undefined,
      deadheadEndDate: deadheadDaysPreset.error ?? undefined,
    });

    if (loadDaysPreset.days !== null && !userOverrodeDispatchDays.current) {
      presetQuarterDayValue("dispatchDays", loadDaysPreset.days);
    }

    if (
      deadheadDaysPreset.days !== null &&
      !userOverrodeDeadheadDays.current
    ) {
      presetQuarterDayValue("deadheadDays", deadheadDaysPreset.days);
    }
  }

  const dispatchDaysField = register("dispatchDays");
  const deadheadDaysField = register("deadheadDays");
  const dispatchDateField = register("dispatchDate");
  const pickupDateField = register("pickupDate");
  const deliveryDateField = register("deliveryDate");
  const deadheadStartDateField = register("deadheadStartDate");
  const deadheadEndDateField = register("deadheadEndDate");

  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit, handleInvalidSubmit)}
      className="space-y-8"
    >
      <input type="hidden" {...register("fuelPriceSource")} />
      <input type="hidden" {...register("fuelPriceSourceLabel")} />
      <input type="hidden" {...register("fuelPriceRegion")} />
      <input type="hidden" {...register("fuelPricePeriod")} />
      <input type="hidden" {...register("fuelPriceFetchedAt")} />
      <input type="hidden" {...register("fuelPriceExpiresAt")} />
      <input type="hidden" {...register("loadRunStatus")} />
      <input type="hidden" {...register("loadPulledReason")} />
      <input type="hidden" {...register("overhead")} />
      <input type="hidden" {...register("mpg")} />
      <input type="hidden" {...register("fuelTankCount")} />
      <input type="hidden" {...register("fuelTankCapacityGallons")} />
      <input type="hidden" {...register("reserveAllocation")} />
      <input type="hidden" {...register("reserveAllocationMode")} />
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

        {submitError && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
            {submitError}
          </div>
        )}

        <InputField
          label="Trip Number / Broker Reference"
          error={errors.loadNumber?.message}
          previewKey="trip-number"
          {...register("loadNumber")}
        />
        <p className="text-xs leading-5 text-slate-500">
          Karpilo LoadIQ assigns the system Load ID when the load is saved. Use
          this field only for broker, dispatcher, carrier, or customer trip
          references. If left blank, the saved load can use an AUTO trip number.
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Load Lifecycle" />

        <ThemedSelect
          label="Load Status"
          value={loadRunStatus}
          previewExplanation="calculator-field"
          onChange={(value) => selectLoadRunStatus(value as LoadRunStatus)}
          options={LOAD_RUN_STATUS_OPTIONS.map((option) => ({
            value: option.value,
            label: option.label,
            description: option.description,
          }))}
        />

        {loadRunStatus === "pulled" && (
          <ThemedSelect
            label="Pulled Reason"
            value={String(watchedValues?.loadPulledReason ?? "")}
            previewExplanation="calculator-field"
            onChange={(value) =>
              selectLoadPulledReason(value as LoadPulledReason)
            }
            options={LOAD_PULLED_REASON_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Fuel Gauge Preset %"
            type="number"
            min="0"
            max="100"
            step="1"
            error={errors.startingFuelPercent?.message}
            helper="Set this before the load runs. The value stays attached to this load when booked, dispatched, or running."
            previewKey="fuel-price"
            atlasEduKey="fuel-efficiency"
            {...register("startingFuelPercent")}
          />
        </div>

        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          Fuel monitoring is load-tied. Planned, rejected, test, completed, and
          pulled loads do not open the fuel gauge. Active load monitoring uses
          vehicle profile MPG, tank count, tank size, this load&apos;s fuel gauge
          preset, route miles, and the current fuel price estimate.
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Atlas Operational Context" />

        <AtlasEducationalSignal
          title="Route Field Meaning"
          signal="Atlas Educational Support reads route inputs as entered movement context. Loaded miles drive revenue efficiency, while deadhead miles dilute true RPM because unpaid movement still consumes time, fuel, tires, and maintenance."
          consequence="Deadhead start, pickup, delivery, stop-off, and timing fields help preserve the operational structure behind the calculation without replacing manual mileage authority."
        />

        <div className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Deadhead Origin
          </div>
          <p className="mb-4 text-xs leading-5 text-slate-500">
            Optional starting point before pickup. Manual deadhead miles still
            control the math; this gives saved loads better route context.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Address"
              error={errors.deadheadStartAddress?.message}
              previewKey="calculator-field"
              {...register("deadheadStartAddress")}
            />
            <InputField
              label="City"
              error={errors.deadheadStartCity?.message}
              previewKey="calculator-field"
              {...register("deadheadStartCity")}
            />
            <InputField
              label="State"
              error={errors.deadheadStartState?.message}
              previewKey="calculator-field"
              {...register("deadheadStartState")}
            />
            <InputField
              label="ZIP"
              error={errors.deadheadStartZip?.message}
              previewKey="calculator-field"
              {...register("deadheadStartZip")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Pickup Origin
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Address"
              error={errors.pickupAddress?.message}
              {...register("pickupAddress")}
            />
          <InputField
            label="City"
            error={errors.pickupCity?.message}
            {...register("pickupCity")}
          />

          <InputField
            label="State"
            error={errors.pickupState?.message}
            {...register("pickupState")}
          />

          <InputField
            label="ZIP"
            error={errors.pickupZip?.message}
            {...register("pickupZip")}
          />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
            Delivery Origin
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Address"
              error={errors.deliveryAddress?.message}
              {...register("deliveryAddress")}
            />
          <InputField
            label="City"
            error={errors.deliveryCity?.message}
            {...register("deliveryCity")}
          />

          <InputField
            label="State"
            error={errors.deliveryState?.message}
            {...register("deliveryState")}
          />

          <InputField
            label="ZIP"
            error={errors.deliveryZip?.message}
            {...register("deliveryZip")}
          />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Loaded Miles"
            type="number"
            error={errors.loadedMiles?.message}
            atlasEduKey="loaded-miles"
            {...register("loadedMiles")}
          />

          <InputField
            label="Deadhead Miles"
            type="number"
            error={errors.deadheadMiles?.message}
            atlasEduKey="deadhead-miles"
            {...register("deadheadMiles")}
          />
        </div>

        <InputField
          label="Estimated Load Weight (lbs)"
          type="number"
          error={errors.estimatedLoadWeightLbs?.message}
          previewKey="calculator-field"
          atlasEduKey="estimated-load-weight"
          {...register("estimatedLoadWeightLbs")}
        />
        <p className="text-xs leading-5 text-slate-500">
          Estimated/speculative only unless verified by shipper paperwork or
          scale records. Karpilo LoadIQ does not treat this as certified scale
          weight.
        </p>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Stop-Off Modeling
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Add optional intermediate stops. User-entered loaded miles
                still control the calculator; stop miles are operational
                context, not routing API truth.
              </p>
            </div>
            <button
              type="button"
              data-preview-explain="calculator-field"
              data-atlas-edu="route-stop"
              onClick={addRouteStop}
              className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-300 transition hover:bg-sky-400/20"
            >
              Add Stop
            </button>
          </div>

          {routeStops.length === 0 ? (
            <p className="rounded-xl border border-slate-800 bg-[#0B1220] p-4 text-xs leading-5 text-slate-500">
              No stop-offs added. This remains a simple pickup-to-delivery
              model.
            </p>
          ) : (
            <div className="space-y-4">
              {routeStops.map((stop, index) => (
                <RouteStopEditor
                  key={stop.id ?? index}
                  stop={stop}
                  index={index}
                  onChange={(updates) => updateRouteStop(index, updates)}
                  onRemove={() => removeRouteStop(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Operational Timing" />

        <div className="grid grid-cols-2 gap-4">
          <DayInputField
            label="Dispatch / Load Days"
            type="number"
            step="0.25"
            value={watchedNumber("dispatchDays", 1)}
            error={errors.dispatchDays?.message}
            helper="Used anywhere the calculator already assigns daily overhead or daily profitability to the loaded/dispatch portion."
            atlasEduKey="dispatch-dates"
            {...dispatchDaysField}
            onChange={(event) => {
              userOverrodeDispatchDays.current = true;
              void dispatchDaysField.onChange(event);
            }}
            onDecrement={() =>
              setQuarterDayValue(
                "dispatchDays",
                watchedNumber("dispatchDays", 1) - 0.25
              )
            }
            onIncrement={() =>
              setQuarterDayValue(
                "dispatchDays",
                watchedNumber("dispatchDays", 1) + 0.25
              )
            }
          />

          <DayInputField
            label="Deadhead Days"
            type="number"
            step="0.25"
            value={watchedNumber("deadheadDays", 0)}
            error={errors.deadheadDays?.message}
            helper="Used for daily profitability timing when the load carries deadhead movement before pickup."
            atlasEduKey="dispatch-dates"
            {...deadheadDaysField}
            onChange={(event) => {
              userOverrodeDeadheadDays.current = true;
              void deadheadDaysField.onChange(event);
            }}
            onDecrement={() =>
              setQuarterDayValue(
                "deadheadDays",
                watchedNumber("deadheadDays", 0) - 0.25
              )
            }
            onIncrement={() =>
              setQuarterDayValue(
                "deadheadDays",
                watchedNumber("deadheadDays", 0) + 0.25
              )
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Dispatch Date"
            type="date"
            error={errors.dispatchDate?.message}
            helper="Date the load was assigned or placed in Karpilo LoadIQ. This is not the pickup date."
            previewKey="calculator-field"
            atlasEduKey="dispatch-dates"
            {...dispatchDateField}
          />
          <InputField
            label="Pickup Date"
            type="date"
            error={errors.pickupDate?.message}
            helper="Date freight is picked up."
            previewKey="calculator-field"
            atlasEduKey="dispatch-dates"
            {...pickupDateField}
            onChange={(event) => {
              void pickupDateField.onChange(event);
              handleTimingDateChange("pickupDate", event.target.value);
            }}
          />
          <InputField
            label="Delivery Date"
            type="date"
            error={errors.deliveryDate?.message ?? dateErrors.deliveryDate}
            helper="Date freight is delivered or dropped."
            previewKey="calculator-field"
            atlasEduKey="dispatch-dates"
            {...deliveryDateField}
            onChange={(event) => {
              void deliveryDateField.onChange(event);
              handleTimingDateChange("deliveryDate", event.target.value);
            }}
          />
          <InputField
            label="Deadhead Start Date"
            type="date"
            error={errors.deadheadStartDate?.message}
            helper="Date deadhead movement toward this load begins."
            previewKey="calculator-field"
            atlasEduKey="dispatch-dates"
            {...deadheadStartDateField}
            onChange={(event) => {
              void deadheadStartDateField.onChange(event);
              handleTimingDateChange("deadheadStartDate", event.target.value);
            }}
          />
          <InputField
            label="Deadhead Stop Date"
            type="date"
            error={errors.deadheadEndDate?.message ?? dateErrors.deadheadEndDate}
            helper="Date deadhead movement ends, usually at pickup or staging."
            previewKey="calculator-field"
            atlasEduKey="dispatch-dates"
            {...deadheadEndDateField}
            onChange={(event) => {
              void deadheadEndDateField.onChange(event);
              handleTimingDateChange("deadheadEndDate", event.target.value);
            }}
          />
          <InputField
            label="Pay Period Start"
            type="date"
            error={errors.payPeriodStartDate?.message}
            previewKey="calculator-field"
            {...register("payPeriodStartDate")}
          />
          <InputField
            label="Pay Period End"
            type="date"
            error={errors.payPeriodEndDate?.message}
            previewKey="calculator-field"
            {...register("payPeriodEndDate")}
          />
        </div>

        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          Pickup-to-delivery dates can preset dispatch/load days. Deadhead
          start-to-stop dates can preset deadhead days. Manual day adjustments
          stay in control after you edit them.
        </p>
      </section>

      <section className="space-y-4">
        <SectionTitle title="Profile-Controlled Values" />

        <LearnMore
          title="Profile values in the calculator"
          summary="Karpilo LoadIQ uses final values from Settings so you do not re-enter recurring business assumptions."
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
              help="Your profile stores fixed business costs. Karpilo LoadIQ converts them into a daily overhead number so each load only carries the cost for the days it uses your truck."
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
              label="Default Reserve Allocation"
              value={watchedNumber(
                "reserveAllocationValue",
                profileValues.reserveAllocation
              )}
              formatter={formatCurrency}
              help="General reserve allocation comes from Settings and is resolved by the selected flat, CPM, or percent mode for this load."
              isOverride={overrideFields.reserveAllocation}
              onEnableOverride={() => enableTemporaryOverride("reserveAllocation")}
              onOverride={(value) =>
                recordTemporaryOverride("reserveAllocation", value)
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
              help="Your target true RPM is the operating guardrail Karpilo LoadIQ uses to flag weak freight."
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
            data-atlas-edu="rpm"
            onClick={() => setValue("revenueInputMode", "rpm", { shouldDirty: true })}
            onFocus={() => preview.enabled && preview.explain("rpm")}
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
            data-atlas-edu="gross-revenue"
            onClick={() => setValue("revenueInputMode", "gross", { shouldDirty: true })}
            onFocus={() => preview.enabled && preview.explain("gross-revenue")}
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
            previewKey="gross-revenue"
            {...register("grossRevenue")}
          />
        ) : (
          <InputField
            label="RPM"
            type="number"
            step="0.01"
            error={errors.ratePerMile?.message}
            previewKey="rpm"
            {...register("ratePerMile")}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Fuel Surcharge"
            type="number"
            step="0.01"
            error={errors.fuelSurcharge?.message}
            previewKey="fuel-surcharge"
            {...register("fuelSurcharge")}
          />
        </div>

        {revenueInputMode === "gross" && (
          <label className="flex items-start gap-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-5 text-sky-100">
            <input
              {...fuelSurchargeIncludedField}
              data-atlas-edu="fuel-surcharge"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-[#060B14]"
              checked={fuelSurchargeIncludedInGross}
              onFocus={() => preview.enabled && preview.explain("fuel-surcharge-included")}
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
            previewKey="fuel-price"
            atlasEduKey="fuel-efficiency"
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

        <AtlasEducationalSignal
          title="Fuel Efficiency Behavior Signals"
          signal="Atlas Educational Support treats MPG and fuel price as operating assumptions. It does not change the calculator formula."
          consequence="Higher speed can increase aerodynamic drag; heavier loads can increase rolling resistance and acceleration demand; terrain, wind, stop frequency, idle time, tire pressure awareness, route consistency, following distance, braking, and throttle discipline can all pressure real-world fuel efficiency."
          operatorReminder="Use this as operational context only. Atlas does not promise a specific MPG improvement or safety outcome."
        />

        <div className="space-y-3 rounded-xl border border-slate-800 bg-[#060B14] p-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Reserve Allocation Mode
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Karpilo LoadIQ resolves this into a trip dollar amount before net
              and retained earnings are calculated.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(["flat", "cpm", "percent"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-preview-explain="overhead-item"
                data-atlas-edu="overhead-item"
                onClick={() => selectReserveAllocationMode(mode)}
                onFocus={() => preview.enabled && preview.explain("overhead-item")}
                className={
                  reserveAllocationMode === mode
                    ? "rounded-lg bg-sky-400 px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#060B14]"
                    : "rounded-lg border border-slate-800 px-3 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                }
              >
                {mode === "flat" ? "Flat" : mode === "cpm" ? "CPM" : "%"}
              </button>
            ))}
          </div>

          <InputField
            label={
              reserveAllocationMode === "cpm"
                ? "Reserve CPM"
                : reserveAllocationMode === "percent"
                  ? "Reserve %"
                  : "Reserve Amount"
            }
            type="number"
            step="0.01"
            error={errors.reserveAllocationValue?.message}
            previewKey="overhead-item"
            atlasEduKey="overhead-item"
            {...register("reserveAllocationValue")}
          />
        </div>

        <AccessorialManager
          items={accessorialItems}
          onChange={setAccessorialItems}
        />

        <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-6 text-slate-400">
          Tolls, lumpers, tarp pay, detention, layover, stop-off pay, and other
          accessorials are tracked in the accessorial dropdown so revenue,
          expenses, and reimbursements stay in one place.
        </p>

        <p className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
          Operational overhead, pay template, MPG, reserves, dispatch, factoring,
          and target profitability come from Settings. Overhead is applied as
          daily overhead × dispatch days, not as a full monthly cost on one load.
        </p>
      </section>

      <div className="sticky bottom-3 z-20">
        <button
          type="submit"
          onClick={() => preview.enabled && preview.explain("analyze-load")}
          data-atlas-edu="analyze-load"
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

type RouteStopEditorProps = {
  stop: RouteStopInput;
  index: number;
  onChange: (updates: Partial<RouteStopInput>) => void;
  onRemove: () => void;
};

function RouteStopEditor({
  stop,
  index,
  onChange,
  onRemove,
}: RouteStopEditorProps) {
  return (
    <div
      data-preview-explain="calculator-field"
      data-atlas-edu="route-stop"
      className="rounded-xl border border-slate-800 bg-[#0B1220] p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
              <div className="text-xs font-black uppercase tracking-[0.16em] text-sky-300">
                Stop #{index + 1}
              </div>
          <p className="mt-1 text-xs text-slate-500">
            Optional revenue, expense, and miles from previous stop.
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
            data-preview-explain="calculator-field"
            data-atlas-edu="route-stop"
            value={stop.stopType}
            onChange={(event) =>
              onChange({
                stopType:
                  event.target.value === "delivery" ? "delivery" : "pickup",
              })
            }
            className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
          >
            <option value="pickup">P-U</option>
            <option value="delivery">DEL</option>
          </select>
        </label>
        <StopInputField
          label="Address"
          value={stop.address}
          onChange={(value) => onChange({ address: value })}
        />
        <StopInputField
          label="City"
          value={stop.city}
          onChange={(value) => onChange({ city: value })}
        />
        <StopInputField
          label="State"
          value={stop.state}
          onChange={(value) => onChange({ state: value.toUpperCase() })}
        />
        <StopInputField
          label="ZIP"
          value={stop.zip}
          onChange={(value) => onChange({ zip: value })}
        />
        <StopInputField
          label="Miles From Previous"
          type="number"
          value={String(stop.milesFromPrevious)}
          onChange={(value) => onChange({ milesFromPrevious: Number(value) })}
        />
        <StopInputField
          label="Stop Revenue"
          type="number"
          value={String(stop.stopRevenue)}
          onChange={(value) => onChange({ stopRevenue: Number(value) })}
        />
        <StopInputField
          label="Stop Expense"
          type="number"
          value={String(stop.stopExpense)}
          onChange={(value) => onChange({ stopExpense: Number(value) })}
        />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
          Notes
        </span>
        <input
          data-preview-explain="calculator-field"
          data-atlas-edu="route-stop"
          value={stop.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
        />
      </label>
    </div>
  );
}

function StopInputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>
      <input
        data-preview-explain="calculator-field"
        data-atlas-edu="route-stop"
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function getRouteStopValidationError(stops: RouteStopInput[]) {
  for (const [index, stop] of stops.entries()) {
    const stopNumber = index + 1;
    const numericChecks: Array<[string, number]> = [
      ["miles from previous", stop.milesFromPrevious],
      ["stop revenue", stop.stopRevenue],
      ["stop expense", stop.stopExpense],
    ];

    for (const [label, value] of numericChecks) {
      if (!Number.isFinite(Number(value))) {
        return `Stop-Off ${stopNumber}: ${label} must be a valid number.`;
      }

      if (Number(value) < 0) {
        return `Stop-Off ${stopNumber}: ${label} cannot be negative.`;
      }
    }
  }

  return null;
}

function findFirstFormError(errors: FieldErrors<LoadInputRawValues>) {
  const queue: Array<{ value: unknown; path: string }> = Object.entries(
    errors
  ).map(([key, value]) => ({ value, path: key }));

  while (queue.length > 0) {
    const currentEntry = queue.shift();
    if (!currentEntry) continue;
    const { value: current, path } = currentEntry;
    if (!current || typeof current !== "object") continue;

    if ("message" in current && typeof current.message === "string") {
      return getValidationMessage(current.message, path);
    }

    for (const [key, value] of Object.entries(current)) {
      queue.push({
        value,
        path: path ? `${path}.${key}` : key,
      });
    }
  }

  return null;
}

function getValidationMessage(message?: string, path?: string) {
  const mappedMessage = getValidationMessageForPath(path);
  if (!message || message.toLowerCase().startsWith("invalid input")) {
    return mappedMessage;
  }

  return message;
}

function getValidationMessageForPath(path?: string) {
  if (!path) return null;

  const pathParts = path.split(".");
  const fieldName = pathParts.at(-1);
  if (!fieldName) return null;

  if (fieldName in FIELD_VALIDATION_MESSAGES) {
    return FIELD_VALIDATION_MESSAGES[fieldName];
  }

  if (path.startsWith("routeStops.")) {
    const stopIndex = Number(pathParts[1]);
    const stopLabel = Number.isFinite(stopIndex)
      ? `Stop-Off ${stopIndex + 1}`
      : "Stop-Off";

    if (fieldName === "milesFromPrevious") {
      return `${stopLabel}: miles from previous stop cannot be negative.`;
    }

    if (fieldName === "stopRevenue") {
      return `${stopLabel}: stop revenue cannot be negative.`;
    }

    if (fieldName === "stopExpense") {
      return `${stopLabel}: stop expense cannot be negative.`;
    }
  }

  return null;
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
  const preview = usePreviewMode();
  const previewKey: PreviewExplanationKey =
    label.toLowerCase().includes("mpg")
      ? "mpg"
      : label.toLowerCase().includes("rpm")
        ? "rpm"
        : label.toLowerCase().includes("reserve")
          ? "overhead-item"
          : "settings-station";

  return (
    <div
      data-preview-explain={previewKey}
      className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
    >
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
              data-preview-explain={previewKey}
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
              onClick={() => {
                if (preview.enabled) {
                  preview.explain(previewKey);
                  return;
                }
                onEnableOverride();
              }}
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
  helper?: string;
  previewKey?: PreviewExplanationKey;
  atlasEduKey?: string;
};

function InputField({
  label,
  error,
  helper,
  previewKey,
  atlasEduKey,
  ...props
}: InputFieldProps) {
  const preview = usePreviewMode();

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>

      <input
        {...props}
        data-preview-explain={previewKey}
        data-atlas-edu={atlasEduKey ?? previewKey}
        readOnly={preview.enabled || props.readOnly}
        aria-readonly={preview.enabled || props.readOnly}
        onFocus={(event) => {
          props.onFocus?.(event);
          if (preview.enabled && previewKey) {
            preview.explain(previewKey);
          }
        }}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-base text-slate-100 outline-none transition placeholder:text-slate-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />

      {error && (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      )}

      {helper && !error && (
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {helper}
        </span>
      )}
    </label>
  );
}

type DayInputFieldProps = InputFieldProps & {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
};

function DayInputField({
  label,
  error,
  helper,
  previewKey,
  atlasEduKey,
  value,
  onDecrement,
  onIncrement,
  ...props
}: DayInputFieldProps) {
  const preview = usePreviewMode();

  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
        {label}
      </span>

      <div className="grid grid-cols-[44px_1fr_44px] overflow-hidden rounded-xl border border-slate-800 bg-[#060B14] focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20">
        <button
          type="button"
          onClick={onDecrement}
          data-preview-explain={previewKey}
          data-atlas-edu={atlasEduKey ?? previewKey}
          className="h-12 border-r border-slate-800 text-lg font-black text-sky-300 transition hover:bg-sky-400/10"
          aria-label={`Decrease ${label} by 0.25`}
        >
          -
        </button>
        <input
          {...props}
          data-preview-explain={previewKey}
          data-atlas-edu={atlasEduKey ?? previewKey}
          readOnly={preview.enabled || props.readOnly}
          aria-readonly={preview.enabled || props.readOnly}
          onFocus={(event) => {
            props.onFocus?.(event);
            if (preview.enabled && previewKey) {
              preview.explain(previewKey);
            }
          }}
          className="h-12 w-full bg-transparent px-4 text-center text-base text-slate-100 outline-none placeholder:text-slate-700"
        />
        <button
          type="button"
          onClick={onIncrement}
          data-preview-explain={previewKey}
          data-atlas-edu={atlasEduKey ?? previewKey}
          className="h-12 border-l border-slate-800 text-lg font-black text-sky-300 transition hover:bg-sky-400/10"
          aria-label={`Increase ${label} by 0.25`}
        >
          +
        </button>
      </div>

      <span className="mt-1 block text-xs leading-5 text-slate-500">
        Current value snaps to {snapToQuarterDay(value)} day(s).
      </span>

      {error && (
        <span className="mt-1 block text-xs text-red-400">{error}</span>
      )}

      {helper && !error && (
        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {helper}
        </span>
      )}
    </label>
  );
}
