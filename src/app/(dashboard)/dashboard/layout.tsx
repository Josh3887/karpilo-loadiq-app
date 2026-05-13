import { redirect } from "next/navigation";

import { AppAccessGate } from "@/components/legal/app-access-gate";
import { SystemHealthBanner } from "@/components/system/system-health-banner";
import { getAppPolicyGateState } from "@/services/app-policy-server";
import { getActiveSystemHealthNotices } from "@/services/system-health";
import { createClient } from "@/lib/supabase-server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [gateState, healthNotices] = await Promise.all([
    getAppPolicyGateState(user.id),
    getActiveSystemHealthNotices(),
  ]);

  return (
    <>
      <AppAccessGate
        requiresPolicyAcceptance={gateState.requiresPolicyAcceptance}
        requiresSafetyReminder={gateState.requiresSafetyReminder}
      />
      <div
        className={
          gateState.requiresPolicyAcceptance || gateState.requiresSafetyReminder
            ? "pointer-events-none select-none blur-sm"
            : undefined
        }
        aria-hidden={
          gateState.requiresPolicyAcceptance || gateState.requiresSafetyReminder
        }
      >
        <div className="bg-[#060B14] px-4 pt-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SystemHealthBanner notices={healthNotices} />
          </div>
        </div>
        {children}
      </div>
    </>
  );
}
