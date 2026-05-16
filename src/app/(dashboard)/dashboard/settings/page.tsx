import { redirect } from "next/navigation";

import {
  LOADIQ_SETTINGS_LINKS,
  SettingsMetric,
  SettingsNavCard,
  SettingsPageShell,
  SettingsPanel,
  StatusPill,
} from "@/components/settings/settings-shell";
import { getOperatorProgramStatus } from "@/domains/billing/operator-program";
import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import { formatPlanTierLabel } from "@/domains/billing/plan-limits";
import {
  getPreviewPaymentAccess,
  PREVIEW_OPERATOR_STATUS,
} from "@/lib/preview-data";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";

export default async function SettingsPage() {
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
      <SettingsContent
        paymentAccess={getPreviewPaymentAccess()}
        operatorLabel="Preview Operator / Karpilo LoadIQ"
        operationType="Preview only"
        vehicleLabel="Preview truck"
        vehicleMpg="6.5 MPG default"
        overheadCount={2}
        templateCount={1}
        operatorStatus={PREVIEW_OPERATOR_STATUS}
      />
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const [
    { data: profile },
    { data: truckProfile },
    { data: operatorProfile },
    overheadCount,
    templateCount,
    operatorStatus,
    paymentAccess,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("profile_name, company_name, operation_type")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("truck_profiles")
      .select("make, model, year, default_mpg")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("operator_profiles")
      .select("display_name, company_name")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_overhead_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("pay_structure_templates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    getOperatorProgramStatus(user.id),
    getServerPaymentAccess(user.id, user.email),
  ]);

  const vehicleLabel =
    [truckProfile?.year, truckProfile?.make, truckProfile?.model]
      .filter(Boolean)
      .join(" ") || "Not set";
  const operatorName =
    profile?.profile_name || operatorProfile?.display_name || user.email || "Operator";
  const companyName = profile?.company_name || operatorProfile?.company_name;
  const operatorLabel = companyName
    ? `${operatorName} / ${companyName}`
    : operatorName;

  return (
    <SettingsContent
      paymentAccess={paymentAccess}
      operatorLabel={operatorLabel}
      operationType={profile?.operation_type ?? "Operation profile pending"}
      vehicleLabel={vehicleLabel}
      vehicleMpg={
        truckProfile?.default_mpg
          ? `${truckProfile.default_mpg} MPG default`
          : "MPG default pending"
      }
      overheadCount={overheadCount.count ?? 0}
      templateCount={templateCount.count ?? 0}
      operatorStatus={operatorStatus}
    />
  );
}

function SettingsContent({
  paymentAccess,
  operatorLabel,
  operationType,
  vehicleLabel,
  vehicleMpg,
  overheadCount,
  templateCount,
  operatorStatus,
}: {
  paymentAccess: Awaited<ReturnType<typeof getServerPaymentAccess>>;
  operatorLabel: string;
  operationType: string;
  vehicleLabel: string;
  vehicleMpg: string;
  overheadCount: number;
  templateCount: number;
  operatorStatus: Awaited<ReturnType<typeof getOperatorProgramStatus>>;
}) {
  return (
    <SettingsPageShell
      title="Karpilo LoadIQ Command Settings"
      description="A dispatch-grade settings hub for account access, billing status, expense intelligence, and vehicle assumptions."
      actions={
        <StatusPill tone={paymentAccess.hasActiveAccess ? "green" : "red"}>
          {formatStatus(paymentAccess.entitlementStatus)}
        </StatusPill>
      }
    >
      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SettingsMetric
          label="Name / Company"
          value={operatorLabel}
          detail={operationType}
          tone="blue"
        />
        <SettingsMetric
          label="Entitlement"
          value={formatStatus(paymentAccess.entitlementStatus)}
          detail={`${formatPlanTierLabel(paymentAccess.tier)} via ${paymentAccess.billingProvider}`}
          tone={paymentAccess.hasActiveAccess ? "green" : "red"}
        />
        <SettingsMetric
          label="Expense Controls"
          value={String(overheadCount)}
          detail={`${templateCount} pay templates`}
        />
        <SettingsMetric
          label="Vehicle"
          value={vehicleLabel}
          detail={vehicleMpg}
        />
      </section>

      <SettingsPanel
        title="Command Stations"
        description="APP owns protected settings. Each station uses the current Supabase auth session and existing Karpilo LoadIQ profile, billing, and operating tables."
      >
        <div className="grid gap-5 md:grid-cols-2">
          {LOADIQ_SETTINGS_LINKS.slice(1).map((item) => (
            <SettingsNavCard
              key={item.href}
              href={item.href}
              title={item.title}
              description={item.description}
              icon={item.icon}
              accent={item.accent}
            />
          ))}
        </div>
      </SettingsPanel>

      {operatorStatus.badges.length > 0 && (
        <SettingsPanel
          title="Operator Access Badges"
          description={operatorStatus.statusMessage}
          kicker="Program State"
        >
          <div className="flex flex-wrap gap-3">
            {operatorStatus.badges.map((badge) => (
              <StatusPill
                key={badge.label}
                tone={badge.tone === "red" ? "red" : "green"}
              >
                {badge.label}
              </StatusPill>
            ))}
          </div>
        </SettingsPanel>
      )}
    </SettingsPageShell>
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}
