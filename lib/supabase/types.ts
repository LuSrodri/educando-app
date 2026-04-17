export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
        }
        Relationships: []
      }
      search_queries: {
        Row: {
          id: string
          query: string
          normalized_query: string
          fingerprint_hash: string | null
          results_count: number
          external_fetched: number
          created_at: string
        }
        Insert: {
          id?: string
          query: string
          normalized_query: string
          fingerprint_hash?: string | null
          results_count?: number
          external_fetched?: number
          created_at?: string
        }
        Update: {
          id?: string
          query?: string
          normalized_query?: string
          fingerprint_hash?: string | null
          results_count?: number
          external_fetched?: number
          created_at?: string
        }
        Relationships: []
      }
      activity_clicks: {
        Row: {
          id: string
          activity_id: string
          fingerprint_hash: string | null
          referrer: string | null
          created_at: string
        }
        Insert: {
          id?: string
          activity_id: string
          fingerprint_hash?: string | null
          referrer?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          activity_id?: string
          fingerprint_hash?: string | null
          referrer?: string | null
          created_at?: string
        }
        Relationships: []
      }
      saved_activities: {
        Row: {
          id: string
          fingerprint_hash: string
          activity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          fingerprint_hash: string
          activity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          fingerprint_hash?: string
          activity_id?: string
          created_at?: string
        }
        Relationships: []
      }
      security_identities: {
        Row: {
          id: string
          fingerprint_hash: string
          fp_id: string
          ip_hash: string
          fp_last_changed: string
          ip_last_changed: string
          created_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          fingerprint_hash: string
          fp_id: string
          ip_hash: string
          fp_last_changed?: string
          ip_last_changed?: string
          created_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          fingerprint_hash?: string
          fp_id?: string
          ip_hash?: string
          fp_last_changed?: string
          ip_last_changed?: string
          created_at?: string
          last_seen_at?: string
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
    }
    Enums: {
      [_ in never]: never
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
export type SavedActivity = Tables<"saved_activities">
export type SecurityIdentity = Tables<"security_identities">
