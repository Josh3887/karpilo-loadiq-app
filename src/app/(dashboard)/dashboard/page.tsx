import { redirect } from "next/navigation";

import { getLaunchPhaseSnapshot, LAUNCH_SLOT_LIMIT, PILOT_SLOT_LIMIT } from "@/config/launch-phases";
import {
  getOperatorProgramCounts,
  getOperatorProgramStatus,
} from "@/domains/billing/operator-program";
import {
  PREVIEW_LAUNCH_SNAPSHOT,
  PREVIEW_OPERATOR_STATUS,
} from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import {
  getAdminAccessForUser,
  type AdminRole,
} from "@/lib/admin/roles";
import { createClient } from "@/lib/supabase-server";

import DashboardClientPage from "./page.client";

const ADMIN_CONTROL_PLANE_ENTRY_ROLES = [
  "owner",
  "admin",
  "developer",
] as const satisfies readonly AdminRole[];

type AdminControlPlaneRole = (typeof ADMIN_CONTROL_PLANE_ENTRY_ROLES)[number];

function isAdminControlPlaneRole(
  role: AdminRole
): role is AdminControlPlaneRole {
  return ADMIN_CONTROL_PLANE_ENTRY_ROLES.includes(
    role as AdminControlPlaneRole
  );
}

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
  const previewMode = await isPreviewModeEnabled();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !previewMode) {
    redirect("/auth/login");
  }

  if (previewMode && !user) {
    return (
      <DashboardClientPage
        editLoadId={edit}
        templateId={template}
        operatorStatus={PREVIEW_OPERATOR_STATUS}
        launchSnapshot={PREVIEW_LAUNCH_SNAPSHOT}
        pilotSlotsRemaining={0}
        launchSlotsRemaining={0}
        claimedOperatorCount={551}
        previewMode
        adminControlPlaneAccess={null}
      />
    );
  }

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
  let adminControlPlaneAccess: { highestRole: AdminControlPlaneRole } | null =
    null;

  try {
    const adminAccess = await getAdminAccessForUser(user);

    if (adminAccess && isAdminControlPlaneRole(adminAccess.highestRole)) {
      adminControlPlaneAccess = {
        highestRole: adminAccess.highestRole,
      };
    }
  } catch (error) {
    console.error("Unable to resolve admin control-plane entry access.", error);
  }

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
      previewMode={previewMode}
      adminControlPlaneAccess={adminControlPlaneAccess}
    />
  );
}
