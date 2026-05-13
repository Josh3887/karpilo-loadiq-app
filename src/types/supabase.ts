export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: never[];
};

export type Database = {
  public: {
    Tables: {
      operator_profiles: Table<
        {
          id: string;
          user_id: string;
          account_type:
            | "leased_owner_operator"
            | "independent_owner_operator"
            | "company_driver"
            | "fleet";
          operation_type: "local" | "regional" | "dedicated" | "otr";
          leased_owner_operator: boolean;
          independent_owner_operator: boolean;
          company_name: string | null;
          display_name: string | null;
          default_mpg: number | null;
          default_fuel_price: number | null;
          target_income: number | null;
          target_income_period: "yearly" | "monthly" | "weekly" | null;
          target_true_rpm: number | null;
          target_profit_margin: number | null;
          minimum_hourly_profitability: number | null;
          operating_days_per_week: number | null;
          operating_days_per_month: number | null;
          fixed_overhead_monthly: number;
          fixed_overhead_weekly: number;
          fixed_overhead_daily: number;
          dispatch_percentage: number;
          factoring_percentage: number;
          lease_percentage: number;
          maintenance_reserve_rate: number;
          settings_completed: boolean;
          onboarding_completed: boolean;
          profile_snapshot: Json;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          account_type?:
            | "leased_owner_operator"
            | "independent_owner_operator"
            | "company_driver"
            | "fleet";
          operation_type?: "local" | "regional" | "dedicated" | "otr";
          leased_owner_operator?: boolean;
          independent_owner_operator?: boolean;
          company_name?: string | null;
          display_name?: string | null;
          default_mpg?: number | null;
          default_fuel_price?: number | null;
          target_income?: number | null;
          target_income_period?: "yearly" | "monthly" | "weekly" | null;
          target_true_rpm?: number | null;
          target_profit_margin?: number | null;
          minimum_hourly_profitability?: number | null;
          operating_days_per_week?: number | null;
          operating_days_per_month?: number | null;
          fixed_overhead_monthly?: number;
          fixed_overhead_weekly?: number;
          fixed_overhead_daily?: number;
          dispatch_percentage?: number;
          factoring_percentage?: number;
          lease_percentage?: number;
          maintenance_reserve_rate?: number;
          settings_completed?: boolean;
          onboarding_completed?: boolean;
          profile_snapshot?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      saved_loads: Table<
        {
          id: string;
          user_id: string;
          status:
            | "calculated"
            | "saved"
            | "accepted"
            | "completed"
            | "archived"
            | "estimated";
          loadiq_load_number: string | null;
          driver_load_number: string | null;
          load_name: string | null;
          load_outcome: string;
          load_run_status: "ran" | "test" | "planned" | null;
          was_run_status: "ran" | "test" | "planned" | null;
          pickup_zip: string;
          pickup_city: string | null;
          pickup_state: string | null;
          delivery_zip: string;
          delivery_city: string | null;
          delivery_state: string | null;
          loaded_miles: number;
          deadhead_miles: number;
          total_miles: number;
          rate_per_mile: number;
          gross_revenue: number;
          fuel_cost: number;
          fuel_estimate_source: string | null;
          estimated_fuel_price: number | null;
          actual_fuel_price: number | null;
          fuel_override: boolean;
          eia_period: string | null;
          fuel_fetched_at: string | null;
          dispatch_days: number | null;
          daily_overhead: number | null;
          overhead_applied: number | null;
          operational_cost: number;
          estimated_net: number;
          actual_net: number | null;
          true_rpm: number;
          profitability_score: number;
          profitability_band: string;
          warnings: Json;
          used_profile_values: Json;
          used_temporary_overrides: Json;
          profile_snapshot: Json;
          calculation_snapshot: Json;
          input_snapshot: Json;
          result_snapshot: Json;
          actuals_snapshot: Json;
          pay_structure_snapshot: Json;
          accessorial_items_snapshot: Json;
          calculation_version: string;
          calculated_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          status?:
            | "calculated"
            | "saved"
            | "accepted"
            | "completed"
            | "archived"
            | "estimated";
          loadiq_load_number?: string | null;
          driver_load_number?: string | null;
          load_name?: string | null;
          load_outcome?: string;
          load_run_status?: "ran" | "test" | "planned" | null;
          was_run_status?: "ran" | "test" | "planned" | null;
          pickup_zip: string;
          pickup_city?: string | null;
          pickup_state?: string | null;
          delivery_zip: string;
          delivery_city?: string | null;
          delivery_state?: string | null;
          loaded_miles: number;
          deadhead_miles?: number;
          total_miles?: number;
          rate_per_mile?: number;
          gross_revenue?: number;
          fuel_cost?: number;
          fuel_estimate_source?: string | null;
          estimated_fuel_price?: number | null;
          actual_fuel_price?: number | null;
          fuel_override?: boolean;
          eia_period?: string | null;
          fuel_fetched_at?: string | null;
          dispatch_days?: number | null;
          daily_overhead?: number | null;
          overhead_applied?: number | null;
          operational_cost?: number;
          estimated_net?: number;
          actual_net?: number | null;
          true_rpm?: number;
          profitability_score?: number;
          profitability_band?: string;
          warnings?: Json;
          used_profile_values?: Json;
          used_temporary_overrides?: Json;
          profile_snapshot?: Json;
          calculation_snapshot?: Json;
          input_snapshot?: Json;
          result_snapshot?: Json;
          actuals_snapshot?: Json;
          pay_structure_snapshot?: Json;
          accessorial_items_snapshot?: Json;
          calculation_version?: string;
          calculated_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      operator_program_status: Table<
        {
          user_id: string;
          pilot_user: boolean;
          founding_operator: boolean;
          launch500_user: boolean;
          legacy_price_locked: boolean;
          subscription_grandfathered: boolean;
          program: "standard" | "pilot50" | "launch500";
          phase:
            | "prelaunch"
            | "pilot_active"
            | "official_launch"
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          assigned_by: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          user_id: string;
          pilot_user?: boolean;
          founding_operator?: boolean;
          launch500_user?: boolean;
          legacy_price_locked?: boolean;
          subscription_grandfathered?: boolean;
          program?: "standard" | "pilot50" | "launch500";
          phase?:
            | "prelaunch"
            | "pilot_active"
            | "official_launch"
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          assigned_by?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      operator_pricing_locks: Table<
        {
          id: string;
          user_id: string;
          program: "pilot50" | "launch500";
          tier: "pilot" | "launch500" | "founder";
          monthly_price: number;
          annual_price: number;
          billing_provider: "stripe" | "apple" | "google" | "manual";
          provider_price_id: string | null;
          provider_subscription_id: string | null;
          lifetime_lock: boolean;
          locked_at: string;
          metadata: Json;
        },
        {
          id?: string;
          user_id: string;
          program: "pilot50" | "launch500";
          tier: "pilot" | "launch500" | "founder";
          monthly_price: number;
          annual_price: number;
          billing_provider?: "stripe" | "apple" | "google" | "manual";
          provider_price_id?: string | null;
          provider_subscription_id?: string | null;
          lifetime_lock?: boolean;
          locked_at?: string;
          metadata?: Json;
        }
      >;
      app_policy_acceptances: Table<
        {
          id: string;
          user_id: string;
          policy_key: string;
          policy_version: string;
          email: string | null;
          app_version: string | null;
          platform: string;
          acceptance_source: string;
          accepted_at: string;
          metadata: Json;
          created_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          policy_key: string;
          policy_version: string;
          email?: string | null;
          app_version?: string | null;
          platform?: string;
          acceptance_source?: string;
          accepted_at?: string;
          metadata?: Json;
          created_at?: string | null;
        }
      >;
      driver_safety_acknowledgments: Table<
        {
          id: string;
          user_id: string;
          policy_version: string;
          acknowledged_at: string;
          source: string;
          metadata: Json;
          created_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          policy_version: string;
          acknowledged_at?: string;
          source?: string;
          metadata?: Json;
          created_at?: string | null;
        }
      >;
      reservation_codes: Table<
        {
          id: string;
          code: string;
          cohort: "pilot50" | "launch500";
          status: "available" | "reserved" | "redeemed" | "lapsed" | "revoked";
          user_id: string | null;
          email: string | null;
          seat_number: number | null;
          monthly_price: number;
          annual_price: number;
          billing_provider: "stripe" | "apple" | "google" | "manual" | null;
          expires_at: string | null;
        },
        {
          id?: string;
          code: string;
          cohort: "pilot50" | "launch500";
          status?: "available" | "reserved" | "redeemed" | "lapsed" | "revoked";
          user_id?: string | null;
          email?: string | null;
          seat_number?: number | null;
          monthly_price: number;
          annual_price: number;
          billing_provider?: "stripe" | "apple" | "google" | "manual" | null;
          expires_at?: string | null;
        }
      >;
      pricing_lock_status: Table<
        {
          id: string;
          user_id: string;
          cohort: "pilot50" | "launch500";
          lock_status: "active" | "past_due" | "lapsed" | "revoked";
          billing_provider: "stripe" | "apple" | "google" | "manual";
          provider_subscription_id: string | null;
          monthly_price: number;
          annual_price: number;
          active_since: string;
          lapsed_at: string | null;
          revoked_at: string | null;
          reason: string | null;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          cohort: "pilot50" | "launch500";
          lock_status?: "active" | "past_due" | "lapsed" | "revoked";
          billing_provider: "stripe" | "apple" | "google" | "manual";
          provider_subscription_id?: string | null;
          monthly_price: number;
          annual_price: number;
          active_since?: string;
          lapsed_at?: string | null;
          revoked_at?: string | null;
          reason?: string | null;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      rollout_phase_assignments: Table<
        {
          id: string;
          user_id: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          cohort: "pilot50" | "launch500" | "standard";
          seat_number: number | null;
          assignment_source: string;
          is_active: boolean;
          assigned_by: string | null;
          assigned_at: string;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          cohort?: "pilot50" | "launch500" | "standard";
          seat_number?: number | null;
          assignment_source?: string;
          is_active?: boolean;
          assigned_by?: string | null;
          assigned_at?: string;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        }
      >;
      onboarding_events: Table<
        {
          id: string;
          user_id: string | null;
          event_name: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          event_payload: Json;
          created_at: string | null;
        },
        {
          id?: string;
          user_id?: string | null;
          event_name: string;
          rollout_phase?:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          event_payload?: Json;
          created_at?: string | null;
        }
      >;
      disclaimer_acceptance_events: Table<
        {
          id: string;
          user_id: string;
          email: string | null;
          policy_version: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          source: string;
          event_payload: Json;
          accepted_at: string;
          created_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          email?: string | null;
          policy_version: string;
          rollout_phase?:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          source?: string;
          event_payload?: Json;
          accepted_at?: string;
          created_at?: string | null;
        }
      >;
      welcome_message_views: Table<
        {
          id: string;
          user_id: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          message_key: string;
          source: string;
          event_payload: Json;
          viewed_at: string;
          created_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY";
          message_key: string;
          source?: string;
          event_payload?: Json;
          viewed_at?: string;
          created_at?: string | null;
        }
      >;
      onboarding_feedback_events: Table<
        {
          id: string;
          user_id: string;
          email: string | null;
          category:
            | "bug"
            | "feature"
            | "onboarding_confusion"
            | "support"
            | "billing"
            | "onboarding";
          message: string;
          rollout_phase:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          event_payload: Json;
          created_at: string | null;
        },
        {
          id?: string;
          user_id: string;
          email?: string | null;
          category?:
            | "bug"
            | "feature"
            | "onboarding_confusion"
            | "support"
            | "billing"
            | "onboarding";
          message: string;
          rollout_phase?:
            | "FOUNDER_PILOT"
            | "CONTROLLED_PUBLIC_LAUNCH"
            | "EXPANSION_ACCESS"
            | "GENERAL_AVAILABILITY"
            | null;
          event_payload?: Json;
          created_at?: string | null;
        }
      >;
    };
    Views: {
      active_system_health_notices: {
        Row: {
          id: string;
          status: "info" | "degraded" | "maintenance" | "warning" | "critical" | "resolved";
          title: string;
          public_message: string;
          starts_at: string | null;
          ends_at: string | null;
          resolved_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: never[];
      };
    };
    Functions: {
      get_operator_program_counts: {
        Args: Record<string, never>;
        Returns: { program: string; claimed_count: number }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
