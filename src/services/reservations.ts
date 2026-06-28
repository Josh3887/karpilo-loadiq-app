import { createClient } from "@/lib/supabase-server";

export type ReservationCodeRecord = {
  id: string;
  code: string;
  cohort: "pilot50" | "launch500";
  status: "available" | "reserved" | "redeemed" | "lapsed" | "revoked";
  seat_number: number | null;
  monthly_price: number;
  annual_price: number;
  billing_provider: "stripe" | "apple" | "google" | "manual" | null;
  expires_at: string | null;
};

export type PricingLockStatusRecord = {
  id: string;
  cohort: "pilot50" | "launch500";
  lock_status: "active" | "past_due" | "lapsed" | "revoked";
  billing_provider: "stripe" | "apple" | "google" | "manual";
  provider_subscription_id: string | null;
  monthly_price: number;
  annual_price: number;
  active_since: string;
  lapsed_at: string | null;
  revoked_at: string | null;
  reason: string | null;
};

export async function getUserReservationAndLockState(userId: string) {
  const supabase = await createClient();

  const [{ data: reservations }, { data: locks }] = await Promise.all([
    supabase
      .from("reservation_codes")
      .select(
        "id,code,cohort,status,seat_number,monthly_price,annual_price,billing_provider,expires_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("pricing_lock_status")
      .select(
        "id,cohort,lock_status,billing_provider,provider_subscription_id,monthly_price,annual_price,active_since,lapsed_at,revoked_at,reason"
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
  ]);

  return {
    reservations: (reservations ?? []) as ReservationCodeRecord[],
    locks: (locks ?? []) as PricingLockStatusRecord[],
  };
}
