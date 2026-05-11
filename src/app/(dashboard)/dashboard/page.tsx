import { redirect } from "next/navigation";

import { LOADIQ_DISCLAIMER_VERSION } from "@/config/legal";
import { createClient } from "@/lib/supabase-server";

import DashboardClientPage from "./page.client";

type DashboardPageProps = {
  searchParams: Promise<{
    edit?: string;
    template?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { edit, template } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("disclaimer_accepted_at, disclaimer_version")
    .eq("id", user.id)
    .maybeSingle();

  const requiresDisclaimer =
    !profile?.disclaimer_accepted_at ||
    profile.disclaimer_version !== LOADIQ_DISCLAIMER_VERSION;

  return (
    <DashboardClientPage
      editLoadId={edit}
      templateId={template}
      requiresDisclaimer={requiresDisclaimer}
    />
  );
}
