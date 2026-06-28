"use client";

import { useState } from "react";

import {
  PLAN_KEYS,
  type PlanKey,
  type AccessStatus,
  type LaunchPhase,
} from "@/lib/portal/access";
import type {
  LegalAcceptanceRow,
  PortalAccessRow,
  PortalProfile,
} from "@/lib/portal/server";
import { createClient } from "@/lib/supabase-client";

const operatorTypes = [
  "owner_operator",
  "leased_owner_operator",
  "small_fleet",
  "company_driver",
  "dispatcher",
  "other",
] as const;

export function SettingsForm({
  profile,
  access,
  latestLegalAcceptance,
}: {
  profile: PortalProfile | null;
  access: PortalAccessRow | null;
  latestLegalAcceptance: LegalAcceptanceRow | null;
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [companyName, setCompanyName] = useState(profile?.company_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [operatorType, setOperatorType] = useState(
    profile?.operator_type ?? "owner_operator"
  );
  const [planInterest, setPlanInterest] = useState<PlanKey>(
    profile?.plan_interest ?? access?.plan_interest ?? "silver"
  );
  const [legalAcknowledged, setLegalAcknowledged] = useState(
    Boolean(profile?.legal_acknowledged_at || latestLegalAcceptance)
  );
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Sign in is required before saving portal settings.");
        return;
      }

      const now = new Date().toISOString();
      const acknowledgedAt = legalAcknowledged
        ? profile?.legal_acknowledged_at ?? latestLegalAcceptance?.accepted_at ?? now
        : null;

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email,
          full_name: fullName.trim() || null,
          company_name: companyName.trim() || null,
          phone: phone.trim() || null,
          operator_type: operatorType,
          plan_interest: planInterest,
          legal_acknowledged_at: acknowledgedAt,
          updated_at: now,
        },
        { onConflict: "id" }
      );

      if (profileError) throw new Error(profileError.message);

      const { error: accessError } = await supabase.from("portal_access").upsert(
        {
          user_id: user.id,
          status: (access?.status ?? "pending") satisfies AccessStatus,
          launch_phase: (access?.launch_phase ?? "beta") satisfies LaunchPhase,
          plan_interest: planInterest,
          updated_at: now,
        },
        { onConflict: "user_id" }
      );

      if (accessError) throw new Error(accessError.message);

      if (legalAcknowledged && !latestLegalAcceptance) {
        const { error: legalError } = await supabase
          .from("legal_acceptances")
          .insert({
            user_id: user.id,
            document_key: "controlled_app_portal",
            version: "2026-06-21",
            accepted_at: now,
          });

        if (legalError) throw new Error(legalError.message);
      }

      setStatus("Portal settings saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save portal settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-[#0B1220] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-300">
        Primitive User Settings
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Full name" value={fullName} onChange={setFullName} />
        <Field label="Company name" value={companyName} onChange={setCompanyName} />
        <Field label="Phone" value={phone} onChange={setPhone} />
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Operator type
          </span>
          <select
            value={operatorType}
            onChange={(event) => setOperatorType(event.target.value)}
            className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-[#060B14] px-3 text-slate-100 outline-none focus:border-sky-400"
          >
            {operatorTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Plan interest
          </span>
          <select
            value={planInterest}
            onChange={(event) => setPlanInterest(event.target.value as PlanKey)}
            className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-[#060B14] px-3 text-slate-100 outline-none focus:border-sky-400"
          >
            {PLAN_KEYS.map((plan) => (
              <option key={plan} value={plan}>
                {plan}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
        <input
          type="checkbox"
          checked={legalAcknowledged}
          onChange={(event) => setLegalAcknowledged(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span className="text-sm leading-6 text-slate-300">
          I acknowledge that Karpilo LoadIQ is controlled-access software and is
          not a dispatch service, broker, ELD, tax advisor, legal advisor,
          compliance authority, insurance advisor, or guaranteed-profit system.
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-lg bg-sky-400 px-5 py-3 text-sm font-black uppercase tracking-[0.16em] text-[#060B14] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {status ? <p className="mt-4 text-sm font-bold text-emerald-300">{status}</p> : null}
      {error ? <p className="mt-4 text-sm font-bold text-red-300">{error}</p> : null}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-[#060B14] px-3 text-slate-100 outline-none focus:border-sky-400"
      />
    </label>
  );
}
