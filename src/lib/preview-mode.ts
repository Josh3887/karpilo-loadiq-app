import { cookies } from "next/headers";

export const LOADIQ_PREVIEW_COOKIE = "loadiq_preview_mode";

export async function isPreviewModeEnabled() {
  return (await cookies()).get(LOADIQ_PREVIEW_COOKIE)?.value === "1";
}

