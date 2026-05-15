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
import { createClient } from "@/lib/supabase-server";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    getServerPaymentAccess(user.id),
  ]);

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
          value={user.email ?? "Unknown"}
          detail="Supabase Auth identity"
          tone="blue"
        />
        <SettingsMetric
          label="Operator Profile"
          value={profile?.profile_name || profile?.company_name || "Not set"}
          detail={profile?.operation_type ?? "Operation type pending"}
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
        <AccountSecurityPanel currentEmail={user.email ?? ""} />
      </SettingsPanel>
    </SettingsPageShell>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
