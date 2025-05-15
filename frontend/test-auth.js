// Simple script to test Supabase authentication
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ydisdyadjupyswcpbxzu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkaXNkeWFkanVweXN3Y3BieHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0MzM1ODcsImV4cCI6MjA1OTAwOTU4N30.u2hCWysJmyRyo4ZWBruDUSHAjzj9_Ibv81z7lPyx1JY';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test email and password
const testEmail = 'test@example.com';
const testPassword = 'password123';

async function testAuth() {
  console.log('Testing Supabase authentication...');

  try {
    // Sign up a test user
    console.log(`Signing up test user: ${testEmail}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError) {
      console.error('Error signing up:', signUpError);
    } else {
      console.log('Sign up successful!');
      console.log('User:', signUpData.user);
      console.log('Session:', signUpData.session);
    }

    // Sign in with the test user
    console.log(`\nSigning in test user: ${testEmail}`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
    } else {
      console.log('Sign in successful!');
      console.log('User:', signInData.user);
      console.log('Session:', signInData.session);
    }

    // Get the current session
    console.log('\nGetting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
    } else {
      console.log('Session:', sessionData.session);
    }

    // Sign out
    console.log('\nSigning out...');
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Error signing out:', signOutError);
    } else {
      console.log('Sign out successful!');
    }

    // Verify session is gone
    console.log('\nVerifying session is gone...');
    const { data: verifyData, error: verifyError } = await supabase.auth.getSession();

    if (verifyError) {
      console.error('Error verifying session:', verifyError);
    } else {
      console.log('Session:', verifyData.session);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testAuth();
