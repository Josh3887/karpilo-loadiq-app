import "server-only";

import type { User } from "@supabase/supabase-js";

import { isOwnerBuildAccessEmail } from "@/domains/billing/owner-access";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export const ADMIN_ROLES = ["support", "admin", "developer", "owner"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminRoleRecord = {
  id: string;
  user_id: string;
  role: AdminRole;
  scope: "global" | "app" | "website";
  status: "active" | "revoked" | "suspended" | "expired";
  expires_at: string | null;
};

export type AdminAccess = {
  user: User;
  roles: AdminRoleRecord[];
  highestRole: AdminRole;
};

const roleWeight: Record<AdminRole, number> = {
  support: 10,
  admin: 20,
  developer: 30,
  owner: 40,
};

function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

function highestRoleFor(roles: AdminRoleRecord[]) {
  return roles.reduce<AdminRole | null>((highest, role) => {
    if (!highest || roleWeight[role.role] > roleWeight[highest]) {
      return role.role;
    }

    return highest;
  }, null);
}

export function roleAllows(role: AdminRole, allowedRoles: readonly AdminRole[]) {
  return allowedRoles.includes(role);
}

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getAdminAccessForUser(user: User) {
  if (isOwnerBuildAccessEmail(user.email)) {
    const ownerRole = {
      id: `owner-env:${user.id}`,
      user_id: user.id,
      role: "owner",
      scope: "global",
      status: "active",
      expires_at: null,
    } satisfies AdminRoleRecord;

    return {
      user,
      roles: [ownerRole],
      highestRole: "owner",
    } satisfies AdminAccess;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id,user_id,role,scope,status,expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("scope", ["global", "app"]);

  if (error) {
    throw new Error(`ADMIN_ROLE_LOOKUP_FAILED: ${error.message}`);
  }

  const now = Date.now();
  const roles = (data ?? []).filter((row): row is AdminRoleRecord => {
    const expiresAt =
      typeof row.expires_at === "string" ? Date.parse(row.expires_at) : null;

    return (
      typeof row.role === "string" &&
      isAdminRole(row.role) &&
      (!expiresAt || expiresAt > now)
    );
  });
  const highestRole = highestRoleFor(roles);

  if (!highestRole) return null;

  return {
    user,
    roles,
    highestRole,
  } satisfies AdminAccess;
}

export async function requireAdminAccess(allowedRoles: readonly AdminRole[]) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      ok: false as const,
      status: 401,
      error: "Unauthorized.",
      user: null,
      access: null,
    };
  }

  const access = await getAdminAccessForUser(user);

  if (!access || !roleAllows(access.highestRole, allowedRoles)) {
    return {
      ok: false as const,
      status: 403,
      error: "Forbidden.",
      user,
      access,
    };
  }

  return {
    ok: true as const,
    status: 200,
    error: null,
    user,
    access,
  };
}
