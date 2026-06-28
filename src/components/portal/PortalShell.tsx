import type { ReactNode } from "react";

import { AccessStatusBanner } from "@/components/portal/AccessStatusBanner";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import type { PortalState } from "@/lib/portal/server";

export function PortalShell({
  children,
  userEmail,
  state,
}: {
  children: ReactNode;
  userEmail?: string | null;
  state: PortalState;
}) {
  return (
    <div className="min-h-screen bg-[#060B14] text-slate-100">
      <PortalHeader userEmail={userEmail} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PortalSidebar />
        </aside>
        <main className="min-w-0 space-y-6">
          <AccessStatusBanner
            status={state.access?.status}
            launchPhase={state.access?.launch_phase}
            planInterest={state.profile?.plan_interest ?? state.access?.plan_interest}
          />
          {children}
        </main>
      </div>
    </div>
  );
}
