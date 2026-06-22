import { create } from "zustand";

import { LoadInput, LoadResult } from "@/types/load";
import { calculateLoadMetrics } from "@/services/load-calculator";
import type { StructuredEquipmentProfile } from "@/lib/equipment-profile";

type CalculatorDefaults = {
  overhead?: number;
  operatingDaysPerWeek?: number;
  operatingDaysPerMonth?: number;
  incomeTargetDaily?: number;
  incomeTargetWeekly?: number;
  minimumHourlyProfitability?: number;
  targetTrueRpm?: number;
  defaultMpg?: number;
  fuelTankCount?: number;
  fuelTankCapacityGallons?: number;
  equipmentProfile?: StructuredEquipmentProfile;
  defaultPayStructure?: LoadInput["payStructure"];
  reserveAllocation?: number;
  maintenanceReserve?: number;
  tireReserve?: number;
  trailerFee?: number;
  insuranceAllocation?: number;
  variableCostPerMile?: number;
  fixedCostAllocation?: number;
  dispatchPercent?: number;
  factoringPercent?: number;
};

type LoadCalculatorState = {
  result: LoadResult | null;
  lastInput: LoadInput | null;
  defaults: CalculatorDefaults;
  calculate: (input: LoadInput) => void;
  setDefaults: (defaults: CalculatorDefaults) => void;
  reset: () => void;
};

export const useLoadCalculator =
  create<LoadCalculatorState>((set, get) => ({
    result: null,
    lastInput: null,
    defaults: {
      overhead: 0,
    },

    setDefaults: (defaults) => {
      set((state) => ({
        defaults: {
          ...state.defaults,
          ...defaults,
        },
      }));
    },

    calculate: (input) => {
      const defaults = get().defaults;
      const equipmentProfile = defaults.equipmentProfile;
      const mergedInput = {
        ...input,
        overhead:
          input.overhead > 0
            ? input.overhead
            : defaults.overhead ?? 0,
        targetTrueRpm:
          input.targetTrueRpm > 0
            ? input.targetTrueRpm
            : defaults.targetTrueRpm ?? 2,
        mpg:
          input.mpg > 0 ? input.mpg : defaults.defaultMpg ?? 6.5,
        fuelTankCount:
          input.fuelTankCount > 0
            ? input.fuelTankCount
            : defaults.fuelTankCount ?? 0,
        fuelTankCapacityGallons:
          input.fuelTankCapacityGallons > 0
            ? input.fuelTankCapacityGallons
            : defaults.fuelTankCapacityGallons ?? 0,
        equipmentType:
          input.equipmentType || equipmentProfile?.equipmentType || "Dry van",
        atlasEquipmentPack:
          input.atlasEquipmentPack ||
          equipmentProfile?.atlasEquipmentPack ||
          "dry_van",
        combinationType:
          input.combinationType ||
          equipmentProfile?.combinationType ||
          "Single tractor-trailer",
        trailerLengthFeet:
          input.trailerLengthFeet > 0
            ? input.trailerLengthFeet
            : equipmentProfile?.trailerLengthFeet ?? 0,
        trailerWidthInches:
          input.trailerWidthInches > 0
            ? input.trailerWidthInches
            : equipmentProfile?.trailerWidthInches ?? 0,
        trailerHeightInches:
          input.trailerHeightInches > 0
            ? input.trailerHeightInches
            : equipmentProfile?.trailerHeightInches ?? 0,
        vehicleTareWeightLbs:
          input.vehicleTareWeightLbs > 0
            ? input.vehicleTareWeightLbs
            : equipmentProfile?.vehicleTareWeightLbs ?? 0,
        estimatedMaxGrossLbs:
          input.estimatedMaxGrossLbs > 0
            ? input.estimatedMaxGrossLbs
            : equipmentProfile?.estimatedMaxGrossLbs ?? 0,
        maxPayloadLbs:
          input.maxPayloadLbs > 0
            ? input.maxPayloadLbs
            : equipmentProfile?.maxPayloadLbs ?? 0,
        grossVehicleWeightRatingLbs:
          input.grossVehicleWeightRatingLbs > 0
            ? input.grossVehicleWeightRatingLbs
            : equipmentProfile?.grossVehicleWeightRatingLbs ?? 0,
        axleCount:
          input.axleCount > 0
            ? input.axleCount
            : equipmentProfile?.axleCount ?? 0,
        hazmatCapable:
          input.hazmatCapable || equipmentProfile?.hazmatCapable === true,
        tankerCapable:
          input.tankerCapable || equipmentProfile?.tankerCapable === true,
        refrigeratedCapable:
          input.refrigeratedCapable ||
          equipmentProfile?.refrigeratedCapable === true,
        specializedCapabilities:
          input.specializedCapabilities.length > 0
            ? input.specializedCapabilities
            : equipmentProfile?.specializedCapabilities ?? [],
        securementEquipment:
          input.securementEquipment.length > 0
            ? input.securementEquipment
            : equipmentProfile?.securementEquipment ?? [],
        routeRestrictionNotes:
          input.routeRestrictionNotes ||
          equipmentProfile?.routeRestrictionNotes ||
          "",
        payStructure: input.payStructure ?? defaults.defaultPayStructure,
        reserveAllocation:
          input.reserveAllocationValue > 0
            ? input.reserveAllocationValue
            : input.reserveAllocation > 0
              ? input.reserveAllocation
              : defaults.reserveAllocation ?? 0,
        reserveAllocationValue:
          input.reserveAllocationValue > 0
            ? input.reserveAllocationValue
            : input.reserveAllocation > 0
              ? input.reserveAllocation
              : defaults.reserveAllocation ?? 0,
        reserveAllocationMode: input.reserveAllocationMode ?? "flat",
        maintenanceReserve:
          input.maintenanceReserve > 0
            ? input.maintenanceReserve
            : defaults.maintenanceReserve ?? 0,
        tireReserve:
          input.tireReserve > 0
            ? input.tireReserve
            : defaults.tireReserve ?? 0,
        trailerFee:
          input.trailerFee > 0
            ? input.trailerFee
            : defaults.trailerFee ?? 0,
        insuranceAllocation:
          input.insuranceAllocation > 0
            ? input.insuranceAllocation
            : defaults.insuranceAllocation ?? 0,
        variableCostPerMile:
          input.variableCostPerMile > 0
            ? input.variableCostPerMile
            : defaults.variableCostPerMile ?? 0,
        fixedCostAllocation:
          input.fixedCostAllocation > 0
            ? input.fixedCostAllocation
            : defaults.fixedCostAllocation ?? 0,
        dispatchPercent:
          input.dispatchPercent > 0
            ? input.dispatchPercent
            : defaults.dispatchPercent ?? 0,
        factoringPercent:
          input.factoringPercent > 0
            ? input.factoringPercent
            : defaults.factoringPercent ?? 0,
        profileDerivedValues: {
          dailyFixedOverhead:
            input.profileDerivedValues?.dailyFixedOverhead ??
            defaults.overhead ??
            0,
          operatingDaysPerWeek:
            input.profileDerivedValues?.operatingDaysPerWeek ??
            defaults.operatingDaysPerWeek ??
            5.5,
          operatingDaysPerMonth:
            input.profileDerivedValues?.operatingDaysPerMonth ??
            defaults.operatingDaysPerMonth ??
            23.8,
          dispatchPercent:
            input.profileDerivedValues?.dispatchPercent ??
            defaults.dispatchPercent ??
            0,
          factoringPercent:
            input.profileDerivedValues?.factoringPercent ??
            defaults.factoringPercent ??
            0,
          reserveAllocation:
            input.profileDerivedValues?.reserveAllocation ??
            defaults.reserveAllocation ??
            0,
          maintenanceReserve:
            input.profileDerivedValues?.maintenanceReserve ??
            defaults.maintenanceReserve ??
            0,
          tireReserve:
            input.profileDerivedValues?.tireReserve ??
            defaults.tireReserve ??
            0,
          trailerFee:
            input.profileDerivedValues?.trailerFee ??
            defaults.trailerFee ??
            0,
          insuranceAllocation:
            input.profileDerivedValues?.insuranceAllocation ??
            defaults.insuranceAllocation ??
            0,
          variableCostPerMile:
            input.profileDerivedValues?.variableCostPerMile ??
            defaults.variableCostPerMile ??
            0,
          fixedCostAllocation:
            input.profileDerivedValues?.fixedCostAllocation ??
            defaults.fixedCostAllocation ??
            0,
          mpg:
            input.profileDerivedValues?.mpg ?? defaults.defaultMpg ?? 6.5,
          targetTrueRpm:
            input.profileDerivedValues?.targetTrueRpm ??
            defaults.targetTrueRpm ??
            2,
          incomeTargetDaily:
            input.profileDerivedValues?.incomeTargetDaily ??
            defaults.incomeTargetDaily ??
            0,
          incomeTargetWeekly:
            input.profileDerivedValues?.incomeTargetWeekly ??
            defaults.incomeTargetWeekly ??
            0,
          minimumHourlyProfitability:
            input.profileDerivedValues?.minimumHourlyProfitability ??
            defaults.minimumHourlyProfitability ??
            50,
        },
      };

      const result = calculateLoadMetrics(mergedInput);

      set({
        result,
        lastInput: mergedInput,
      });
    },

    reset: () => {
      set({
        result: null,
        lastInput: null,
      });
    },
  }));
  
