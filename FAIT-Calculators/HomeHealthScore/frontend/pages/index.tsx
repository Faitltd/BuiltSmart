import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import VoiceRecorder from '../components/VoiceRecorder';
import ResultsDisplay from '../components/ResultsDisplay';

interface AssessmentResult {
  health_score: number;
  summary: string;
  repairs: Array<{
    system: string;
    urgency: 'Urgent' | 'Soon' | 'Monitor';
    notes: string;
  }>;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseClient = useSupabaseClient();
  const user = useUser();

  // Poll for session status if we have a session ID
  useEffect(() => {
    if (!sessionId) return;

    const checkSessionStatus = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/${sessionId}`);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        setSessionStatus(data.session.status);

        if (data.session.status === 'completed' && data.result) {
          setResult({
            health_score: data.result.health_score,
            summary: data.result.summary,
            repairs: data.result.repairs
          });
          return true; // Stop polling
        } else if (data.session.status === 'failed') {
          setError('Processing failed. Please try again.');
          return true; // Stop polling
        }

        return false; // Continue polling
      } catch (err) {
        console.error('Error checking session status:', err);
        setError('Failed to check processing status. Please try again.');
        return true; // Stop polling on error
      } finally {
        setIsLoading(false);
      }
    };

    const pollInterval = setInterval(async () => {
      const shouldStop = await checkSessionStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, 3000);

    // Initial check
    checkSessionStatus();

    // Clean up
    return () => {
      clearInterval(pollInterval);
    };
  }, [sessionId]);

  const handleRecordingComplete = (newSessionId: string) => {
    setSessionId(newSessionId);
    setSessionStatus('processing');
    setResult(null);
    setError(null);
  };

  const handleReset = () => {
    setSessionId(null);
    setSessionStatus(null);
    setResult(null);
    setError(null);
  };

  // Handle user authentication
  const handleLogin = async () => {
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error logging in:', err);
      setError('Failed to log in. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!user ? (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Welcome to Home Health Score</h2>
            <p className="text-xl text-gray-600 mb-8">
              Have a quick chat with our AI about your home's condition—get your Home Health Score instantly.
            </p>
            <button
              onClick={handleLogin}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In to Get Started
            </button>
          </div>
        ) : !sessionId ? (
          <div className="max-w-2xl mx-auto">
            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
          </div>
        ) : result ? (
          <div>
            <ResultsDisplay result={result} />
            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Start New Assessment
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">
              {isLoading ? 'Checking status...' : 'Processing your recording...'}
            </h2>
            <p className="text-gray-600">
              {sessionStatus === 'processing'
                ? 'Our AI is analyzing your home description...'
                : 'Preparing your results...'}
            </p>
          </div>
        )}
    </div>
  );
}
