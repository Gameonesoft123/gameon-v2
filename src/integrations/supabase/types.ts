export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      auth_user_face_logins: {
        Row: {
          created_at: string;
          external_image_id: string;
          id: string;
          rekognition_internal_face_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          external_image_id: string;
          id?: string;
          rekognition_internal_face_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          external_image_id?: string;
          id?: string;
          rekognition_internal_face_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "auth_user_face_logins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          }
        ];
      };
      backup_ids: {
        Row: {
          card_id: string;
          created_at: string;
          customer_id: string;
          id: string;
          notes: string | null;
          store_id: string | null;
        };
        Insert: {
          card_id: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          notes?: string | null;
          store_id?: string | null;
        };
        Update: {
          card_id?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          notes?: string | null;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "backup_ids_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "backup_ids_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      customer_check_ins: {
        Row: {
          check_in_time: string;
          check_out_time: string | null;
          created_at: string;
          customer_id: string;
          id: string;
          notes: string | null;
          store_id: string | null;
        };
        Insert: {
          check_in_time?: string;
          check_out_time?: string | null;
          created_at?: string;
          customer_id: string;
          id?: string;
          notes?: string | null;
          store_id?: string | null;
        };
        Update: {
          check_in_time?: string;
          check_out_time?: string | null;
          created_at?: string;
          customer_id?: string;
          id?: string;
          notes?: string | null;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "customer_check_ins_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_check_ins_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      customer_face_ids: {
        Row: {
          created_at: string;
          customer_id: string | null;
          face_data: Json | null;
          face_id: string | null;
          id: number;
        };
        Insert: {
          created_at?: string;
          customer_id?: string | null;
          face_data?: Json | null;
          face_id?: string | null;
          id?: number;
        };
        Update: {
          created_at?: string;
          customer_id?: string | null;
          face_data?: Json | null;
          face_id?: string | null;
          id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_face_ids_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          created_at: string;
          email: string;
          face_id: string | null;
          first_name: string;
          id: string;
          last_name: string;
          notes: string | null;
          phone: string;
          rating: number;
          store_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          face_id?: string | null;
          first_name: string;
          id?: string;
          last_name: string;
          notes?: string | null;
          phone: string;
          rating?: number;
          store_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          face_id?: string | null;
          first_name?: string;
          id?: string;
          last_name?: string;
          notes?: string | null;
          phone?: string;
          rating?: number;
          store_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      finances: {
        Row: {
          amount: number;
          category: string;
          created_at: string;
          date: string;
          description: string;
          id: string;
          store_id: string | null;
        };
        Insert: {
          amount: number;
          category: string;
          created_at?: string;
          date: string;
          description: string;
          id?: string;
          store_id?: string | null;
        };
        Update: {
          amount?: number;
          category?: string;
          created_at?: string;
          date?: string;
          description?: string;
          id?: string;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "finances_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      machine_history: {
        Row: {
          cash_in: number;
          cash_out: number;
          created_by: string | null;
          id: string;
          machine_id: string;
          notes: string | null;
          recorded_at: string;
          revenue: number;
          store_id: string | null;
        };
        Insert: {
          cash_in?: number;
          cash_out?: number;
          created_by?: string | null;
          id?: string;
          machine_id: string;
          notes?: string | null;
          recorded_at?: string;
          revenue?: number;
          store_id?: string | null;
        };
        Update: {
          cash_in?: number;
          cash_out?: number;
          created_by?: string | null;
          id?: string;
          machine_id?: string;
          notes?: string | null;
          recorded_at?: string;
          revenue?: number;
          store_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "machine_history_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "machine_history_machine_id_fkey";
            columns: ["machine_id"];
            isOneToOne: false;
            referencedRelation: "machines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "machine_history_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      machines: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          location: string | null;
          name: string;
          status: string | null;
          store_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          name: string;
          status?: string | null;
          store_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          location?: string | null;
          name?: string;
          status?: string | null;
          store_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "machines_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      match_transactions: {
        Row: {
          created_at: string;
          created_by: string | null;
          customer_id: string;
          employee_id: string | null;
          id: string;
          initial_amount: number;
          machine_id: string;
          match_percentage: number;
          matched_amount: number;
          notes: string | null;
          redeemed_at: string | null;
          redemption_threshold: number;
          status: string;
          store_id: string | null;
          total_credits: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          customer_id: string;
          employee_id?: string | null;
          id?: string;
          initial_amount: number;
          machine_id: string;
          match_percentage?: number;
          matched_amount: number;
          notes?: string | null;
          redeemed_at?: string | null;
          redemption_threshold: number;
          status: string;
          store_id?: string | null;
          total_credits: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          customer_id?: string;
          employee_id?: string | null;
          id?: string;
          initial_amount?: number;
          machine_id?: string;
          match_percentage?: number;
          matched_amount?: number;
          notes?: string | null;
          redeemed_at?: string | null;
          redemption_threshold?: number;
          status?: string;
          store_id?: string | null;
          total_credits?: number;
        };
        Relationships: [
          {
            foreignKeyName: "match_transactions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_transactions_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_transactions_machine_id_fkey";
            columns: ["machine_id"];
            isOneToOne: false;
            referencedRelation: "machines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_transactions_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          read: boolean;
          store_id: string | null;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message: string;
          read?: boolean;
          store_id?: string | null;
          title: string;
          type: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          read?: boolean;
          store_id?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          role: string;
          store_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          role: string;
          store_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          role?: string;
          store_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      staff: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string;
          password_hash: string;
          phone_number: string;
          role: string;
          store_id: string | null;
          updated_at: string;
          username: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          last_name: string;
          password_hash: string;
          phone_number: string;
          role: string;
          store_id?: string | null;
          updated_at?: string;
          username: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string;
          password_hash?: string;
          phone_number?: string;
          role?: string;
          store_id?: string | null;
          updated_at?: string;
          username?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      stores: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          active: boolean;
          features: Json | null;
          id: string;
          name: string;
          price: number;
        };
        Insert: {
          active?: boolean;
          features?: Json | null;
          id?: string;
          name: string;
          price: number;
        };
        Update: {
          active?: boolean;
          features?: Json | null;
          id?: string;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      user_face_ids: {
        Row: {
          created_at: string;
          face_data: Json | null;
          face_id: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          face_data?: Json | null;
          face_id: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          face_data?: Json | null;
          face_id?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_face_ids_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_subscriptions: {
        Row: {
          created_at: string;
          end_date: string | null;
          id: string;
          plan_id: string;
          start_date: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          plan_id: string;
          start_date: string;
          status: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string | null;
          id?: string;
          plan_id?: string;
          start_date?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "public_users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      public_users: {
        Row: {
          created_at: string | null;
          email: string | null;
          id: string | null;
          raw_app_meta_data: Json | null;
          raw_user_meta_data: Json | null;
        };
        Insert: {
          created_at?: string | null;
          email?: string | null;
          id?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
        };
        Update: {
          created_at?: string | null;
          email?: string | null;
          id?: string | null;
          raw_app_meta_data?: Json | null;
          raw_user_meta_data?: Json | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_stay_duration: {
        Args: { check_in: string; check_out: string };
        Returns: unknown;
      };
      get_store_financial_metrics: {
        Args: { p_time_range: string; p_store_id?: string };
        Returns: {
          revenue: number;
          expenses: number;
          profit: number;
          growth_percentage: number;
        }[];
      };
      get_store_performance: {
        Args: Record<PropertyKey, never>;
        Returns: {
          store_name: string;
          revenue: number;
          share_percentage: number;
          monthly_growth: number;
        }[];
      };
      get_subscription_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: {
          plan_name: string;
          subscribers: number;
          monthly_revenue: number;
          growth_percentage: number;
        }[];
      };
      get_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_store: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_store_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_super_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
