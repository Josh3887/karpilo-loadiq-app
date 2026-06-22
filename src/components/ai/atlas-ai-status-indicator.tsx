"use client";

import { CheckCircle2, OctagonAlert, TimerReset } from "lucide-react";

export type AtlasAiStatusInfo = {
  status: "available" | "limited" | "disabled";
  reason?: string;
  message?: string;
  retryAfterSeconds?: number;
  budget?: {
    dailyLimit: number;
    monthlyLimit: number;
    monthlyTokenCap?: number;
    addonTokensAvailable?: number;
    remainingToday: number;
    remainingMonth: number;
    remainingTokensMonth?: number;
    premiumAddOnEligible?: boolean;
  };
};

type AtlasAiStatusIndicatorProps = {
  statusInfo: AtlasAiStatusInfo | null;
};

export function AtlasAiStatusIndicator({
  statusInfo,
}: AtlasAiStatusIndicatorProps) {
  if (!statusInfo) {
    return null;
  }

  const isAvailable = statusInfo.status === "available";
  const isCooldown = statusInfo.reason === "ai_cooldown_active";
  const Icon = isAvailable ? CheckCircle2 : isCooldown ? TimerReset : OctagonAlert;
  const label = isAvailable
    ? "Atlas available"
    : isCooldown
      ? "Atlas cooling down"
      : "Atlas limited";

  return (
    <div
      className={[
        "mt-3 flex flex-col gap-2 rounded-xl border p-3 text-xs leading-5",
        isAvailable
          ? "border-lime-400/20 bg-lime-400/5 text-lime-100"
          : "border-amber-300/20 bg-amber-300/5 text-amber-100",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 font-black uppercase tracking-[0.14em]">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </div>
      {statusInfo.message && (
        <p className="text-slate-400">{statusInfo.message}</p>
      )}
      {typeof statusInfo.retryAfterSeconds === "number" && (
        <p className="text-slate-400">
          Try again in {Math.max(statusInfo.retryAfterSeconds, 1)} second(s).
        </p>
      )}
      {statusInfo.budget && statusInfo.status !== "disabled" && (
        <div className="space-y-1 text-slate-500">
          <p>
            Remaining today: {statusInfo.budget.remainingToday}/
            {statusInfo.budget.dailyLimit}. Remaining this month:{" "}
            {statusInfo.budget.remainingMonth}/{statusInfo.budget.monthlyLimit}.
          </p>
          {typeof statusInfo.budget.monthlyTokenCap === "number" && (
            <p>
              Token reserve:{" "}
              {formatTokenCount(statusInfo.budget.remainingTokensMonth ?? 0)}/
              {formatTokenCount(
                statusInfo.budget.monthlyTokenCap +
                  (statusInfo.budget.addonTokensAvailable ?? 0)
              )}
              {statusInfo.budget.premiumAddOnEligible
                ? " with premium add-ons eligible."
                : "."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function formatTokenCount(value: number) {
  const numeric = Math.max(Math.round(Number(value) || 0), 0);

  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }

  if (numeric >= 1_000) {
    return `${Math.round(numeric / 1_000)}K`;
  }

  return String(numeric);
}
