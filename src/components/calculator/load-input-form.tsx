"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  defaultLoadInputValues,
  loadInputSchema,
  LoadInputFormValues,
} from "@/lib/load-schema";

type LoadInputRawValues = z.input<typeof loadInputSchema>;

type LoadInputFormProps = {
  onCalculate: (values: LoadInputFormValues) => void;
};

export function LoadInputForm({ onCalculate }: LoadInputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoadInputRawValues>({
    resolver: zodResolver(loadInputSchema),
    defaultValues: defaultLoadInputValues,
  });

  function submit(values: LoadInputRawValues) {
    const parsedValues = loadInputSchema.parse(values);
    onCalculate(parsedValues);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Pickup ZIP" error={errors.pickupZip?.message} {...register("pickupZip")} />
        <InputField label="Delivery ZIP" error={errors.deliveryZip?.message} {...register("deliveryZip")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Loaded Miles" type="number" error={errors.loadedMiles?.message} {...register("loadedMiles")} />
        <InputField label="Deadhead Miles" type="number" error={errors.deadheadMiles?.message} {...register("deadheadMiles")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="RPM" type="number" step="0.01" error={errors.ratePerMile?.message} {...register("ratePerMile")} />
        <InputField label="Target True RPM" type="number" step="0.01" error={errors.targetTrueRpm?.message} {...register("targetTrueRpm")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Fuel Price" type="number" step="0.01" error={errors.fuelPrice?.message} {...register("fuelPrice")} />
        <InputField label="MPG" type="number" step="0.1" error={errors.mpg?.message} {...register("mpg")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Overhead" type="number" step="0.01" error={errors.overhead?.message} {...register("overhead")} />
        <InputField label="Accessorials" type="number" step="0.01" error={errors.accessorials?.message} {...register("accessorials")} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Tolls" type="number" step="0.01" error={errors.tolls?.message} {...register("tolls")} />
        <InputField label="Lumpers" type="number" step="0.01" error={errors.lumpers?.message} {...register("lumpers")} />
      </div>

      <InputField label="Reserve Allocation" type="number" step="0.01" error={errors.reserveAllocation?.message} {...register("reserveAllocation")} />

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Factoring %" type="number" step="0.01" error={errors.factoringPercent?.message} {...register("factoringPercent")} />
        <InputField label="Dispatch %" type="number" step="0.01" error={errors.dispatchPercent?.message} {...register("dispatchPercent")} />
      </div>

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

      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  );
}