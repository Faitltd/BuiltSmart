-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  budget_min DECIMAL(10, 2) DEFAULT 0,
  budget_max DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  length DECIMAL(10, 2),
  width DECIMAL(10, 2),
  square_footage DECIMAL(10, 2),
  ceiling_height DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create design_preferences table
CREATE TABLE IF NOT EXISTS design_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  style TEXT,
  color_preferences JSONB,
  material_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create selected_products table
CREATE TABLE IF NOT EXISTS selected_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create labor_costs table
CREATE TABLE IF NOT EXISTS labor_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  trade_type TEXT NOT NULL,
  rate_per_sqft DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create conversation_history table
CREATE TABLE IF NOT EXISTS conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_photos table
CREATE TABLE IF NOT EXISTS project_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE selected_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- Projects table policies
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Rooms table policies
CREATE POLICY "Users can view rooms in their projects" 
  ON rooms FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert rooms in their projects" 
  ON rooms FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update rooms in their projects" 
  ON rooms FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete rooms in their projects" 
  ON rooms FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

-- Design preferences table policies
CREATE POLICY "Users can view design preferences for their projects" 
  ON design_preferences FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = design_preferences.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert design preferences for their projects" 
  ON design_preferences FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = design_preferences.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update design preferences for their projects" 
  ON design_preferences FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = design_preferences.project_id AND projects.user_id = auth.uid()
  ));

-- Selected products table policies
CREATE POLICY "Users can view selected products for their projects" 
  ON selected_products FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = selected_products.room_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert selected products for their projects" 
  ON selected_products FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = selected_products.room_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update selected products for their projects" 
  ON selected_products FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = selected_products.room_id AND projects.user_id = auth.uid()
  ));

-- Labor costs table policies
CREATE POLICY "Users can view labor costs for their projects" 
  ON labor_costs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = labor_costs.room_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert labor costs for their projects" 
  ON labor_costs FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = labor_costs.room_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update labor costs for their projects" 
  ON labor_costs FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM rooms 
    JOIN projects ON rooms.project_id = projects.id
    WHERE rooms.id = labor_costs.room_id AND projects.user_id = auth.uid()
  ));

-- Conversation history table policies
CREATE POLICY "Users can view conversation history for their projects" 
  ON conversation_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = conversation_history.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert conversation history for their projects" 
  ON conversation_history FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = conversation_history.project_id AND projects.user_id = auth.uid()
  ));

-- Project photos table policies
CREATE POLICY "Users can view photos for their projects" 
  ON project_photos FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert photos for their projects" 
  ON project_photos FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()
  ));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON design_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON selected_products
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON labor_costs
  FOR EACH ROW
  EXECUTE PROCEDURE handle_updated_at();
