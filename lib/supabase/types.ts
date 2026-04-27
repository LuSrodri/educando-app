export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PaymentPackCode = "experimentar" | "popular" | "melhor_valor"
export type PaymentIntentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "expired"
export type CreditEntryKind =
  | "purchase"
  | "consume"
  | "refund"
  | "expire"
  | "adjustment"

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string
          image_path: string
          image_media_type: string
          created_at: string | null
          updated_at: string
          title: string | null
          theme: string | null
          short_description: string | null
          long_description: string | null
          bncc_codes: string[]
          type: "activity" | "support_material"
          source_url: string | null
          source_provider: "internal" | "tavily"
          quality_score: number | null
          search_vector: unknown
          user_id: string | null
        }
        Insert: {
          id?: string
          image_path: string
          image_media_type?: string
          created_at?: string | null
          updated_at?: string
          title?: string | null
          theme?: string | null
          short_description?: string | null
          long_description?: string | null
          bncc_codes?: string[]
          type?: "activity" | "support_material"
          source_url?: string | null
          source_provider?: "internal" | "tavily"
          quality_score?: number | null
          user_id?: string | null
        }
        Update: {
          id?: string
          image_path?: string
          image_media_type?: string
          created_at?: string | null
          updated_at?: string
          title?: string | null
          theme?: string | null
          short_description?: string | null
          long_description?: string | null
          bncc_codes?: string[]
          type?: "activity" | "support_material"
          source_url?: string | null
          source_provider?: "internal" | "tavily"
          quality_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          id: string
          query: string
          normalized_query: string
          results_count: number | null
          external_fetched: number | null
          created_at: string
          outcome: "ok" | "search_rate_limited" | "moderation_rejected" | "turnstile_failed" | "enrichment_rate_limited" | "error"
          moderation_reason: string | null
          page: number
          enrichment_triggered: boolean
          candidates_inspected: number | null
          candidates_rejected: number | null
          candidates_failed: number | null
          duration_ms: number | null
        }
        Insert: {
          id?: string
          query: string
          normalized_query: string
          results_count?: number | null
          external_fetched?: number | null
          created_at?: string
          outcome?: "ok" | "search_rate_limited" | "moderation_rejected" | "turnstile_failed" | "enrichment_rate_limited" | "error"
          moderation_reason?: string | null
          page?: number
          enrichment_triggered?: boolean
          candidates_inspected?: number | null
          candidates_rejected?: number | null
          candidates_failed?: number | null
          duration_ms?: number | null
        }
        Update: {
          id?: string
          query?: string
          normalized_query?: string
          results_count?: number | null
          external_fetched?: number | null
          created_at?: string
          outcome?: "ok" | "search_rate_limited" | "moderation_rejected" | "turnstile_failed" | "enrichment_rate_limited" | "error"
          moderation_reason?: string | null
          page?: number
          enrichment_triggered?: boolean
          candidates_inspected?: number | null
          candidates_rejected?: number | null
          candidates_failed?: number | null
          duration_ms?: number | null
        }
        Relationships: []
      }
      activity_clicks: {
        Row: {
          id: string
          activity_id: string
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          referrer?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          id: string
          user_id: string
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          pack_code: PaymentPackCode
          credits_amount: number
          amount_brl_cents: number
          status: PaymentIntentStatus
          created_at: string
          paid_at: string | null
          expires_at: string | null
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          pack_code: PaymentPackCode
          credits_amount: number
          amount_brl_cents: number
          status?: PaymentIntentStatus
          created_at?: string
          paid_at?: string | null
          expires_at?: string | null
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          pack_code?: PaymentPackCode
          credits_amount?: number
          amount_brl_cents?: number
          status?: PaymentIntentStatus
          created_at?: string
          paid_at?: string | null
          expires_at?: string | null
          metadata?: Json
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          id: string
          user_id: string
          delta: number
          kind: CreditEntryKind
          reason: string | null
          payment_intent_id: string | null
          activity_id: string | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          delta: number
          kind: CreditEntryKind
          reason?: string | null
          payment_intent_id?: string | null
          activity_id?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          delta?: number
          kind?: CreditEntryKind
          reason?: string | null
          payment_intent_id?: string | null
          activity_id?: string | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_activities: {
        Args: { q?: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      rate_limit_check: {
        Args: {
          p_bucket: string
          p_key: string
          p_limit: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      find_activity_by_id_suffix: {
        Args: { p_suffix: string }
        Returns: Database["public"]["Tables"]["activities"]["Row"][]
      }
      current_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      payment_pack_code: PaymentPackCode
      payment_intent_status: PaymentIntentStatus
      credit_entry_kind: CreditEntryKind
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

export type Activity = Tables<"activities">
export type SearchQuery = Tables<"search_queries">
export type ActivityClick = Tables<"activity_clicks">
export type Profile = Tables<"profiles">
export type PaymentIntent = Tables<"payment_intents">
export type CreditLedgerEntry = Tables<"credit_ledger">
