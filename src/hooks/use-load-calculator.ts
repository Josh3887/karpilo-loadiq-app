import { create } from "zustand";

import { LoadInput, LoadResult } from "@/types/load";
import { calculateLoadMetrics } from "@/services/load-calculator";

type LoadCalculatorState = {
  result: LoadResult | null;
  lastInput: LoadInput | null;

  calculate: (input: LoadInput) => void;

  reset: () => void;
};

export const useLoadCalculator =
  create<LoadCalculatorState>((set) => ({
    result: null,

    lastInput: null,

    calculate: (input) => {
      const result = calculateLoadMetrics(input);

      set({
        result,
        lastInput: input,
      });
    },

    reset: () => {
      set({
        result: null,
        lastInput: null,
      });
    },
  }));
