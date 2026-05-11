import { createClient } from "@/lib/supabase-client";

export type UserSettingsPayload = {
  default_overhead: number;
  default_reserve_allocation: number;
  target_profit_margin: number;
  toll_handling_mode: string;
  lumper_handling_mode: string;
};

export async function saveUserSettings(
  payload: UserSettingsPayload
) {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated.");
  }

  const { error } = await supabase
    .from("user_settings")
    .upsert({
      user_id: user.id,
      ...payload,
    });

  if (error) {
    throw new Error(error.message);
  }
}