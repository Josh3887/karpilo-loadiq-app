import { NextResponse } from "next/server";

import {
  ELEVATED_ADMIN_ROLES,
  getElevatedSessionStatus,
} from "@/lib/admin/elevated-auth";
import { requireAdminAccess } from "@/lib/admin/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await requireAdminAccess(ELEVATED_ADMIN_ROLES);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const status = await getElevatedSessionStatus(result.access);

  return NextResponse.json({
    elevated: status.elevated,
    expiresAt: status.expiresAt,
    reason: status.elevated ? undefined : status.reason,
  });
}
