'use client';

// For testing purposes, we're using a mock Supabase client
// In production, you would use the actual Supabase client:
// import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// export const supabase = createClientComponentClient();

// Mock Supabase client for testing
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null } }),
    getSession: async () => ({ data: { session: null } }),
    signUp: async () => ({ error: null }),
    signInWithPassword: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    })
  },
  from: () => ({
    select: () => ({
      order: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ error: null })
  })
};
