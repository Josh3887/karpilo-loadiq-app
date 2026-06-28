type AppUserIdentity = {
  id: string;
  email?: string | null;
};

type AppUserProfileFields = {
  disclaimer_accepted_at?: string | null;
  disclaimer_version?: string | null;
  disclaimer_last_updated?: string | null;
  updated_at?: string;
};

type SupabaseProfileClient = {
  from: (table: "users") => {
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: "id" }
    ) => PromiseLike<{ error: { message: string } | null }>;
  };
};

export async function ensureAppUserProfile(
  supabase: SupabaseProfileClient,
  user: AppUserIdentity,
  fields: AppUserProfileFields = {}
) {
  const profile: Record<string, unknown> = {
    id: user.id,
    updated_at: fields.updated_at ?? new Date().toISOString(),
  };

  if (user.email) {
    profile.email = user.email;
  }

  Object.assign(profile, fields);

  const { error } = await supabase.from("users").upsert(profile, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(error.message);
  }
}
