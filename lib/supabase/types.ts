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
      browsers: {
        Row: {
          id: string
          browser_id: string
          created_at: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          browser_id: string
          created_at?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          browser_id?: string
          created_at?: string
          last_seen_at?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          id: string
          browser_id: string
          usage_date: string
          count: number
        }
        Insert: {
          id?: string
          browser_id: string
          usage_date?: string
          count?: number
        }
        Update: {
          id?: string
          browser_id?: string
          usage_date?: string
          count?: number
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          browser_id: string
          original_prompt: string
          improved_prompt: string | null
          image_path: string
          image_media_type: string
          created_at: string
          semantic_slug: string
        }
        Insert: {
          id?: string
          browser_id: string
          original_prompt: string
          improved_prompt?: string | null
          image_path: string
          image_media_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          browser_id?: string
          original_prompt?: string
          improved_prompt?: string | null
          image_path?: string
          image_media_type?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Browser = Tables<"browsers">
export type DailyUsage = Tables<"daily_usage">
export type Activity = Tables<"activities">
