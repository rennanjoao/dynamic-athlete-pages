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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      avatar_customization: {
        Row: {
          clothing_color: string
          eye_color: string
          hair_color: string
          hair_style: string
          id: string
          nail_color: string | null
          shoe_accent_color: string
          shoe_color: string
          skin_color: string
          updated_at: string
          user_id: string
          water_bottle_color: string
        }
        Insert: {
          clothing_color?: string
          eye_color?: string
          hair_color?: string
          hair_style?: string
          id?: string
          nail_color?: string | null
          shoe_accent_color?: string
          shoe_color?: string
          skin_color?: string
          updated_at?: string
          user_id: string
          water_bottle_color?: string
        }
        Update: {
          clothing_color?: string
          eye_color?: string
          hair_color?: string
          hair_style?: string
          id?: string
          nail_color?: string | null
          shoe_accent_color?: string
          shoe_color?: string
          skin_color?: string
          updated_at?: string
          user_id?: string
          water_bottle_color?: string
        }
        Relationships: []
      }
      body_measurements: {
        Row: {
          arm: number | null
          back: number | null
          body_fat_percentage: number | null
          calf: number | null
          chest: number | null
          created_at: string
          forearm: number | null
          hip: number | null
          id: string
          measurement_date: string
          thigh: number | null
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          arm?: number | null
          back?: number | null
          body_fat_percentage?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          forearm?: number | null
          hip?: number | null
          id?: string
          measurement_date?: string
          thigh?: number | null
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          arm?: number | null
          back?: number | null
          body_fat_percentage?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          forearm?: number | null
          hip?: number | null
          id?: string
          measurement_date?: string
          thigh?: number | null
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      coach_plans: {
        Row: {
          calories: number
          carbs_g: number
          coach_id: string
          created_at: string
          fat_g: number
          goal: string
          id: string
          notes: string | null
          protein_g: number
          student_id: string
          updated_at: string
          water_l: number
        }
        Insert: {
          calories?: number
          carbs_g?: number
          coach_id: string
          created_at?: string
          fat_g?: number
          goal?: string
          id?: string
          notes?: string | null
          protein_g?: number
          student_id: string
          updated_at?: string
          water_l?: number
        }
        Update: {
          calories?: number
          carbs_g?: number
          coach_id?: string
          created_at?: string
          fat_g?: number
          goal?: string
          id?: string
          notes?: string | null
          protein_g?: number
          student_id?: string
          updated_at?: string
          water_l?: number
        }
        Relationships: []
      }
      daily_alerts: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          message: string
          student_id: string
          target_date: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          message: string
          student_id: string
          target_date?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          message?: string
          student_id?: string
          target_date?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      diet_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          id: string
          meal_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          meal_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          id?: string
          meal_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          meals_completed: number
          total_meals: number
          total_workouts: number
          user_id: string
          workouts_completed: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          meals_completed?: number
          total_meals?: number
          total_workouts?: number
          user_id: string
          workouts_completed?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meals_completed?: number
          total_meals?: number
          total_workouts?: number
          user_id?: string
          workouts_completed?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          cref: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cref?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cref?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skinfold_measurements: {
        Row: {
          abdominal: number | null
          biceps: number | null
          body_fat_percentage: number | null
          calf: number | null
          chest: number | null
          created_at: string
          id: string
          measurement_date: string
          midaxillary: number | null
          protocol_used: string | null
          subscapular: number | null
          suprailiac: number | null
          thigh: number | null
          triceps: number | null
          user_id: string
          weight: number | null
        }
        Insert: {
          abdominal?: number | null
          biceps?: number | null
          body_fat_percentage?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          id?: string
          measurement_date?: string
          midaxillary?: number | null
          protocol_used?: string | null
          subscapular?: number | null
          suprailiac?: number | null
          thigh?: number | null
          triceps?: number | null
          user_id: string
          weight?: number | null
        }
        Update: {
          abdominal?: number | null
          biceps?: number | null
          body_fat_percentage?: number | null
          calf?: number | null
          chest?: number | null
          created_at?: string
          id?: string
          measurement_date?: string
          midaxillary?: number | null
          protocol_used?: string | null
          subscapular?: number | null
          suprailiac?: number | null
          thigh?: number | null
          triceps?: number | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      student_profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          gender: string
          height: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name: string
          gender: string
          height?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          gender?: string
          height?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          workout_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          workout_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: []
      }
      workout_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          level: string
          name: string
          treinos: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          level?: string
          name: string
          treinos?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          level?: string
          name?: string
          treinos?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      student_alert_view: {
        Row: {
          alert_level: string | null
          full_name: string | null
          last_meal_at: string | null
          last_workout_at: string | null
          user_id: string | null
        }
        Insert: {
          alert_level?: never
          full_name?: string | null
          last_meal_at?: never
          last_workout_at?: never
          user_id?: string | null
        }
        Update: {
          alert_level?: never
          full_name?: string | null
          last_meal_at?: never
          last_workout_at?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "coach"
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

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "coach"],
    },
  },
} as const
