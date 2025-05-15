export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          budget_min: number
          budget_max: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          budget_min?: number
          budget_max?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          budget_min?: number
          budget_max?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: {
          id: string
          project_id: string
          type: string
          length: number | null
          width: number | null
          square_footage: number | null
          ceiling_height: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          type: string
          length?: number | null
          width?: number | null
          square_footage?: number | null
          ceiling_height?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          type?: string
          length?: number | null
          width?: number | null
          square_footage?: number | null
          ceiling_height?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      design_preferences: {
        Row: {
          id: string
          project_id: string
          style: string | null
          color_preferences: Json | null
          material_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          style?: string | null
          color_preferences?: Json | null
          material_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          style?: string | null
          color_preferences?: Json | null
          material_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "design_preferences_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      selected_products: {
        Row: {
          id: string
          room_id: string
          product_id: string
          category: string
          name: string
          price: number
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          product_id: string
          category: string
          name: string
          price: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          product_id?: string
          category?: string
          name?: string
          price?: number
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "selected_products_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      labor_costs: {
        Row: {
          id: string
          room_id: string
          trade_type: string
          rate_per_sqft: number
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          trade_type: string
          rate_per_sqft: number
          total_cost: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          trade_type?: string
          rate_per_sqft?: number
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labor_costs_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_history: {
        Row: {
          id: string
          project_id: string
          role: string
          content: string
          timestamp: string
        }
        Insert: {
          id?: string
          project_id: string
          role: string
          content: string
          timestamp?: string
        }
        Update: {
          id?: string
          project_id?: string
          role?: string
          content?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_history_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      project_photos: {
        Row: {
          id: string
          project_id: string
          room_id: string | null
          storage_path: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          room_id?: string | null
          storage_path: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          room_id?: string | null
          storage_path?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_photos_room_id_fkey"
            columns: ["room_id"]
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
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
