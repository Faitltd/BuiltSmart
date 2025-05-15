// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaXNkeWFkanVweXN3Y3BieHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI0MjI3MTAsImV4cCI6MjAyNzk5ODcxMH0.Yd-Yk_QZQrJ-ULfxaQHJvMc9RxZ-5RLzHzbzb9-YCWM';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');

  try {
    // Test connection by getting the current user
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Successfully connected to Supabase!');
      console.log('Session:', data.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('Error testing connection:', err);
  }
}

// Run the test
testConnection();
