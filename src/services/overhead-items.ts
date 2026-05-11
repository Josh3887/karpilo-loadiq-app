import { createClient } from "@/lib/supabase-client";

export type OverheadAmountType = "flat" | "cpm" | "percent";

export type OverheadFrequency =
  | "by_mile"
  | "by_day"
  | "weekly"
  | "monthly"
  | "quarterly"
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

export function normalizeFlatToWeekly(amount: number, frequency: OverheadFrequency) {
  if (frequency === "weekly") return amount;
  if (frequency === "monthly") return amount / 4.33;
  if (frequency === "quarterly") return amount / 13;
  if (frequency === "annual") return amount / 52;

  return 0;
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

  return data as OverheadItem[];
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