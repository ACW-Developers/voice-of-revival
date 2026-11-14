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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      donation_orders: {
        Row: {
          amount_cents: number
          anonymous: boolean
          created_at: string
          email: string
          frequency: string
          id: string
          message: string
          name: string
          phone: string
          stripe_session_id: string | null
          subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          anonymous?: boolean
          created_at?: string
          email: string
          frequency: string
          id?: string
          message?: string
          name?: string
          phone?: string
          stripe_session_id?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          anonymous?: boolean
          created_at?: string
          email?: string
          frequency?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          stripe_session_id?: string | null
          subscription_id?: string | null
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          order_id: string
          paid_at: string
          payment_id: string
          payment_status: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          id?: string
          order_id: string
          paid_at: string
          payment_id: string
          payment_status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          paid_at?: string
          payment_id?: string
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "donations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "donation_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string
          id: string
          poster_url: string | null
          price_cents: number
          published: boolean
          starts_at: string
          tickets_sold: number
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          poster_url?: string | null
          price_cents?: number
          published?: boolean
          starts_at: string
          tickets_sold?: number
          title: string
          updated_at?: string
          venue?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          poster_url?: string | null
          price_cents?: number
          published?: boolean
          starts_at?: string
          tickets_sold?: number
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          access_token: string
          created_at: string
          details: Json
          id: string
          kind: string
          source_id: string
          status: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          details: Json
          id?: string
          kind: string
          source_id: string
          status?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          details?: Json
          id?: string
          kind?: string
          source_id?: string
          status?: string
        }
        Relationships: []
      }
      payment_recording_config: {
        Row: {
          id: boolean
          secret_digest: string
        }
        Insert: {
          id?: boolean
          secret_digest: string
        }
        Update: {
          id?: boolean
          secret_digest?: string
        }
        Relationships: []
      }
      ticket_admissions: {
        Row: {
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          seat_number: number
          ticket_id: string
          token: string
        }
        Insert: {
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          seat_number: number
          ticket_id: string
          token?: string
        }
        Update: {
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          seat_number?: number
          ticket_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_admissions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          event_id: string
          id: string
          payment_status: string
          quantity: number
          stripe_session_id: string
          ticket_code: string
        }
        Insert: {
          amount_cents: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency: string
          event_id: string
          id?: string
          payment_status?: string
          quantity: number
          stripe_session_id: string
          ticket_code?: string
        }
        Update: {
          amount_cents?: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          id?: string
          payment_status?: string
          quantity?: number
          stripe_session_id?: string
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      configure_payment_recording: {
        Args: { p_secret: string }
        Returns: undefined
      }
      get_payment_receipt: { Args: { p_token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      manage_donation: {
        Args: { p_action: string; p_data: Json; p_secret: string }
        Returns: Json
      }
      payment_recording_authorized: {
        Args: { p_secret: string }
        Returns: boolean
      }
      receipt_for_payment: {
        Args: { p_kind: string; p_payment_id: string; p_secret: string }
        Returns: string
      }
      record_ticket: {
        Args: {
          p_amount: number
          p_currency: string
          p_email: string
          p_event_id: string
          p_name: string
          p_quantity: number
          p_secret: string
          p_session_id: string
        }
        Returns: Json
      }
      update_payment_status: {
        Args: { p_payment_id: string; p_secret: string; p_status: string }
        Returns: undefined
      }
      validate_ticket_entry: {
        Args: { p_event_id: string; p_redeem?: boolean; p_token: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
