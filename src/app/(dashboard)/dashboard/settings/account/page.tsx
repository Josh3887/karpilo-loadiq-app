import { redirect } from "next/navigation";

import { AccountSecurityPanel } from "@/components/settings/account-security-panel";
import {
  SettingsMetric,
  SettingsPageShell,
  SettingsPanel,
  StatusPill,
} from "@/components/settings/settings-shell";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import {
  getPreviewPaymentAccess,
  PREVIEW_OPERATOR_STATUS,
  PREVIEW_USER_EMAIL,
} from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";

export default async function AccountSettingsPage() {
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
      <AccountSettingsContent
        email={PREVIEW_USER_EMAIL}
        profileName="Preview Operator"
        profileDetail="Preview only"
        operatorStatus={PREVIEW_OPERATOR_STATUS}
        paymentAccess={getPreviewPaymentAccess()}
      />
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: profile }, operatorStatus, paymentAccess] = await Promise.all([
    supabase
      .from("users")
      .select("profile_name, company_name, operation_type")
      .eq("id", user.id)
      .maybeSingle(),
    getOperatorProgramStatus(user.id),
    getServerPaymentAccess(user.id, user.email),
  ]);

  return (
    <AccountSettingsContent
      email={user.email ?? "Unknown"}
      profileName={profile?.profile_name || profile?.company_name || "Not set"}
      profileDetail={profile?.operation_type ?? "Operation type pending"}
      operatorStatus={operatorStatus}
      paymentAccess={paymentAccess}
    />
  );
}

function AccountSettingsContent({
  email,
  profileName,
  profileDetail,
  operatorStatus,
  paymentAccess,
}: {
  email: string;
  profileName: string;
  profileDetail: string;
  operatorStatus: Awaited<ReturnType<typeof getOperatorProgramStatus>>;
  paymentAccess: Awaited<ReturnType<typeof getServerPaymentAccess>>;
}) {
  return (
    <SettingsPageShell
      title="Operator Identity"
      description="Control the authenticated operator account that owns dashboard access, profile defaults, and subscription entitlement."
      actions={
        <StatusPill tone={paymentAccess.hasActiveAccess ? "green" : "red"}>
          {formatStatus(paymentAccess.entitlementStatus)}
        </StatusPill>
      }
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SettingsMetric
          label="Current Email"
          value={email}
          detail="Supabase Auth identity"
          tone="blue"
        />
        <SettingsMetric
          label="Operator Profile"
          value={profileName}
          detail={profileDetail}
        />
        <SettingsMetric
          label="Program"
          value={operatorStatus.program}
          detail={operatorStatus.statusTitle}
          tone={operatorStatus.pilotUser ? "green" : "default"}
        />
      </section>

      <SettingsPanel
        title="Account Controls"
        description="Email, password, forgot-password access, and logout stay attached to the existing Supabase Auth user."
      >
        <AccountSecurityPanel currentEmail={email} />
      </SettingsPanel>
    </SettingsPageShell>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
