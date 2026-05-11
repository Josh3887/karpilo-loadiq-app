import { redirect } from "next/navigation";

import { LOADIQ_DISCLAIMER_VERSION } from "@/config/legal";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import { createClient } from "@/lib/supabase-server";

import DashboardClientPage from "./page.client";

type DashboardPageProps = {
  searchParams: Promise<{
    edit?: string;
    template?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { edit, template } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("disclaimer_accepted_at, disclaimer_version")
    .eq("id", user.id)
    .maybeSingle();

  const requiresDisclaimer =
    !profile?.disclaimer_accepted_at ||
    profile.disclaimer_version !== LOADIQ_DISCLAIMER_VERSION;

  if (!requiresDisclaimer) {
    const { data: onboarding, error: onboardingError } = await supabase
      .from("onboarding_states")
      .select("is_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!onboardingError && !onboarding?.is_complete) {
      redirect("/dashboard/onboarding");
    }
  }

  const operatorStatus = await getOperatorProgramStatus(user.id);

  return (
    <DashboardClientPage
      editLoadId={edit}
      templateId={template}
      requiresDisclaimer={requiresDisclaimer}
      operatorStatus={operatorStatus}
    />
  );
}
