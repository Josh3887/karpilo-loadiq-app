"use client";

import { useState } from "react";

import {
  saveUserSettings,
  UserSettingsPayload,
} from "@/services/user-settings";
import { ThemedSelect } from "@/components/ui/themed-select";

const defaultValues: UserSettingsPayload = {
  default_overhead: 0,
  default_reserve_allocation: 0,
  target_profit_margin: 20,
  toll_handling_mode: "trip_specific",
  lumper_handling_mode: "trip_specific",
};

export function SettingsForm() {
  const [values, setValues] =
    useState<UserSettingsPayload>(defaultValues);

  const [status, setStatus] = useState("");

  async function handleSave() {
    try {
      setStatus("Saving operational profile...");

      await saveUserSettings(values);

      setStatus("Operational profile saved.");
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save settings."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <InputField
          label="Default Overhead"
          value={values.default_overhead}
          onChange={(value) =>
            setValues((prev) => ({
              ...prev,
              default_overhead: Number(value),
            }))
          }
        />

        <InputField
          label="Reserve Allocation"
          value={values.default_reserve_allocation}
          onChange={(value) =>
            setValues((prev) => ({
              ...prev,
              default_reserve_allocation: Number(value),
            }))
          }
        />

        <InputField
          label="Target Profit Margin %"
          value={values.target_profit_margin}
          onChange={(value) =>
            setValues((prev) => ({
              ...prev,
              target_profit_margin: Number(value),
            }))
          }
        />

        <SelectField
          label="Toll Handling"
          value={values.toll_handling_mode}
          onChange={(value) =>
            setValues((prev) => ({
              ...prev,
              toll_handling_mode: value,
            }))
          }
          options={[
            {
              label: "Trip Specific",
              value: "trip_specific",
            },
            {
              label: "Included In Overhead",
              value: "overhead",
            },
          ]}
        />

        <SelectField
          label="Lumper Handling"
          value={values.lumper_handling_mode}
          onChange={(value) =>
            setValues((prev) => ({
              ...prev,
              lumper_handling_mode: value,
            }))
          }
          options={[
            {
              label: "Trip Specific",
              value: "trip_specific",
            },
            {
              label: "Included In Overhead",
              value: "overhead",
            },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-400">
          {status}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

type InputFieldProps = {
  label: string;
  value: number;
  onChange: (value: string) => void;
};

function InputField({
  label,
  value,
  onChange,
}: InputFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <input
        type="number"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none focus:border-sky-400"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    label: string;
    value: string;
  }[];
};

function SelectField({
  label,
  value,
  onChange,
  options,
}: SelectFieldProps) {
  return (
    <ThemedSelect
      label={label}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
