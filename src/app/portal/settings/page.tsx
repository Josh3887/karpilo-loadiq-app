import { SettingsForm } from "@/components/settings/SettingsForm";
import { getAuthenticatedPortalContext } from "@/lib/portal/server";

export const metadata = {
  title: "Settings | Karpilo LoadIQ App",
  description: "Primitive Karpilo LoadIQ app portal settings.",
};

export default async function PortalSettingsPage() {
  const { state } = await getAuthenticatedPortalContext();

  return (
    <SettingsForm
      profile={state.profile}
      access={state.access}
      latestLegalAcceptance={state.latestLegalAcceptance}
    />
  );
}
