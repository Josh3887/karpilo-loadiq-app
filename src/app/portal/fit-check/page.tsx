import { FitCheckForm } from "@/components/fit-check/FitCheckForm";
import { getAuthenticatedPortalContext } from "@/lib/portal/server";

export const metadata = {
  title: "Fit Check | Karpilo LoadIQ App",
  description: "Primitive Karpilo LoadIQ app portal Fit Check intake.",
};

export default async function PortalFitCheckPage() {
  const { state } = await getAuthenticatedPortalContext();

  return <FitCheckForm latestFitCheck={state.latestFitCheck} />;
}
