import { redirect } from "next/navigation";

import { OperationalProfileForm } from "@/components/dashboard/operational-profile-form";
import {
  SettingsMetric,
  SettingsPageShell,
  SettingsPanel,
} from "@/components/settings/settings-shell";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { createClient } from "@/lib/supabase-server";

export default async function VehicleSettingsPage() {
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
      <VehicleSettingsContent
        vehicleLabel="Preview truck"
        engineLabel="Engine profile preview"
        mpgLabel="6.5"
        operatorType="Preview only"
        operatorDetail="Preview profile"
      />
    );
  }

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
      .select(
        "make, model, year, engine, default_mpg, fuel_tank_count, fuel_tank_capacity_gallons, trailer_division_type, trailer_type, vehicle_tare_weight_lbs, estimated_max_gross_lbs, operational_classification"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const vehicleLabel =
    [truckProfile?.year, truckProfile?.make, truckProfile?.model]
      .filter(Boolean)
      .join(" ") || "Not set";

  return (
    <VehicleSettingsContent
      vehicleLabel={vehicleLabel}
      engineLabel={truckProfile?.engine ?? "Engine profile pending"}
      mpgLabel={
        truckProfile?.default_mpg ? String(truckProfile.default_mpg) : "Not set"
      }
      fuelCapacityDetail={
        truckProfile?.fuel_tank_count && truckProfile?.fuel_tank_capacity_gallons
          ? `${truckProfile.fuel_tank_count} x ${truckProfile.fuel_tank_capacity_gallons} gal`
          : "Tank setup pending"
      }
      operatorType={profile?.operation_type ?? "Not set"}
      operatorDetail={
        profile?.company_name || profile?.profile_name || "Profile pending"
      }
      equipmentDetail={
        [truckProfile?.trailer_division_type, truckProfile?.trailer_type]
          .filter(Boolean)
          .join(" / ") || "Trailer profile pending"
      }
      weightDetail={
        truckProfile?.vehicle_tare_weight_lbs ||
        truckProfile?.estimated_max_gross_lbs
          ? `${truckProfile?.vehicle_tare_weight_lbs ?? "Tare pending"} tare · ${
              truckProfile?.estimated_max_gross_lbs ?? "Gross pending"
            } max gross`
          : "Weight model pending"
      }
      classificationDetail={
        truckProfile?.operational_classification ?? "Classification pending"
      }
    />
  );
}

function VehicleSettingsContent({
  vehicleLabel,
  engineLabel,
  mpgLabel,
  fuelCapacityDetail,
  operatorType,
  operatorDetail,
  equipmentDetail,
  weightDetail,
  classificationDetail,
}: {
  vehicleLabel: string;
  engineLabel: string;
  mpgLabel: string;
  fuelCapacityDetail?: string;
  operatorType: string;
  operatorDetail: string;
  equipmentDetail?: string;
  weightDetail?: string;
  classificationDetail?: string;
}) {
  return (
    <SettingsPageShell
      title="Operating Profile & Vehicle Intelligence"
      description="The source-of-truth form for driver/operator targets, truck and equipment profile, fuel assumptions, pay templates, reserve defaults, and calculator defaults."
    >
      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <SettingsMetric
          label="Truck"
          value={vehicleLabel}
          detail={engineLabel}
          tone="blue"
        />
        <SettingsMetric
          label="Default MPG"
          value={mpgLabel}
          detail={fuelCapacityDetail ?? "Tank setup pending"}
        />
        <SettingsMetric
          label="Operator Type"
          value={operatorType}
          detail={operatorDetail}
        />
        <SettingsMetric
          label="Equipment"
          value={equipmentDetail ?? "Trailer profile pending"}
          detail={classificationDetail ?? "Classification pending"}
        />
        <SettingsMetric
          label="Weight Model"
          value={weightDetail ?? "Weight model pending"}
          detail="Operational estimate only"
        />
      </section>

      <SettingsPanel
        title="Operating Profile Form"
        description="This form writes the existing users, user_settings, truck_profiles, and pay template records used by FitCheck hydration, Expense Intelligence, Vehicle Intelligence, calculator defaults, and saved-load snapshots."
      >
        <OperationalProfileForm />
      </SettingsPanel>
    </SettingsPageShell>
  );
}
