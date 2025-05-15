// Script to create tables in Supabase
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaXNkeWFkanVweXN3Y3BieHp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQzMzU4NywiZXhwIjoyMDU5MDA5NTg3fQ.96Ark16R_T-InjvpbelqLzgPLt_OswZFFr876pg-C5A';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL statements to create tables
const createProjectsTable = `
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
`;

const createRoomsTable = `
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
`;

const createDesignPreferencesTable = `
CREATE TABLE IF NOT EXISTS design_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  style TEXT,
  color_preferences JSONB,
  material_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
`;

const createSelectedProductsTable = `
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
`;

const createLaborCostsTable = `
CREATE TABLE IF NOT EXISTS labor_costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  trade_type TEXT NOT NULL,
  rate_per_sqft DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
`;

// Function to execute SQL
async function executeSql(sql, tableName) {
  console.log(`Creating ${tableName} table...`);

  try {
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error(`Error creating ${tableName} table:`, error);
      return false;
    }

    console.log(`${tableName} table created successfully!`);
    return true;
  } catch (err) {
    console.error(`Error creating ${tableName} table:`, err);
    return false;
  }
}

// Create tables
async function createTables() {
  console.log('Creating tables in Supabase...');

  // Create tables in order
  await executeSql(createProjectsTable, 'projects');
  await executeSql(createRoomsTable, 'rooms');
  await executeSql(createDesignPreferencesTable, 'design_preferences');
  await executeSql(createSelectedProductsTable, 'selected_products');
  await executeSql(createLaborCostsTable, 'labor_costs');

  console.log('Table creation complete!');
}

// Run the function
createTables();
