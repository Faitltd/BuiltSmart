'use client';

import Link from 'next/link';
import AuthForm from '../components/AuthForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            OfferShield
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Account Access
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in or create an account to save your analyses and access premium features
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
