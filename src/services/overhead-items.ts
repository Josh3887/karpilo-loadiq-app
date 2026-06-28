import { createClient } from "@/lib/supabase-client";
import {
  normalizePlanTier,
  normalizeEntitlementStatus,
  isActiveEntitlementStatus,
} from "@/domains/billing/entitlement-service";
import { getPlanLimits } from "@/domains/billing/plan-limits";
import {
  FOUNDER_ACCESS,
  GOLD_ACCESS,
  PILOT_ACCESS,
  PLATINUM_ACCESS,
} from "@/config/pricing";

export type OverheadAmountType = "flat" | "cpm" | "percent";

export type OverheadFrequency =
  | "daily"
  | "by_mile"
  | "by_day"
  | "biweekly"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "annually"
  | "annual"
  | "per_trip"
  | "none";

export type OverheadResponsibility =
  | "driver"
  | "carrier"
  | "split"
  | "reimbursed";

export type OverheadItem = {
  id: string;
  user_id: string;
  label: string;
  category: string;
  amount: number;
  amount_type: OverheadAmountType;
  frequency: OverheadFrequency;
  responsibility: OverheadResponsibility;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  system_generated?: boolean;
};

export type CreateOverheadItemPayload = {
  label: string;
  category: string;
  amount: number;
  amount_type: OverheadAmountType;
  frequency: OverheadFrequency;
  responsibility: OverheadResponsibility;
  is_active: boolean;
};

export type OverheadBreakdown = {
  weekly: number;
  monthly: number;
  daily: number;
  annual: number;
  operatingDaysPerWeek: number;
  operatingDaysPerMonth: number;
};

const DEFAULT_OPERATING_DAYS_PER_WEEK = 5.5;
const LOADIQ_SUBSCRIPTION_ITEM_ID = "system-loadiq-subscription-expense";

type SubscriptionExpenseRecord = {
  tier?: unknown;
  status?: unknown;
  entitlement_status?: unknown;
  billing_interval?: unknown;
  plan_code?: unknown;
};

function roundCurrency(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

function normalizeFlatToAnnual(amount: number, frequency: OverheadFrequency) {
  if (frequency === "daily" || frequency === "by_day") {
    return amount * DEFAULT_OPERATING_DAYS_PER_WEEK * 52;
  }

  if (frequency === "weekly") return amount * 52;
  if (frequency === "biweekly") return amount * 26;
  if (frequency === "monthly") return amount * 12;
  if (frequency === "quarterly") return amount * 4;
  if (frequency === "annual" || frequency === "annually") return amount;

  return 0;
}

export function normalizeFlatToWeekly(amount: number, frequency: OverheadFrequency) {
  if (frequency === "weekly") return amount;
  if (frequency === "daily" || frequency === "by_day") {
    return amount * DEFAULT_OPERATING_DAYS_PER_WEEK;
  }
  if (frequency === "biweekly") return amount / 2;
  if (frequency === "monthly") return amount / 4.33;
  if (frequency === "quarterly") return amount / 13;
  if (frequency === "annual" || frequency === "annually") return amount / 52;

  return 0;
}

export function normalizeFlatToMonthly(amount: number, frequency: OverheadFrequency) {
  if (frequency === "monthly") return amount;
  return normalizeFlatToAnnual(amount, frequency) / 12;
}

export function calculateWeeklyOverhead(items: OverheadItem[]) {
  return items
    .filter((item) => item.is_active)
    .filter((item) => item.responsibility === "driver")
    .filter((item) => item.amount_type === "flat")
    .reduce((total, item) => {
      return total + normalizeFlatToWeekly(Number(item.amount), item.frequency);
    }, 0);
}

export function calculateOverheadBreakdown(
  items: OverheadItem[],
  operatingDaysPerWeek = DEFAULT_OPERATING_DAYS_PER_WEEK
): OverheadBreakdown {
  const annual = items
    .filter((item) => item.is_active)
    .filter((item) => item.responsibility === "driver")
    .filter((item) => item.amount_type === "flat")
    .reduce((total, item) => {
      return total + normalizeFlatToAnnual(Number(item.amount), item.frequency);
    }, 0);

  const weekly = annual / 52;
  const monthly = annual / 12;
  const safeOperatingDaysPerWeek = Math.max(operatingDaysPerWeek, 1);
  const operatingDaysPerMonth = safeOperatingDaysPerWeek * 4.33;
  const daily = monthly / operatingDaysPerMonth;

  return {
    weekly: roundCurrency(weekly),
    monthly: roundCurrency(monthly),
    daily: roundCurrency(daily),
    annual: roundCurrency(annual),
    operatingDaysPerWeek: roundCurrency(safeOperatingDaysPerWeek),
    operatingDaysPerMonth: roundCurrency(operatingDaysPerMonth),
  };
}

export function calculateCpmExposure(items: OverheadItem[]) {
  return items
    .filter((item) => item.is_active)
    .filter((item) => item.responsibility === "driver")
    .filter((item) => item.amount_type === "cpm")
    .reduce((total, item) => total + Number(item.amount), 0);
}

export function calculatePercentDeductions(items: OverheadItem[]) {
  return items
    .filter((item) => item.is_active)
    .filter((item) => item.responsibility === "driver")
    .filter((item) => item.amount_type === "percent")
    .reduce((total, item) => total + Number(item.amount), 0);
}

export async function getOverheadItems() {
  return getOverheadItemsWithOptions();
}

export async function getOverheadItemsWithSubscriptionExpense() {
  return getOverheadItemsWithOptions({ includeSubscriptionExpense: true });
}

async function getOverheadItemsWithOptions(options?: {
  includeSubscriptionExpense?: boolean;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("user_overhead_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = data as OverheadItem[];

  if (!options?.includeSubscriptionExpense) {
    return items;
  }

  const subscriptionExpense = await getLoadIqSubscriptionExpenseItem({
    supabase,
    userId: user.id,
    existingItems: items,
  }).catch((error) => {
    console.error("LOADIQ_SUBSCRIPTION_EXPENSE_ERROR", error);
    return null;
  });

  return subscriptionExpense ? [subscriptionExpense, ...items] : items;
}

async function getLoadIqSubscriptionExpenseItem({
  supabase,
  userId,
  existingItems,
}: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  existingItems: OverheadItem[];
}): Promise<OverheadItem | null> {
  if (hasManualLoadIqSubscriptionExpense(existingItems)) {
    return null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("tier,status,entitlement_status,billing_interval,plan_code")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) throw new Error(error.message);
    return null;
  }

  const entitlementStatus = normalizeEntitlementStatus(
    data.entitlement_status ?? data.status
  );
  if (!isActiveEntitlementStatus(entitlementStatus)) {
    return null;
  }

  const monthlyEquivalent = getSubscriptionMonthlyExpense(data);

  if (monthlyEquivalent <= 0) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: LOADIQ_SUBSCRIPTION_ITEM_ID,
    user_id: userId,
    label: "Karpilo LoadIQ subscription",
    category: "software_subscription",
    amount: Number(monthlyEquivalent.toFixed(2)),
    amount_type: "flat",
    frequency: "monthly",
    responsibility: "driver",
    is_active: true,
    created_at: now,
    updated_at: now,
    system_generated: true,
  };
}

function getSubscriptionMonthlyExpense(subscription: SubscriptionExpenseRecord) {
  const planCode =
    typeof subscription.plan_code === "string"
      ? subscription.plan_code.toLowerCase().replace(/_/g, "-")
      : "";
  const billingInterval =
    typeof subscription.billing_interval === "string"
      ? subscription.billing_interval.toLowerCase()
      : "";
  const interval =
    billingInterval === "year" ||
    billingInterval === "annual" ||
    billingInterval === "ann" ||
    billingInterval === "annually" ||
    planCode.endsWith("-annual") ||
    planCode.endsWith("-ann")
      ? "year"
      : "month";
  const tier = normalizePlanTier(subscription.tier);
  const planPriceByCode: Record<string, number> = {
    "pilot-monthly": PILOT_ACCESS.monthlyPrice,
    "pilot-mo": PILOT_ACCESS.monthlyPrice,
    "pilot-annual": PILOT_ACCESS.annualPrice,
    "pilot-ann": PILOT_ACCESS.annualPrice,
    "launch500-monthly": FOUNDER_ACCESS.monthlyPrice,
    "launch500-mo": FOUNDER_ACCESS.monthlyPrice,
    "launch500-annual": FOUNDER_ACCESS.annualPrice,
    "launch500-ann": FOUNDER_ACCESS.annualPrice,
    "launch-monthly": FOUNDER_ACCESS.monthlyPrice,
    "launch-mo": FOUNDER_ACCESS.monthlyPrice,
    "launch-annual": FOUNDER_ACCESS.annualPrice,
    "launch-ann": FOUNDER_ACCESS.annualPrice,
    "legacy-launch-monthly": FOUNDER_ACCESS.monthlyPrice,
    "legacy-launch-mo": FOUNDER_ACCESS.monthlyPrice,
    "legacy-launch-annual": FOUNDER_ACCESS.annualPrice,
    "legacy-launch-ann": FOUNDER_ACCESS.annualPrice,
    "pro-monthly": GOLD_ACCESS.monthlyPrice,
    "pro-mo": GOLD_ACCESS.monthlyPrice,
    "pro-annual": GOLD_ACCESS.annualPrice,
    "pro-ann": GOLD_ACCESS.annualPrice,
    "gold-monthly": GOLD_ACCESS.monthlyPrice,
    "gold-mo": GOLD_ACCESS.monthlyPrice,
    "gold-annual": GOLD_ACCESS.annualPrice,
    "gold-ann": GOLD_ACCESS.annualPrice,
    "platinum-monthly": PLATINUM_ACCESS.monthlyPrice,
    "platinum-mo": PLATINUM_ACCESS.monthlyPrice,
    "platinum-annual": PLATINUM_ACCESS.annualPrice,
    "platinum-ann": PLATINUM_ACCESS.annualPrice,
  };
  const planPrice = planPriceByCode[planCode] ?? null;

  if (planPrice !== null) {
    return interval === "year" ? planPrice / 12 : planPrice;
  }

  const limits = getPlanLimits(tier);
  return interval === "year" && limits.annualPrice > 0
    ? limits.annualPrice / 12
    : limits.monthlyPrice;
}

function hasManualLoadIqSubscriptionExpense(items: OverheadItem[]) {
  return items.some((item) => {
    if (!item.is_active || item.amount_type !== "flat") return false;
    if (item.responsibility !== "driver") return false;

    const label = item.label.toLowerCase();
    const category = item.category.toLowerCase();

    return (
      label.includes("loadiq") ||
      label.includes("load iq") ||
      label.includes("karpilo loadiq") ||
      category === "loadiq_subscription" ||
      category === "software_subscription"
    );
  });
}

export async function createOverheadItem(payload: CreateOverheadItemPayload) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase.from("user_overhead_items").insert({
    user_id: user.id,
    ...payload,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteOverheadItem(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("user_overhead_items")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
