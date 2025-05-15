'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

interface Analysis {
  id: string;
  created_at: string;
  job_type: string | null;
  confidence_score: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      // For testing purposes, we'll create a mock user
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      };

      setUser(mockUser);

      // For testing purposes, we'll create mock analyses
      const mockAnalyses = [
        {
          id: '1',
          created_at: new Date().toISOString(),
          job_type: 'Kitchen Remodel',
          confidence_score: 75
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          job_type: 'Bathroom Renovation',
          confidence_score: 82
        },
        {
          id: '3',
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          job_type: 'Roofing',
          confidence_score: 68
        }
      ];

      setAnalyses(mockAnalyses);
      setLoading(false);

      // In production, you would use the following code:
      /*
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      setUser(user);

      // Fetch user's analyses
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAnalyses(data);
      }

      setLoading(false);
      */
    };

    checkUser();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold text-blue-600">OfferShield</div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Dashboard</h1>
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Analysis
          </Link>
        </div>

        {analyses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No analyses yet</h2>
            <p className="text-gray-600 mb-6">
              Upload your first contractor quote to get started with OfferShield.
            </p>
            <Link
              href="/upload"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Quote
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {analysis.job_type || 'Quote Analysis'}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                      {analysis.confidence_score}% Confidence
                    </div>
                  </div>
                  <Link
                    href={`/results/${analysis.id}`}
                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
                  >
                    View Analysis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
