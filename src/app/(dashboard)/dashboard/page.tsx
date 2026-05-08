import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase-server";

import DashboardClientPage from "./page.client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return <DashboardClientPage />;
}