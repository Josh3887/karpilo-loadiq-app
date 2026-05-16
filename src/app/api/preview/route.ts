import { NextResponse } from "next/server";

import { LOADIQ_PREVIEW_COOKIE } from "@/lib/preview-mode";

export function GET(request: Request) {
  const url = new URL("/dashboard", request.url);
  const response = NextResponse.redirect(url);

  response.cookies.set(LOADIQ_PREVIEW_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

