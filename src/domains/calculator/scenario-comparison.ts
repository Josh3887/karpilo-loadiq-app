import { calculateLoadMetrics } from "@/domains/calculator/calculator-engine";
import { LoadInput, LoadResult, PayStructure } from "@/types/load";

export type ScenarioComparison = {
  id: string;
  label: string;
  description: string;
  result: LoadResult;
};

function percentagePay(
  label: string,
  percentageChain: number[]
): PayStructure {
  return {
    type: "percentage",
    label,
    percentageChain,
    cpmRate: 0,
    flatAmount: 0,
    dailyRate: 0,
    includeFuelSurcharge: true,
    includeAccessorials: true,
  };
}

function withPayStructure(
  input: LoadInput,
  payStructure: PayStructure
): LoadInput {
  return {
    ...input,
    payStructure,
  };
}

export function buildScenarioComparisons(
  input: LoadInput
): ScenarioComparison[] {
  const currentPay = input.payStructure ?? percentagePay("Current", [100]);
  const scenarios: Array<{
    id: string;
    label: string;
    description: string;
    input: LoadInput;
  }> = [
    {
      id: "current",
      label: currentPay.label || "Current",
      description: "Your entered pay and cost assumptions.",
      input,
    },
    {
      id: "gross_100",
      label: "100% Gross",
      description: "Independent/authority-style gross revenue model.",
      input: withPayStructure(input, percentagePay("100% gross", [100])),
    },
    {
      id: "gross_88",
      label: "88% Gross",
      description: "Common lease operator gross percentage model.",
      input: withPayStructure(input, percentagePay("88% gross", [88])),
    },
    {
      id: "gross_75_of_98",
      label: "75% of 98%",
      description: "Nested carrier split model.",
      input: withPayStructure(input, percentagePay("75% of 98%", [98, 75])),
    },
    {
      id: "authority_low_drag",
      label: "Authority Low Drag",
      description: "100% gross with dispatch and factoring removed.",
      input: {
        ...withPayStructure(input, percentagePay("Authority low drag", [100])),
        dispatchPercent: 0,
        factoringPercent: 0,
      },
    },
  ];

  return scenarios.map((scenario) => ({
    id: scenario.id,
    label: scenario.label,
    description: scenario.description,
    result: calculateLoadMetrics(scenario.input),
  }));
}
