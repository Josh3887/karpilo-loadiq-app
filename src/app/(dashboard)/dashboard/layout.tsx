import { redirect } from "next/navigation";

import { PaymentSetupModal } from "@/components/billing/payment-setup-modal";
import { AppAccessGate } from "@/components/legal/app-access-gate";
import { PreviewModeProvider } from "@/components/preview/preview-mode-provider";
import { SystemHealthBanner } from "@/components/system/system-health-banner";
import { BILLING_EMAIL } from "@/config/billing";
import { getServerPaymentAccess } from "@/domains/billing/server-entitlements";
import { isPreviewModeEnabled } from "@/lib/preview-mode";
import { getAppPolicyGateState } from "@/services/app-policy-server";
import { ensureAppUserProfile } from "@/services/app-user-profile";
import { getActiveSystemHealthNotices } from "@/services/system-health";
import { createClient } from "@/lib/supabase-server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const previewMode = await isPreviewModeEnabled();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (previewMode) {
    const healthNotices = user ? await getActiveSystemHealthNotices() : [];

    return (
      <PreviewModeProvider enabled>
        <div className="bg-[#060B14] px-4 pt-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SystemHealthBanner notices={healthNotices} />
          </div>
        </div>
        {children}
      </PreviewModeProvider>
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  await ensureAppUserProfile(supabase, user);

  const [gateState, healthNotices, paymentAccess] = await Promise.all([
    getAppPolicyGateState(user.id),
    getActiveSystemHealthNotices(),
    getServerPaymentAccess(user.id, user.email),
  ]);

  return (
    <PreviewModeProvider enabled={false}>
      <AppAccessGate
        requiresPolicyAcceptance={gateState.requiresPolicyAcceptance}
        requiresSafetyReminder={gateState.requiresSafetyReminder}
      />
      <PaymentSetupModal
        paymentAccess={paymentAccess}
        billingEmail={BILLING_EMAIL}
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
    </PreviewModeProvider>
  );
}
