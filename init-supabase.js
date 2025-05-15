#!/usr/bin/env node

/**
 * Supabase Initialization Script for BuildSmart
 * 
 * This script initializes the Supabase database with the required tables and policies.
 * It reads the schema.sql file and executes it against the Supabase database.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.');
  console.error('Please set it before running this script:');
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the schema.sql file
const schemaPath = path.join(__dirname, 'supabase', 'schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// Split the SQL into individual statements
const statements = schemaSql
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0);

// Execute each statement
async function executeStatements() {
  console.log('Initializing Supabase database...');
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      }
    } catch (err) {
      console.error(`Error executing statement ${i + 1}:`, err);
    }
  }
  
  console.log('Database initialization complete!');
}

// Execute the statements
executeStatements().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
