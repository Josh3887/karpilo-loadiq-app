import { create } from "zustand";

import { LoadInput, LoadResult } from "@/types/load";
import { calculateLoadMetrics } from "@/services/load-calculator";

type CalculatorDefaults = {
  overhead?: number;
  operatingDaysPerWeek?: number;
  operatingDaysPerMonth?: number;
  incomeTargetDaily?: number;
  incomeTargetWeekly?: number;
  minimumHourlyProfitability?: number;
  targetTrueRpm?: number;
  defaultMpg?: number;
  defaultPayStructure?: LoadInput["payStructure"];
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
      const mergedInput = {
        ...input,
        overhead:
          input.overhead > 0
            ? input.overhead
            : get().defaults.overhead ?? 0,
        targetTrueRpm:
          input.targetTrueRpm > 0
            ? input.targetTrueRpm
            : get().defaults.targetTrueRpm ?? 2,
        mpg:
          input.mpg > 0 ? input.mpg : get().defaults.defaultMpg ?? 6.5,
        payStructure:
          input.payStructure ?? get().defaults.defaultPayStructure,
        maintenanceReserve:
          input.maintenanceReserve > 0
            ? input.maintenanceReserve
            : get().defaults.maintenanceReserve ?? 0,
        tireReserve:
          input.tireReserve > 0
            ? input.tireReserve
            : get().defaults.tireReserve ?? 0,
        trailerFee:
          input.trailerFee > 0
            ? input.trailerFee
            : get().defaults.trailerFee ?? 0,
        insuranceAllocation:
          input.insuranceAllocation > 0
            ? input.insuranceAllocation
            : get().defaults.insuranceAllocation ?? 0,
        variableCostPerMile:
          input.variableCostPerMile > 0
            ? input.variableCostPerMile
            : get().defaults.variableCostPerMile ?? 0,
        fixedCostAllocation:
          input.fixedCostAllocation > 0
            ? input.fixedCostAllocation
            : get().defaults.fixedCostAllocation ?? 0,
        dispatchPercent:
          input.dispatchPercent > 0
            ? input.dispatchPercent
            : get().defaults.dispatchPercent ?? 0,
        factoringPercent:
          input.factoringPercent > 0
            ? input.factoringPercent
            : get().defaults.factoringPercent ?? 0,
        profileDerivedValues: {
          dailyFixedOverhead:
            input.profileDerivedValues?.dailyFixedOverhead ??
            get().defaults.overhead ??
            0,
          operatingDaysPerWeek:
            input.profileDerivedValues?.operatingDaysPerWeek ??
            get().defaults.operatingDaysPerWeek ??
            5.5,
          operatingDaysPerMonth:
            input.profileDerivedValues?.operatingDaysPerMonth ??
            get().defaults.operatingDaysPerMonth ??
            23.8,
          dispatchPercent:
            input.profileDerivedValues?.dispatchPercent ??
            get().defaults.dispatchPercent ??
            0,
          factoringPercent:
            input.profileDerivedValues?.factoringPercent ??
            get().defaults.factoringPercent ??
            0,
          maintenanceReserve:
            input.profileDerivedValues?.maintenanceReserve ??
            get().defaults.maintenanceReserve ??
            0,
          tireReserve:
            input.profileDerivedValues?.tireReserve ??
            get().defaults.tireReserve ??
            0,
          trailerFee:
            input.profileDerivedValues?.trailerFee ??
            get().defaults.trailerFee ??
            0,
          insuranceAllocation:
            input.profileDerivedValues?.insuranceAllocation ??
            get().defaults.insuranceAllocation ??
            0,
          variableCostPerMile:
            input.profileDerivedValues?.variableCostPerMile ??
            get().defaults.variableCostPerMile ??
            0,
          fixedCostAllocation:
            input.profileDerivedValues?.fixedCostAllocation ??
            get().defaults.fixedCostAllocation ??
            0,
          mpg:
            input.profileDerivedValues?.mpg ?? get().defaults.defaultMpg ?? 6.5,
          targetTrueRpm:
            input.profileDerivedValues?.targetTrueRpm ??
            get().defaults.targetTrueRpm ??
            2,
          incomeTargetDaily:
            input.profileDerivedValues?.incomeTargetDaily ??
            get().defaults.incomeTargetDaily ??
            0,
          incomeTargetWeekly:
            input.profileDerivedValues?.incomeTargetWeekly ??
            get().defaults.incomeTargetWeekly ??
            0,
          minimumHourlyProfitability:
            input.profileDerivedValues?.minimumHourlyProfitability ??
            get().defaults.minimumHourlyProfitability ??
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
  
