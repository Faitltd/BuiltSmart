-- BuildSmart Database Schema for Supabase

-- Enable RLS (Row Level Security)
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- Create projects table
CREATE TABLE public.projects (
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
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  length DECIMAL(10, 2),
  width DECIMAL(10, 2),
  square_footage DECIMAL(10, 2),
  ceiling_height DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create design_preferences table
CREATE TABLE public.design_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  style TEXT,
  color_preferences JSONB,
  material_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create selected_products table
CREATE TABLE public.selected_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create labor_costs table
CREATE TABLE public.labor_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  trade_type TEXT NOT NULL,
  rate_per_sqft DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create conversation_history table
CREATE TABLE public.conversation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_photos table
CREATE TABLE public.project_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS) policies

-- Projects table policies
CREATE POLICY "Users can view their own projects" 
  ON public.projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
  ON public.projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON public.projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON public.projects FOR DELETE 
  USING (auth.uid() = user_id);

-- Rooms table policies
CREATE POLICY "Users can view rooms in their projects" 
  ON public.rooms FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert rooms in their projects" 
  ON public.rooms FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update rooms in their projects" 
  ON public.rooms FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete rooms in their projects" 
  ON public.rooms FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = rooms.project_id AND projects.user_id = auth.uid()
  ));

-- Similar policies for other tables
-- Design preferences
CREATE POLICY "Users can view design preferences for their projects" 
  ON public.design_preferences FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = design_preferences.project_id AND projects.user_id = auth.uid()
  ));

-- Selected products
CREATE POLICY "Users can view selected products for their projects" 
  ON public.selected_products FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.rooms 
    JOIN public.projects ON rooms.project_id = projects.id
    WHERE rooms.id = selected_products.room_id AND projects.user_id = auth.uid()
  ));

-- Labor costs
CREATE POLICY "Users can view labor costs for their projects" 
  ON public.labor_costs FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.rooms 
    JOIN public.projects ON rooms.project_id = projects.id
    WHERE rooms.id = labor_costs.room_id AND projects.user_id = auth.uid()
  ));

-- Conversation history
CREATE POLICY "Users can view conversation history for their projects" 
  ON public.conversation_history FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = conversation_history.project_id AND projects.user_id = auth.uid()
  ));

-- Project photos
CREATE POLICY "Users can view photos for their projects" 
  ON public.project_photos FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = project_photos.project_id AND projects.user_id = auth.uid()
  ));

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labor_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.design_preferences
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.selected_products
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.labor_costs
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
