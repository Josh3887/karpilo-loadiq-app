"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { type ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  createPayTemplate,
  defaultOperationalProfile,
  deriveIncomeTargets,
  getOperationalProfile,
  OperationalProfile,
  PayTemplate,
  buildOperationalEquipmentProfile,
  saveOperationalProfile,
} from "@/services/operational-profile";
import { usePreviewMode } from "@/components/preview/preview-mode-provider";
import { ThemedSelect } from "@/components/ui/themed-select";
import { LearnMore } from "@/components/ui/learn-more";
import { EDUCATION_TOPICS } from "@/config/education";
import {
  COMBINATION_TYPE_OPTIONS,
  TRANSPORT_EQUIPMENT_OPTIONS,
  formatEquipmentDimensions,
} from "@/lib/equipment-profile";
import { PayStructure } from "@/types/load";
import { saveOnboardingState } from "@/services/onboarding";
import { formatCurrency } from "@/utils/format";

const defaultPayForm = {
  name: "88% gross",
  type: "percentage" as PayStructure["type"],
  primaryPercent: 88,
  nestedPercent: 100,
  cpmRate: 0,
  flatAmount: 0,
  dailyRate: 0,
  payCalculationBasis: "gross" as PayStructure["payCalculationBasis"],
  payPeriodMode: "by_load" as PayStructure["payPeriodMode"],
  isDefault: true,
};

export function OperationalProfileForm() {
  const preview = usePreviewMode();
  const router = useRouter();
  const [profile, setProfile] = useState<OperationalProfile>(
    defaultOperationalProfile
  );
  const [payTemplates, setPayTemplates] = useState<PayTemplate[]>([]);
  const [payForm, setPayForm] = useState(defaultPayForm);
  const [status, setStatus] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const loadProfile = useCallback(async () => {
    if (preview.enabled) {
      setProfile(defaultOperationalProfile);
      setPayTemplates([
        {
          id: "preview-template",
          name: "Preview percentage pay",
          structure: {
            type: "percentage",
            label: "Preview percentage pay",
            percentageChain: [100, 88],
            cpmRate: 0,
            flatAmount: 0,
            dailyRate: 0,
            includeFuelSurcharge: true,
            includeAccessorials: true,
            payCalculationBasis: "gross",
            payPeriodMode: "by_load",
          },
          is_default: true,
        },
      ]);
      return;
    }

    try {
      const data = await getOperationalProfile();
      setProfile(data.profile);
      setPayTemplates(data.payTemplates);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to load operational profile."
      );
    }
  }, [preview.enabled]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSaveProfile() {
    if (preview.enabled) {
      preview.explain("vehicle-profile");
      return;
    }

    try {
      setStatus("Saving profile...");
      await saveOperationalProfile(profile);
      await saveOnboardingState({
        currentStep: "pay",
        completedSteps: ["profile", "targets", "costs"],
        isComplete: false,
      });
      setProfileSaved(true);
      setStatus("Operational profile saved. You can review or finish setup.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to save operational profile."
      );
    }
  }

  async function handleCreatePayTemplate() {
    if (preview.enabled) {
      preview.explain("pay-template");
      return;
    }

    try {
      setStatus("Saving pay template...");
      const structure: PayStructure = {
        type: payForm.type,
        label: payForm.name,
        percentageChain:
          payForm.type === "percentage"
            ? [payForm.nestedPercent, payForm.primaryPercent]
            : [100],
        cpmRate: payForm.cpmRate,
        flatAmount: payForm.flatAmount,
        dailyRate: payForm.dailyRate,
        includeFuelSurcharge: payForm.type === "percentage",
        includeAccessorials: payForm.type === "percentage",
        payCalculationBasis: payForm.payCalculationBasis,
        payPeriodMode: payForm.payPeriodMode,
      };

      await createPayTemplate(payForm.name, structure, payForm.isDefault);
      await loadProfile();
      setStatus("Pay template saved.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save pay template."
      );
    }
  }

  const targets = deriveIncomeTargets(
    profile.incomeTargetAmount,
    profile.incomeTargetPeriod
  );
  const equipmentProfile = buildOperationalEquipmentProfile(profile);

  return (
    <div className="space-y-8">
      <ProfileSection
        title="Driver Profile"
        description="Core LoadIQ operating-profile identity used by settings, Fit Check review, calculator defaults, and saved-load context."
        defaultOpen
      >
        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Profile Name"
            value={profile.profileName}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, profileName: value }))
            }
          />

          <InputField
            label="Company Name"
            value={profile.companyName}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, companyName: value }))
            }
          />

          <SelectField
            label="Operation Type"
            value={profile.operationType}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                operationType: value as OperationalProfile["operationType"],
              }))
            }
            options={[
              ["local", "Local"],
              ["regional", "Regional"],
              ["dedicated", "Dedicated"],
              ["otr", "OTR"],
            ]}
          />
        </div>
      </ProfileSection>

      <ProfileSection
        title="Target Profitability"
        description="Baseline targets used to compare load results against the operating profile. This reorganizes inputs only; target math is unchanged."
        defaultOpen
      >
        <div className="grid gap-4 md:grid-cols-3">
          <LearnMore {...EDUCATION_TOPICS.trueRpm} />
          <LearnMore {...EDUCATION_TOPICS.breakEvenRpm} />
          <LearnMore {...EDUCATION_TOPICS.targetMargins} />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Income Target"
            type="number"
            value={String(profile.incomeTargetAmount)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                incomeTargetAmount: Number(value),
              }))
            }
          />

          <SelectField
            label="Target Period"
            value={profile.incomeTargetPeriod}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                incomeTargetPeriod:
                  value as OperationalProfile["incomeTargetPeriod"],
              }))
            }
            options={[
              ["yearly", "Yearly"],
              ["monthly", "Monthly"],
              ["weekly", "Weekly"],
            ]}
          />

          <InputField
            label="Minimum True RPM"
            type="number"
            value={String(profile.minimumTrueRpm)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                minimumTrueRpm: Number(value),
              }))
            }
          />

          <InputField
            label="Minimum Hourly Profit"
            type="number"
            value={String(profile.minimumHourlyProfitability)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                minimumHourlyProfitability: Number(value),
              }))
            }
          />

          <InputField
            label="Operating Days / Week"
            type="number"
            value={String(profile.operatingDaysPerWeek)}
            onChange={(value) =>
              setProfile((prev) => {
                const operatingDaysPerWeek = Number(value);
                return {
                  ...prev,
                  operatingDaysPerWeek,
                  operatingDaysPerMonth: Number(
                    (operatingDaysPerWeek * 4.33).toFixed(2)
                  ),
                };
              })
            }
          />

          <InputField
            label="Operating Days / Month"
            type="number"
            value={String(profile.operatingDaysPerMonth)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                operatingDaysPerMonth: Number(value),
              }))
            }
          />

          <InputField
            label="Target Profit Margin %"
            type="number"
            value={String(profile.targetProfitMargin)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                targetProfitMargin: Number(value),
              }))
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Yearly" value={formatCurrency(targets.yearly)} />
          <SummaryCard label="Monthly" value={formatCurrency(targets.monthly)} />
          <SummaryCard label="Weekly" value={formatCurrency(targets.weekly)} />
          <SummaryCard label="Daily" value={formatCurrency(targets.daily)} />
        </div>
      </ProfileSection>

      <ProfileSection
        title="Vehicle Intelligence Inputs"
        description="Truck, trailer, fuel, and equipment assumptions stay in the operating profile instead of becoming a separate vehicle model."
        defaultOpen
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <FieldGroup
            title="Tractor / Truck"
            description="Core tractor identity and mileage defaults."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Make"
            value={profile.truckMake}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckMake: value }))
            }
          />
          <InputField
            label="Model"
            value={profile.truckModel}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckModel: value }))
            }
          />
          <InputField
            label="Year"
            type="number"
            value={String(profile.truckYear)}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckYear: Number(value) }))
            }
          />
          <InputField
            label="Engine"
            value={profile.truckEngine}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, truckEngine: value }))
            }
          />
          <InputField
            label="Default MPG"
            type="number"
            value={String(profile.defaultMpg)}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, defaultMpg: Number(value) }))
            }
          />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Equipment And Fuel"
            description="Combination, trailer equipment type, APU/reefer context, and fuel-tank assumptions."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Equipment Type"
            value={profile.equipmentType}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                equipmentType: value,
                trailerType: prev.trailerType || value,
              }))
            }
            options={TRANSPORT_EQUIPMENT_OPTIONS.map((option) => [
              option,
              option,
            ])}
          />
          <SelectField
            label="Combination Type"
            value={profile.combinationType}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, combinationType: value }))
            }
            options={COMBINATION_TYPE_OPTIONS.map((option) => [
              option,
              option,
            ])}
          />
          <InputField
            label="Fuel Tanks"
            type="number"
            value={String(profile.fuelTankCount)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                fuelTankCount: Number(value),
              }))
            }
          />
          <InputField
            label="Tank Size (gal each)"
            type="number"
            value={String(profile.fuelTankCapacityGallons)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                fuelTankCapacityGallons: Number(value),
              }))
            }
          />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Trailer"
            description="Trailer dimensions, division, and type used for operating-profile review."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Trailer Length (ft)"
            type="number"
            value={String(profile.trailerLengthFeet)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                trailerLengthFeet: Number(value),
              }))
            }
          />
          <InputField
            label="Trailer Width (in)"
            type="number"
            value={String(profile.trailerWidthInches)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                trailerWidthInches: Number(value),
              }))
            }
          />
          <InputField
            label="Trailer Height (in)"
            type="number"
            value={String(profile.trailerHeightInches)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                trailerHeightInches: Number(value),
              }))
            }
          />
          <InputField
            label="Trailer Division"
            value={profile.trailerDivisionType}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                trailerDivisionType: value,
              }))
            }
          />
          <InputField
            label="Trailer Type"
            value={profile.trailerType}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, trailerType: value }))
            }
          />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Weight And Capability"
            description="Operational weight and capability notes. These are modeling inputs, not compliance certifications."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Tare Weight (lbs)"
            type="number"
            value={String(profile.vehicleTareWeightLbs)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                vehicleTareWeightLbs: Number(value),
              }))
            }
          />
          <InputField
            label="Est. Max Gross (lbs)"
            type="number"
            value={String(profile.estimatedMaxGrossLbs)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                estimatedMaxGrossLbs: Number(value),
              }))
            }
          />
          <InputField
            label="Max Payload (lbs)"
            type="number"
            value={String(profile.maxPayloadLbs)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                maxPayloadLbs: Number(value),
              }))
            }
          />
          <InputField
            label="GVWR / Max Gross (lbs)"
            type="number"
            value={String(profile.grossVehicleWeightRatingLbs)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                grossVehicleWeightRatingLbs: Number(value),
              }))
            }
          />
          <InputField
            label="Axle Count"
            type="number"
            value={String(profile.axleCount)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                axleCount: Number(value),
              }))
            }
          />
          <InputField
            label="Operational Class"
            value={profile.operationalClassification}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                operationalClassification: value,
              }))
            }
          />
          <BooleanField
            label="Hazmat Capable"
            checked={profile.hazmatCapable}
            onChange={(checked) =>
              setProfile((prev) => ({ ...prev, hazmatCapable: checked }))
            }
          />
          <BooleanField
            label="Tanker Capable"
            checked={profile.tankerCapable}
            onChange={(checked) =>
              setProfile((prev) => ({ ...prev, tankerCapable: checked }))
            }
          />
          <BooleanField
            label="Refrigerated Capable"
            checked={profile.refrigeratedCapable}
            onChange={(checked) =>
              setProfile((prev) => ({
                ...prev,
                refrigeratedCapable: checked,
              }))
            }
          />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Operating Notes"
            description="Specialized equipment, securement, and route notes used for profile review only."
            wide
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Specialized Capabilities"
            value={profile.specializedCapabilities}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                specializedCapabilities: value,
              }))
            }
          />
          <InputField
            label="Securement Equipment"
            value={profile.securementEquipment}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, securementEquipment: value }))
            }
          />
          <InputField
            label="Route Restriction Notes"
            value={profile.routeRestrictionNotes}
            onChange={(value) =>
              setProfile((prev) => ({ ...prev, routeRestrictionNotes: value }))
            }
          />
            </div>
          </FieldGroup>
        </div>
        <p className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-xs leading-5 text-slate-500">
          Atlas equipment pack: {equipmentProfile.atlasEquipmentPack}. Dimensions:{" "}
          {formatEquipmentDimensions(equipmentProfile)}. Weight, dimension, and
          classification fields support operational modeling only. They are not
          certified scale, permit, route legality, or compliance data.
        </p>
      </ProfileSection>

      <ProfileSection
        title="Expense Intelligence Defaults"
        description="Default reserves, service deductions, and variable costs stay connected to the operating profile. Calculation semantics are unchanged."
        defaultOpen
      >
        <div className="grid gap-5 xl:grid-cols-2">
          <FieldGroup
            title="Reserves And Variable Costs"
            description="General reserves, maintenance, tires, and variable CPM pressure."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="General Reserve Allocation"
            type="number"
            value={String(profile.defaultReserveAllocation)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultReserveAllocation: Number(value),
              }))
            }
          />
          <InputField
            label="Maintenance Reserve"
            type="number"
            value={String(profile.defaultMaintenanceReserve)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultMaintenanceReserve: Number(value),
              }))
            }
          />
          <InputField
            label="Tire Reserve"
            type="number"
            value={String(profile.defaultTireReserve)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultTireReserve: Number(value),
              }))
            }
          />
          <InputField
            label="Variable CPM"
            type="number"
            value={String(profile.defaultVariableCostPerMile)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultVariableCostPerMile: Number(value),
              }))
            }
          />
            </div>
          </FieldGroup>

          <FieldGroup
            title="Trailer, Insurance, And Admin"
            description="Trailer fees, insurance allocation, dispatch, and factoring assumptions."
          >
            <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Trailer Fee"
            type="number"
            value={String(profile.defaultTrailerFee)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultTrailerFee: Number(value),
              }))
            }
          />
          <InputField
            label="Insurance Allocation"
            type="number"
            value={String(profile.defaultInsuranceAllocation)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultInsuranceAllocation: Number(value),
              }))
            }
          />
          <InputField
            label="Dispatch %"
            type="number"
            value={String(profile.defaultDispatchPercent)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultDispatchPercent: Number(value),
              }))
            }
          />
          <InputField
            label="Factoring %"
            type="number"
            value={String(profile.defaultFactoringPercent)}
            onChange={(value) =>
              setProfile((prev) => ({
                ...prev,
                defaultFactoringPercent: Number(value),
              }))
            }
          />
            </div>
          </FieldGroup>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            data-preview-explain="vehicle-profile"
            onClick={handleSaveProfile}
            className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
          >
            Save Profile
          </button>

          {profileSaved && (
            <Link
              href="/dashboard/onboarding"
              className="flex items-center justify-center rounded-xl bg-sky-400 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-[#060B14] transition hover:bg-sky-300"
            >
              Review Setup
            </Link>
          )}
        </div>
      </ProfileSection>

      <ProfileSection
        title="Pay Templates"
        description="Driver-pay templates remain profile-linked defaults. This branch keeps pay behavior unchanged."
      >
        <LearnMore {...EDUCATION_TOPICS.payStructures} />

        <div className="grid gap-5 md:grid-cols-3">
          <InputField
            label="Template Name"
            previewExplanation="pay-template"
            value={payForm.name}
            onChange={(value) =>
              setPayForm((prev) => ({ ...prev, name: value }))
            }
          />
          <SelectField
            label="Pay Type"
            value={payForm.type}
            onChange={(value) =>
              setPayForm((prev) => ({
                ...prev,
                type: value as PayStructure["type"],
              }))
            }
            options={[
              ["percentage", "Percentage"],
              ["flat", "Flat Rate"],
              ["cpm", "CPM"],
            ]}
          />
          {payForm.type === "percentage" && (
            <>
              <InputField
                label="Primary %"
                type="number"
                previewExplanation="pay-template"
                value={String(payForm.primaryPercent)}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    primaryPercent: Number(value),
                  }))
                }
              />
              <InputField
                label="Nested %"
                type="number"
                previewExplanation="pay-template"
                value={String(payForm.nestedPercent)}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    nestedPercent: Number(value),
                  }))
                }
              />
              <SelectField
                label="Driver Percentage Basis"
                value={payForm.payCalculationBasis}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    payCalculationBasis:
                      value as PayStructure["payCalculationBasis"],
                  }))
                }
                options={[
                  ["gross", "Gross Revenue"],
                  ["gross_minus_fsc", "Gross Revenue Minus Fuel Surcharge"],
                ]}
              />
              <SelectField
                label="Pay Period"
                value={payForm.payPeriodMode}
                onChange={(value) =>
                  setPayForm((prev) => ({
                    ...prev,
                    payPeriodMode: value as PayStructure["payPeriodMode"],
                  }))
                }
                options={[
                  ["by_load", "By Load"],
                  ["weekly", "Weekly"],
                ]}
              />
            </>
          )}
          {payForm.type === "flat" && (
            <InputField
              label="Flat Amount"
              type="number"
              previewExplanation="pay-template"
              value={String(payForm.flatAmount)}
              onChange={(value) =>
                setPayForm((prev) => ({
                  ...prev,
                  flatAmount: Number(value),
                }))
              }
            />
          )}
          {payForm.type === "cpm" && (
            <InputField
              label="CPM"
              type="number"
              previewExplanation="pay-template"
              value={String(payForm.cpmRate)}
              onChange={(value) =>
                setPayForm((prev) => ({ ...prev, cpmRate: Number(value) }))
              }
            />
          )}
        </div>

        {payForm.type === "percentage" && (
          <div className="space-y-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4 text-xs leading-6 text-sky-100">
            <p>
              Use Gross Minus Fuel Surcharge when the driver percentage is paid
              after FSC is excluded from the pay base.
            </p>
            <p>
              Weekly pay mode allows loads, dispatch days, and deadhead days to
              be grouped into a pay period.
            </p>
            {payForm.payCalculationBasis === "gross_minus_fsc" && (
              <p className="font-semibold text-sky-200">
                Fuel surcharge revenue is excluded from the driver percentage
                calculation base.
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          data-preview-explain="pay-template"
          onClick={() =>
            setPayForm((prev) => ({
              ...prev,
              name: "Karpilo LoadIQ FSC Protected Percentage",
              type: "percentage",
              primaryPercent: prev.primaryPercent || 88,
              nestedPercent: prev.nestedPercent || 100,
              payCalculationBasis: "gross_minus_fsc",
              payPeriodMode: "weekly",
            }))
          }
          className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-emerald-200 transition hover:bg-emerald-400/20"
        >
          Use FSC Protected Percentage Preset
        </button>

        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-[#060B14] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
          <input
            type="checkbox"
            data-preview-explain="pay-template"
            checked={payForm.isDefault}
            onChange={(event) =>
              setPayForm((prev) => ({
                ...prev,
                isDefault: event.target.checked,
              }))
            }
            className="h-4 w-4 accent-sky-400"
          />
          Set As Default
        </label>

        <button
          type="button"
          data-preview-explain="pay-template"
          onClick={handleCreatePayTemplate}
          className="rounded-xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-sky-300 transition hover:bg-sky-400/20"
        >
          Save Pay Template
        </button>

        <div className="space-y-3">
          {payTemplates.map((template) => (
            <div
              key={template.id}
              data-preview-explain="pay-template"
              className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
            >
              <div className="font-semibold text-slate-100">
                {template.name}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {template.structure.type}{" "}
                {template.structure.type === "percentage"
                  ? `• ${formatPayBasis(template.structure.payCalculationBasis)} • ${formatPayPeriod(template.structure.payPeriodMode)}`
                  : ""}
                {template.is_default ? "• default" : ""}
              </div>
            </div>
          ))}
        </div>
      </ProfileSection>

      {status && <p className="text-sm text-slate-400">{status}</p>}
    </div>
  );
}

function formatPayBasis(basis: PayStructure["payCalculationBasis"]) {
  if (basis === "gross_minus_fsc") return "Gross minus FSC";
  return "Gross";
}

function formatPayPeriod(mode: PayStructure["payPeriodMode"]) {
  if (mode === "weekly") return "Weekly";
  return "By load";
}

function ProfileSection({
  title,
  description,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      className="group rounded-2xl border border-slate-800 bg-[#0B1220]/70 p-4 open:space-y-5"
    >
      <summary className="cursor-pointer list-none rounded-xl border border-slate-800 bg-[#060B14] p-4">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="break-words text-sm font-black uppercase tracking-[0.18em] text-sky-300">
              {title}
            </div>
            <p className="mt-2 break-words text-xs leading-5 text-slate-400">
              {description}
            </p>
          </div>
          <span className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-slate-500 group-open:hidden">
            Open
          </span>
          <span className="hidden shrink-0 text-xs font-black uppercase tracking-[0.16em] text-slate-500 group-open:inline">
            Close
          </span>
        </div>
      </summary>
      <div className="space-y-5 pt-5">{children}</div>
    </details>
  );
}

function FieldGroup({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-800 bg-[#060B14] p-4 ${wide ? "xl:col-span-2" : ""}`}
    >
      <div className="mb-4">
        <h3 className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      data-preview-explain="vehicle-profile"
      className="rounded-xl border border-sky-400/20 bg-sky-400/5 p-4"
    >
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
        {label}
      </div>
      <div className="mt-2 text-xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function InputField({
  label,
  value,
  type = "text",
  onChange,
  previewExplanation = "vehicle-profile",
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
  previewExplanation?: "vehicle-profile" | "pay-template";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        data-preview-explain={previewExplanation}
        type={type}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-slate-800 bg-[#060B14] px-4 text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <ThemedSelect
      label={label}
      value={value}
      previewExplanation={
        label.toLowerCase().includes("pay") ? "pay-template" : "vehicle-profile"
      }
      onChange={onChange}
      options={options.map(([optionValue, optionLabel]) => ({
        value: optionValue,
        label: optionLabel,
      }))}
    />
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-800 bg-[#060B14] px-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-300">
      <input
        type="checkbox"
        data-preview-explain="vehicle-profile"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-sky-400"
      />
      {label}
    </label>
  );
}
