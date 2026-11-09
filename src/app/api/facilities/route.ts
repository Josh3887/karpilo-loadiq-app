import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { facilitiesFromSavedLoads, facilitySchema, searchFacilities } from "@/services/facilities/directory";

const querySchema = z.string().trim().min(3).max(100);
const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ facilities: [] }, { status: 401, headers });
  }
  const body = await request.json().catch(() => null);
  const query = querySchema.safeParse(body?.query);
  if (!query.success) {
    return NextResponse.json({ facilities: [] }, { status: 400, headers });
  }

  // Reuse durable, user-owned saved loads while the AWS directory is pending.
  // Explicit owner filter complements existing RLS; never search other drivers' history.
  const { data, error } = await supabase.from("saved_loads")
    .select("id, input_snapshot")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(500);
  const saved = error ? [] : facilitiesFromSavedLoads(data ?? []);
  let directory: z.infer<typeof facilitySchema>[] = [];
  let directoryUnavailable = false;
  try {
    directory = z.array(facilitySchema).max(1000).parse(
      JSON.parse(process.env.LOADIQ_FACILITY_DIRECTORY_JSON ?? "[]")
    );
  } catch {
    directoryUnavailable = true;
  }
  const facilities = searchFacilities([...saved, ...directory], query.data);
  const warnings = [
    ...(error ? ["Saved address history is unavailable."] : []),
    ...(directoryUnavailable ? ["The configured facility directory is unavailable."] : []),
  ];
  return NextResponse.json({ facilities, warnings }, {
    status: error && !directory.length ? 503 : 200,
    headers,
  });
}
