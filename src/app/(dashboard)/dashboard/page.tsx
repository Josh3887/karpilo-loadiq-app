import { redirect } from "next/navigation";

import { getLaunchPhaseSnapshot, LAUNCH_SLOT_LIMIT, PILOT_SLOT_LIMIT } from "@/config/launch-phases";
import {
  getOperatorProgramCounts,
  getOperatorProgramStatus,
} from "@/domains/billing/operator-program";
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

  const { data: onboarding, error: onboardingError } = await supabase
    .from("onboarding_states")
    .select("is_complete")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!onboardingError && !onboarding?.is_complete) {
    redirect("/dashboard/onboarding");
  }

  const [operatorStatus, programCounts] = await Promise.all([
    getOperatorProgramStatus(user.id),
    getOperatorProgramCounts(),
  ]);
  const claimedOperatorCount =
    programCounts.pilotClaimed + programCounts.launchClaimed;
  const launchSnapshot = getLaunchPhaseSnapshot(
    new Date(),
    claimedOperatorCount
  );

  return (
    <DashboardClientPage
      editLoadId={edit}
      templateId={template}
      operatorStatus={operatorStatus}
      launchSnapshot={launchSnapshot}
      pilotSlotsRemaining={Math.max(PILOT_SLOT_LIMIT - programCounts.pilotClaimed, 0)}
      launchSlotsRemaining={Math.max(LAUNCH_SLOT_LIMIT - programCounts.launchClaimed, 0)}
      claimedOperatorCount={claimedOperatorCount}
    />
  );
}
