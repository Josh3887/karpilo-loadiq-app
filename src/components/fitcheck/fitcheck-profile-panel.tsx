"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import {
  getLoadIqProfileSnapshot,
  type LoadIqProfileSnapshot,
} from "@/services/fitcheck-profile";
import { formatCurrency } from "@/lib/fitcheck";

export function FitCheckProfilePanel() {
  const [profile, setProfile] = useState<LoadIqProfileSnapshot | null>(null);
  const [status, setStatus] = useState("Loading saved FitCheck settings...");

  useEffect(() => {
    let ignore = false;

    getLoadIqProfileSnapshot()
      .then((snapshot) => {
        if (!ignore) {
          setProfile(snapshot);
          setStatus("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Unable to load saved FitCheck settings."
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  if (status) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5 text-sm text-slate-300">
        {status}
      </div>
    );
  }

  if (!profile || Object.keys(profile).length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
        <h2 className="text-2xl font-black text-slate-100">
          No FitCheck profile saved yet.
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Run FitCheck and choose which reusable answers should be saved to the
          Settings operating profile.
        </p>
        <Link
          href="/dashboard/intake/fitcheck"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-100"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Run FitCheck
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/intake/fitcheck"
          className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-sky-100"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Re-run FitCheck
        </Link>
      </div>

      <ProfileSection
        title="FitCheck Business Snapshot"
        rows={[
          ["Business type", profile.businessProfile?.businessType],
          ["Trucks", profile.businessProfile?.truckCount],
          ["Trailers", profile.businessProfile?.trailerCount],
          ["Equipment", profile.businessProfile?.equipmentType],
          ["Combination", profile.businessProfile?.combinationType],
          ["Trailer length", feet(profile.businessProfile?.trailerLengthFeet)],
          ["Trailer width", inches(profile.businessProfile?.trailerWidthInches)],
          ["Trailer height", inches(profile.businessProfile?.trailerHeightInches)],
          ["Max payload", lbs(profile.businessProfile?.maxPayloadLbs)],
          ["GVWR / max gross", lbs(profile.businessProfile?.grossVehicleWeightRatingLbs)],
          ["Axle count", profile.businessProfile?.axleCount],
          ["Hazmat capable", yesNo(profile.businessProfile?.hazmatCapable)],
          ["Tanker capable", yesNo(profile.businessProfile?.tankerCapable)],
          ["Refrigerated capable", yesNo(profile.businessProfile?.refrigeratedCapable)],
          ["Specialized capabilities", profile.businessProfile?.specializedCapabilities],
          ["Securement equipment", profile.businessProfile?.securementEquipment],
          ["Route restriction notes", profile.businessProfile?.routeRestrictionNotes],
          ["Authority age", profile.businessProfile?.authorityAge],
          ["Operating regions", profile.businessProfile?.operatingRegions],
          ["Preferred lanes", profile.businessProfile?.preferredLanes],
          ["Lanes to avoid", profile.businessProfile?.avoidedLanes],
          ["Endorsements", profile.businessProfile?.endorsements?.join(", ")],
          ["Home-time priority", profile.businessProfile?.homeTimePriority],
          ["Days willing to run", profile.businessProfile?.daysWillingToRun],
        ]}
      />

      <ProfileSection
        title="FitCheck Operator Goal Snapshot"
        rows={[
          ["Minimum operator income", currency(profile.operatorGoals?.minimumOperatorIncome)],
          ["Target operator income", currency(profile.operatorGoals?.targetOperatorIncome)],
          ["Ideal operator income", currency(profile.operatorGoals?.idealOperatorIncome)],
          ["Desired business cushion", currency(profile.operatorGoals?.desiredBusinessCushion)],
          ["Main business priority", profile.operatorGoals?.primaryBusinessPriority],
        ]}
      />

      <ProfileSection
        title="FitCheck Operating Assumption Snapshot"
        rows={[
          ["Fuel cost per mile", profile.operatingAssumptions?.fuelCostPerMile],
          ["Insurance monthly cost", currency(profile.operatingAssumptions?.monthlyInsurance)],
          ["Truck payment", currency(profile.operatingAssumptions?.truckPayment)],
          ["Trailer payment", currency(profile.operatingAssumptions?.trailerPayment)],
          ["Maintenance reserve", currency(profile.operatingAssumptions?.maintenanceReserve)],
          ["Factoring fee", profile.operatingAssumptions?.factoringFee],
          ["Dispatch fee", profile.operatingAssumptions?.dispatchFee],
          ["ELD/software", currency(profile.operatingAssumptions?.eldSoftware)],
          ["Other recurring overhead", currency(profile.operatingAssumptions?.otherRecurringOverhead)],
        ]}
      />

      <ProfileSection
        title="FitCheck Load Preference Snapshot"
        rows={[
          ["Load boards used", profile.loadPreferences?.loadBoardsUsed],
          ["Dispatcher use", profile.loadPreferences?.usesDispatcher],
          ["Broker relationship level", profile.loadPreferences?.brokerRelationshipLevel],
          ["Direct customers", profile.loadPreferences?.hasDirectCustomers],
          ["Preferred decision factor", profile.loadPreferences?.preferredDecisionFactor],
          ["Main pain points", profile.loadPreferences?.mainPainPoints?.join(", ")],
        ]}
      />

      <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
        <h2 className="text-2xl font-black text-slate-100">
          Saved FitCheck Results
        </h2>
        <div className="mt-4 grid gap-3">
          {(profile.savedFitCheckResults ?? []).length === 0 && (
            <p className="text-sm text-slate-400">
              No sensitive FitCheck result snapshots have been saved.
            </p>
          )}
          {(profile.savedFitCheckResults ?? []).map((result) => (
            <div
              key={result.createdAt}
              className="rounded-xl border border-slate-800 bg-[#060B14] p-4 text-sm text-slate-300"
            >
              <p className="font-black text-slate-100">
                {new Date(result.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-2">
                Recommended tier: {result.recommendedTierId} - Business health
                gap: {formatCurrency(result.businessHealthGap)}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function currency(value: number | undefined) {
  return typeof value === "number" ? formatCurrency(value) : undefined;
}

function feet(value: number | undefined) {
  return typeof value === "number" && value > 0 ? `${value} ft` : undefined;
}

function inches(value: number | undefined) {
  return typeof value === "number" && value > 0 ? `${value} in` : undefined;
}

function lbs(value: number | undefined) {
  return typeof value === "number" && value > 0
    ? `${value.toLocaleString()} lbs`
    : undefined;
}

function yesNo(value: boolean | undefined) {
  if (value === undefined) return undefined;
  return value ? "Yes" : "No";
}

function ProfileSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string | number | undefined]>;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#0B1220]/95 p-5">
      <h2 className="text-2xl font-black text-slate-100">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-800 bg-[#060B14] p-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {value === undefined || value === "" ? "Not saved" : String(value)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
