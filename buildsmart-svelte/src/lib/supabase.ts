import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaXNkeWFkanVweXN3Y3BieHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MzM1ODcsImV4cCI6MjA1OTAwOTU4N30.u2hCWysJmyRyo4ZWBruDUSHAjzj9_Ibv81z7lPyx1JY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Types for our database tables
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  budget_min: number;
  budget_max: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  type: string;
  length?: number | null;
  width?: number | null;
  square_footage?: number | null;
  ceiling_height?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DesignPreference {
  id: string;
  project_id: string;
  style?: string | null;
  color_preferences?: any | null;
  material_preferences?: any | null;
  created_at: string;
  updated_at: string;
}

export interface SelectedProduct {
  id: string;
  room_id: string;
  product_id: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface LaborCost {
  id: string;
  room_id: string;
  trade_type: string;
  rate_per_sqft: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationHistory {
  id: string;
  project_id: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface ProjectPhoto {
  id: string;
  project_id: string;
  room_id?: string | null;
  storage_path: string;
  description?: string | null;
  created_at: string;
}
