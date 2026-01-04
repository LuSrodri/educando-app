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
      }
      credits: {
        Row: {
          id: string
          browser_id: string
          count: number
        }
        Insert: {
          id?: string
          browser_id: string
          count?: number
        }
        Update: {
          id?: string
          browser_id?: string
          count?: number
        }
      }
      activities: {
        Row: {
          id: string
          browser_id: string
          parent_id: string | null
          root_id: string | null
          original_prompt: string
          improved_prompt: string | null
          edit_prompt: string | null
          educational_level: string
          grade: string | null
          image_path: string
          image_media_type: string
          generation_type: "original" | "edit" | "fork"
          version_number: number
          created_at: string
        }
        Insert: {
          id?: string
          browser_id: string
          parent_id?: string | null
          root_id?: string | null
          original_prompt: string
          improved_prompt?: string | null
          edit_prompt?: string | null
          educational_level: string
          grade?: string | null
          image_path: string
          image_media_type?: string
          generation_type: "original" | "edit" | "fork"
          version_number?: number
          created_at?: string
        }
        Update: {
          id?: string
          browser_id?: string
          parent_id?: string | null
          root_id?: string | null
          original_prompt?: string
          improved_prompt?: string | null
          edit_prompt?: string | null
          educational_level?: string
          grade?: string | null
          image_path?: string
          image_media_type?: string
          generation_type?: "original" | "edit" | "fork"
          version_number?: number
          created_at?: string
        }
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
export type Credits = Tables<"credits">
export type Activity = Tables<"activities">
