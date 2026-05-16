import { NextResponse } from "next/server";

import { LOADIQ_PREVIEW_COOKIE } from "@/lib/preview-mode";

export function GET(request: Request) {
  const url = new URL("/auth/login", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.delete(LOADIQ_PREVIEW_COOKIE);

  return response;
}

