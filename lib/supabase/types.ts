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
          is_paid: boolean
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
          is_paid?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          browser_id?: string
          original_prompt?: string
          improved_prompt?: string | null
          image_path?: string
          image_media_type?: string
          is_paid?: boolean
          created_at?: string
        }
        Relationships: []
      }
      paid_credits: {
        Row: {
          id: string
          browser_id: string
          balance: number
          total_bought: number
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          browser_id: string
          balance?: number
          total_bought?: number
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          browser_id?: string
          balance?: number
          total_bought?: number
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      mercadopago_payments: {
        Row: {
          id: string
          browser_id: string
          mp_payment_id: number | null
          mp_external_ref: string
          pack: string
          amount_cents: number
          credits_to_grant: number
          status: "pending" | "approved" | "rejected" | "cancelled"
          qr_code: string | null
          qr_code_base64: string | null
          pix_expires_at: string | null
          created_at: string
          approved_at: string | null
        }
        Insert: {
          id?: string
          browser_id: string
          mp_payment_id?: number | null
          mp_external_ref: string
          pack: string
          amount_cents: number
          credits_to_grant: number
          status?: "pending" | "approved" | "rejected" | "cancelled"
          qr_code?: string | null
          qr_code_base64?: string | null
          pix_expires_at?: string | null
          created_at?: string
          approved_at?: string | null
        }
        Update: {
          id?: string
          browser_id?: string
          mp_payment_id?: number | null
          mp_external_ref?: string
          pack?: string
          amount_cents?: number
          credits_to_grant?: number
          status?: "pending" | "approved" | "rejected" | "cancelled"
          qr_code?: string | null
          qr_code_base64?: string | null
          pix_expires_at?: string | null
          created_at?: string
          approved_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_paid_credits: {
        Args: { p_browser_id: string }
        Returns: number
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

export type Browser = Tables<"browsers">
export type DailyUsage = Tables<"daily_usage">
export type Activity = Tables<"activities">
export type PaidCredits = Tables<"paid_credits">
export type MercadoPagoPayment = Tables<"mercadopago_payments">
