#!/usr/bin/env node

/**
 * Supabase Connection Test Script for BuildSmart
 * 
 * This script tests the connection to the Supabase database and verifies that
 * the required tables exist.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAnonKey && !supabaseServiceKey) {
  console.error('Error: Neither SUPABASE_ANON_KEY nor SUPABASE_SERVICE_ROLE_KEY environment variables are set.');
  console.error('Please set at least one of them before running this script:');
  console.error('export SUPABASE_ANON_KEY=your_anon_key');
  console.error('export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey
);

// Tables to check
const tables = [
  'projects',
  'rooms',
  'design_preferences',
  'selected_products',
  'labor_costs',
  'conversation_history',
  'project_photos'
];

// Test connection and check tables
async function testConnection() {
  console.log('Testing connection to Supabase...');
  
  try {
    // Test connection by getting the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error authenticating with Supabase:', authError);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('User:', user ? 'Authenticated' : 'Not authenticated');
    }
    
    // Check if tables exist
    console.log('\nChecking database tables...');
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`✓ Table '${table}' exists but is empty`);
        } else {
          console.error(`✗ Error checking table '${table}':`, error);
        }
      } else {
        console.log(`✓ Table '${table}' exists with ${data} rows`);
      }
    }
    
    console.log('\nDatabase check complete!');
    
  } catch (err) {
    console.error('Error testing connection:', err);
    process.exit(1);
  }
}

// Run the test
testConnection().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
