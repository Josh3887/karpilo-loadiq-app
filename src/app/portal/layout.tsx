import { PortalShell } from "@/components/portal/PortalShell";
import { getAuthenticatedPortalContext } from "@/lib/portal/server";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, state } = await getAuthenticatedPortalContext();

  return (
    <PortalShell userEmail={user.email} state={state}>
      {children}
    </PortalShell>
  );
}
