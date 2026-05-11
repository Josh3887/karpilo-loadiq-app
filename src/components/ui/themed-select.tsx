"use client";

import { KeyboardEvent, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/utils/cn";

export type ThemedSelectOption = {
  label: string;
  value: string;
  description?: string;
};

type ThemedSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  className?: string;
};

export function ThemedSelect({
  label,
  value,
  onChange,
  options,
  className,
}: ThemedSelectProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(
      options.findIndex((option) => option.value === value),
      0
    )
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value]
  );

  function selectOption(option: ThemedSelectOption) {
    onChange(option.value);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((index) => {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        return (index + direction + options.length) % options.length;
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }

      selectOption(options[activeIndex] ?? selectedOption);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
      onBlur={(event) => {
        if (!wrapperRef.current?.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleKeyDown}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#060B14] px-4 text-left text-sm font-semibold text-slate-100 outline-none transition hover:border-sky-400/60 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      >
        <span className="truncate">{selectedOption?.label ?? "Select"}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-sky-300 transition",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-sky-400/30 bg-[#07111f] p-1 shadow-[0_0_35px_rgba(56,189,248,0.18)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectOption(option)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm transition",
                  isSelected
                    ? "border border-sky-400/30 bg-sky-400/15 text-sky-100"
                    : "border border-transparent text-slate-300",
                  isActive && !isSelected && "bg-slate-800/70 text-slate-100"
                )}
              >
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  {option.description && (
                    <span className="mt-1 block text-xs leading-5 text-slate-500">
                      {option.description}
                    </span>
                  )}
                </span>
                {isSelected && <Check className="mt-0.5 h-4 w-4 text-sky-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
