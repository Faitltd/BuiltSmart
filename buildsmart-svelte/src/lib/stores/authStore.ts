import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

// Create stores
export const user = writable<User | null>(null);
export const session = writable<Session | null>(null);
export const loading = writable<boolean>(true);

// Initialize auth state
export async function initAuth() {
  loading.set(true);
  
  // Get initial session
  const { data } = await supabase.auth.getSession();
  session.set(data.session);
  user.set(data.session?.user || null);
  
  // Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.set(newSession);
    user.set(newSession?.user || null);
    loading.set(false);
  });
  
  loading.set(false);
  
  return subscription;
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  loading.set(true);
  
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  } catch (error) {
    return { error: error as Error };
  } finally {
    loading.set(false);
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string) {
  loading.set(true);
  
  try {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  } catch (error) {
    return { error: error as Error };
  } finally {
    loading.set(false);
  }
}

// Sign out
export async function signOut() {
  loading.set(true);
  
  try {
    await supabase.auth.signOut();
  } finally {
    loading.set(false);
  }
}
