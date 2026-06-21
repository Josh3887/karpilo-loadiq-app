import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const TRUSTED_APP_ORIGINS = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://app.karpilo-liq.com",
]);

function getTrustedRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedOrigin =
    forwardedProto && forwardedHost
      ? `${forwardedProto.split(",")[0]?.trim()}://${forwardedHost
          .split(",")[0]
          ?.trim()}`
      : null;
  const candidateOrigins = [
    request.nextUrl.origin,
    forwardedOrigin,
  ].filter((origin): origin is string => Boolean(origin));

  return (
    candidateOrigins.find((origin) => TRUSTED_APP_ORIGINS.has(origin)) ??
    "https://app.karpilo-liq.com"
  );
}

function getSafeRedirectPath(value: string | null) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  ) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(value, "https://app.karpilo-liq.com");

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/dashboard";
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = getTrustedRequestOrigin(request);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("SUPABASE_AUTH_CALLBACK_EXCHANGE_FAILED");
    return NextResponse.redirect(new URL("/auth/login", origin));
  }

  return NextResponse.redirect(new URL(next, origin));
}
