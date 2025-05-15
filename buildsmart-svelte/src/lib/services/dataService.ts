import { supabase } from '$lib/supabase';
import type { 
  Project, 
  Room, 
  DesignPreference, 
  SelectedProduct, 
  LaborCost 
} from '$lib/supabase';

// ==================== Projects ====================

/**
 * Create a new project
 */
export const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select();
  
  if (error) throw error;
  return data?.[0] as Project;
};

/**
 * Get all projects for a user
 */
export const getProjects = async (userId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Project[];
};

/**
 * Get a project by ID
 */
export const getProjectById = async (projectId: string) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) throw error;
  return data as Project;
};

/**
 * Update a project
 */
export const updateProject = async (projectId: string, updates: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select();
  
  if (error) throw error;
  return data?.[0] as Project;
};

/**
 * Delete a project
 */
export const deleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) throw error;
  return true;
};

// ==================== Rooms ====================

/**
 * Create a new room
 */
export const createRoom = async (room: Omit<Room, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('rooms')
    .insert(room)
    .select();
  
  if (error) throw error;
  return data?.[0] as Room;
};

/**
 * Get all rooms for a project
 */
export const getRoomsByProjectId = async (projectId: string) => {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('project_id', projectId);
  
  if (error) throw error;
  return data as Room[];
};

// ==================== Design Preferences ====================

/**
 * Create design preferences
 */
export const createDesignPreference = async (preference: Omit<DesignPreference, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('design_preferences')
    .insert(preference)
    .select();
  
  if (error) throw error;
  return data?.[0] as DesignPreference;
};

/**
 * Get design preferences for a project
 */
export const getDesignPreferenceByProjectId = async (projectId: string) => {
  const { data, error } = await supabase
    .from('design_preferences')
    .select('*')
    .eq('project_id', projectId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned" error
  return data as DesignPreference | null;
};

// ==================== Selected Products ====================

/**
 * Add a product to a room
 */
export const addProductToRoom = async (product: Omit<SelectedProduct, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('selected_products')
    .insert(product)
    .select();
  
  if (error) throw error;
  return data?.[0] as SelectedProduct;
};

/**
 * Get products for a room
 */
export const getProductsByRoomId = async (roomId: string) => {
  const { data, error } = await supabase
    .from('selected_products')
    .select('*')
    .eq('room_id', roomId);
  
  if (error) throw error;
  return data as SelectedProduct[];
};

// ==================== Labor Costs ====================

/**
 * Add labor cost to a room
 */
export const addLaborCost = async (laborCost: Omit<LaborCost, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('labor_costs')
    .insert(laborCost)
    .select();
  
  if (error) throw error;
  return data?.[0] as LaborCost;
};

/**
 * Get labor costs for a room
 */
export const getLaborCostsByRoomId = async (roomId: string) => {
  const { data, error } = await supabase
    .from('labor_costs')
    .select('*')
    .eq('room_id', roomId);
  
  if (error) throw error;
  return data as LaborCost[];
};
