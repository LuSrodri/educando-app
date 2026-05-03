export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          bncc_codes: string[]
          created_at: string | null
          id: string
          image_media_type: string
          image_path: string
          long_description: string | null
          quality_score: number | null
          search_vector: unknown
          short_description: string | null
          source_provider: string
          source_url: string | null
          theme: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bncc_codes?: string[]
          created_at?: string | null
          id?: string
          image_media_type?: string
          image_path: string
          long_description?: string | null
          quality_score?: number | null
          search_vector?: unknown
          short_description?: string | null
          source_provider?: string
          source_url?: string | null
          theme?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bncc_codes?: string[]
          created_at?: string | null
          id?: string
          image_media_type?: string
          image_path?: string
          long_description?: string | null
          quality_score?: number | null
          search_vector?: unknown
          short_description?: string | null
          source_provider?: string
          source_url?: string | null
          theme?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activities_backup_20260417: {
        Row: {
          browser_id: string | null
          created_at: string | null
          id: string | null
          image_media_type: string | null
          image_path: string | null
          improved_prompt: string | null
          is_paid: boolean | null
          original_prompt: string | null
          semantic_slug: string | null
        }
        Insert: {
          browser_id?: string | null
          created_at?: string | null
          id?: string | null
          image_media_type?: string | null
          image_path?: string | null
          improved_prompt?: string | null
          is_paid?: boolean | null
          original_prompt?: string | null
          semantic_slug?: string | null
        }
        Update: {
          browser_id?: string | null
          created_at?: string | null
          id?: string | null
          image_media_type?: string | null
          image_path?: string | null
          improved_prompt?: string | null
          is_paid?: boolean | null
          original_prompt?: string | null
          semantic_slug?: string | null
        }
        Relationships: []
      }
      activity_clicks: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          referrer: string | null
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          referrer?: string | null
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          referrer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_clicks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_ledger: {
        Row: {
          activity_id: string | null
          created_at: string
          delta: number
          expires_at: string | null
          id: string
          kind: Database["public"]["Enums"]["credit_entry_kind"]
          payment_intent_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          delta: number
          expires_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["credit_entry_kind"]
          payment_intent_id?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          delta?: number
          expires_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["credit_entry_kind"]
          payment_intent_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_ledger_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          amount_brl_cents: number
          created_at: string
          credits_amount: number
          expires_at: string | null
          id: string
          metadata: Json
          pack_code: Database["public"]["Enums"]["payment_pack_code"]
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_intent_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount_brl_cents: number
          created_at?: string
          credits_amount: number
          expires_at?: string | null
          id?: string
          metadata?: Json
          pack_code: Database["public"]["Enums"]["payment_pack_code"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_intent_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount_brl_cents?: number
          created_at?: string
          credits_amount?: number
          expires_at?: string | null
          id?: string
          metadata?: Json
          pack_code?: Database["public"]["Enums"]["payment_pack_code"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_intent_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_counters: {
        Row: {
          bucket: string
          count: number
          expires_at: string
          key: string
        }
        Insert: {
          bucket: string
          count?: number
          expires_at: string
          key: string
        }
        Update: {
          bucket?: string
          count?: number
          expires_at?: string
          key?: string
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          candidates_failed: number | null
          candidates_inspected: number | null
          candidates_rejected: number | null
          created_at: string
          duration_ms: number | null
          enrichment_triggered: boolean
          external_fetched: number | null
          id: string
          moderation_reason: string | null
          normalized_query: string
          outcome: string
          page: number
          query: string
          results_count: number | null
        }
        Insert: {
          candidates_failed?: number | null
          candidates_inspected?: number | null
          candidates_rejected?: number | null
          created_at?: string
          duration_ms?: number | null
          enrichment_triggered?: boolean
          external_fetched?: number | null
          id?: string
          moderation_reason?: string | null
          normalized_query: string
          outcome?: string
          page?: number
          query: string
          results_count?: number | null
        }
        Update: {
          candidates_failed?: number | null
          candidates_inspected?: number | null
          candidates_rejected?: number | null
          created_at?: string
          duration_ms?: number | null
          enrichment_triggered?: boolean
          external_fetched?: number | null
          id?: string
          moderation_reason?: string | null
          normalized_query?: string
          outcome?: string
          page?: number
          query?: string
          results_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credit: {
        Args: { p_activity_id: string; p_reason: string; p_user_id: string }
        Returns: boolean
      }
      current_credit_balance: { Args: { p_user_id: string }; Returns: number }
      find_activity_by_id_suffix: {
        Args: { p_suffix: string }
        Returns: {
          bncc_codes: string[]
          created_at: string | null
          id: string
          image_media_type: string
          image_path: string
          long_description: string | null
          quality_score: number | null
          search_vector: unknown
          short_description: string | null
          source_provider: string
          source_url: string | null
          theme: string | null
          title: string | null
          type: string
          updated_at: string
          user_id: string | null
        }[]
      }
      immutable_unaccent: { Args: { "": string }; Returns: string }
      rate_limit_check: {
        Args: {
          p_bucket: string
          p_key: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      refund_credit: {
        Args: { p_activity_id: string; p_reason: string; p_user_id: string }
        Returns: undefined
      }
      search_activities: {
        Args: { p_limit?: number; p_offset?: number; q?: string }
        Returns: Json
      }
      show_limit: { Args: Record<PropertyKey, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      credit_entry_kind:
        | "purchase"
        | "consume"
        | "refund"
        | "expire"
        | "adjustment"
      payment_intent_status:
        | "pending"
        | "paid"
        | "failed"
        | "canceled"
        | "expired"
      payment_pack_code: "experimentar" | "popular" | "melhor_valor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ─── Convenience aliases ──────────────────────────────────────────────────────
export type Activity = Tables<"activities">
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type PaymentPackCode = Database["public"]["Enums"]["payment_pack_code"]

export const Constants = {
  public: {
    Enums: {
      credit_entry_kind: [
        "purchase",
        "consume",
        "refund",
        "expire",
        "adjustment",
      ],
      payment_intent_status: [
        "pending",
        "paid",
        "failed",
        "canceled",
        "expired",
      ],
      payment_pack_code: ["experimentar", "popular", "melhor_valor"],
    },
  },
} as const
