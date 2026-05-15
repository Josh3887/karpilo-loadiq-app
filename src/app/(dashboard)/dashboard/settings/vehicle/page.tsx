import { redirect } from "next/navigation";

import { OperationalProfileForm } from "@/components/dashboard/operational-profile-form";
import {
  SettingsMetric,
  SettingsPageShell,
  SettingsPanel,
} from "@/components/settings/settings-shell";
import { createClient } from "@/lib/supabase-server";

export default async function VehicleSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [{ data: profile }, { data: truckProfile }] = await Promise.all([
    supabase
      .from("users")
      .select("profile_name, company_name, operation_type")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("truck_profiles")
      .select("make, model, year, engine, odometer, default_mpg")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const vehicleLabel =
    [truckProfile?.year, truckProfile?.make, truckProfile?.model]
      .filter(Boolean)
      .join(" ") || "Not set";

  return (
    <SettingsPageShell
      title="Vehicle Intelligence"
      description="Truck/unit profile, MPG assumptions, reserve defaults, equipment costs, and operator profitability targets."
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SettingsMetric
          label="Truck"
          value={vehicleLabel}
          detail={truckProfile?.engine ?? "Engine profile pending"}
          tone="blue"
        />
        <SettingsMetric
          label="Default MPG"
          value={truckProfile?.default_mpg ? String(truckProfile.default_mpg) : "Not set"}
          detail="Used by load profitability math"
        />
        <SettingsMetric
          label="Operator Type"
          value={profile?.operation_type ?? "Not set"}
          detail={profile?.company_name || profile?.profile_name || "Profile pending"}
        />
      </section>

      <SettingsPanel
        title="Vehicle & Operating Assumptions"
        description="This is the existing operational profile form split into the Vehicle Intelligence station, so historical load, expense, and receipt records are not rewritten."
      >
        <OperationalProfileForm />
      </SettingsPanel>
    </SettingsPageShell>
  );
}
