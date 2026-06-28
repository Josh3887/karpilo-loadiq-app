import "server-only";

import { redirect } from "next/navigation";

import { ensureAppUserProfile } from "@/services/app-user-profile";
import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import { createClient } from "@/lib/supabase-server";
import type { AccessStatus, LaunchPhase, PlanKey } from "@/lib/portal/access";

type SupabaseError = {
  message?: string;
};

type QueryResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseError | null;
}>;

export type PortalProfile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  operator_type: string | null;
  plan_interest: PlanKey | null;
  legal_acknowledged_at: string | null;
};

export type PortalAccessRow = {
  user_id: string;
  status: AccessStatus;
  launch_phase: LaunchPhase;
  plan_interest: PlanKey | null;
};

export type BillingAccountRow = {
  user_id: string;
  plan_key: PlanKey | null;
  subscription_status: string | null;
  billing_provider: string | null;
  stripe_customer_id: string | null;
};

export type FitCheckRow = {
  id: string;
  operator_type: string | null;
  authority_status: string | null;
  truck_count: number | null;
  average_monthly_gross: number | null;
  biggest_operating_problem: string | null;
  primary_goal: string | null;
  recommended_plan: PlanKey | null;
  created_at: string | null;
};

export type LegalAcceptanceRow = {
  id: string;
  document_key: string;
  accepted_at: string;
  version: string | null;
};

export type PortalState = {
  profile: PortalProfile | null;
  access: PortalAccessRow | null;
  billing: BillingAccountRow | null;
  latestFitCheck: FitCheckRow | null;
  latestLegalAcceptance: LegalAcceptanceRow | null;
  paymentAccess: Awaited<ReturnType<typeof getServerPaymentAccess>>;
};

async function safeMaybeSingle<T>(query: QueryResult<T>) {
  try {
    const { data, error } = await query;
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getAuthenticatedPortalContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureAppUserProfile(supabase, user);

  const state = await getPortalState(supabase, user.id, user.email);

  return {
    supabase,
    user,
    state,
  };
}

export async function getPortalState(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail?: string | null
): Promise<PortalState> {
  const [profile, access, billing, latestFitCheck, latestLegalAcceptance, paymentAccess] =
    await Promise.all([
      safeMaybeSingle<PortalProfile>(
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
      ),
      safeMaybeSingle<PortalAccessRow>(
        supabase.from("portal_access").select("*").eq("user_id", userId).maybeSingle()
      ),
      safeMaybeSingle<BillingAccountRow>(
        supabase.from("billing_accounts").select("*").eq("user_id", userId).maybeSingle()
      ),
      safeMaybeSingle<FitCheckRow>(
        supabase
          .from("fit_checks")
          .select(
            "id, operator_type, authority_status, truck_count, average_monthly_gross, biggest_operating_problem, primary_goal, recommended_plan, created_at"
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ),
      safeMaybeSingle<LegalAcceptanceRow>(
        supabase
          .from("legal_acceptances")
          .select("id, document_key, accepted_at, version")
          .eq("user_id", userId)
          .order("accepted_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      ),
      getServerPaymentAccess(userId, userEmail),
    ]);

  return {
    profile,
    access,
    billing,
    latestFitCheck,
    latestLegalAcceptance,
    paymentAccess,
  };
}
