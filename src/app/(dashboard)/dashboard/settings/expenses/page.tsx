import { redirect } from "next/navigation";

import { OverheadManager } from "@/components/dashboard/overhead-manager";
import {
  SettingsMetric,
  SettingsPageShell,
  SettingsPanel,
} from "@/components/settings/settings-shell";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";

export default async function ExpenseSettingsPage() {
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
      <ExpenseSettingsContent
        overheadCount={2}
        templateCount={1}
        settingsCount={1}
      />
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  const [overheadCount, templateCount, settingsCount] = await Promise.all([
    supabase
      .from("user_overhead_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("pay_structure_templates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("user_settings")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <ExpenseSettingsContent
      overheadCount={overheadCount.count ?? 0}
      templateCount={templateCount.count ?? 0}
      settingsCount={settingsCount.count ?? 0}
    />
  );
}

function ExpenseSettingsContent({
  overheadCount,
  templateCount,
  settingsCount,
}: {
  overheadCount: number;
  templateCount: number;
  settingsCount: number;
}) {
  return (
    <SettingsPageShell
      title="Expense Intelligence"
      description="Operational cost defaults, recurring overhead, category assumptions, deductions, and export-ready expense context."
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SettingsMetric
          label="Overhead Items"
          value={String(overheadCount)}
          detail="Recurring cost records"
          tone="red"
        />
        <SettingsMetric
          label="Pay Templates"
          value={String(templateCount)}
          detail="Existing compensation assumptions"
        />
        <SettingsMetric
          label="Defaults Profile"
          value={settingsCount > 0 ? "Active" : "Pending"}
          detail="Stored in existing user_settings"
          tone={settingsCount > 0 ? "green" : "default"}
        />
      </section>

      <SettingsPanel
        title="Overhead & Deduction Controls"
        description="These controls write to the existing overhead and settings tables used by the calculator."
      >
        <OverheadManager />
      </SettingsPanel>
    </SettingsPageShell>
  );
}
