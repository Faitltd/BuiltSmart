import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import SignIn from './SignIn';
import SignUp from './SignUp';

type AuthProps = {
  onAuthSuccess?: () => void;
};

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Show success message and switch to sign-in view
      alert('Check your email for the confirmation link!');
      setView('sign-in');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-primary">BuildSmart by FAIT</h2>
        <p className="text-gray-600 mt-1">Your remodeling estimate assistant</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {view === 'sign-in' ? (
        <SignIn onSignIn={handleSignIn} loading={loading} onSwitchView={() => setView('sign-up')} />
      ) : (
        <SignUp onSignUp={handleSignUp} loading={loading} onSwitchView={() => setView('sign-in')} />
      )}
    </div>
  );
};

export default Auth;
