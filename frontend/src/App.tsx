import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { store } from './store';
import type { AppDispatch } from './store';
import { fetchEstimate, setCurrentEstimate } from './store/slices/estimateSlice';
import { selectCurrentEstimate, selectEstimateLoading } from './store/slices/estimateSlice';
import { selectActiveTab, setActiveTab } from './store/slices/uiSlice';
import ConversationUI from './components/ConversationUI';
import SimpleChat from './components/SimpleChat';
import EstimateDisplay from './components/EstimateDisplay';
import ProductSelector from './components/ProductSelector';
import PhotoUploader from './components/PhotoUploader';
import CostDataPage from './components/CostDataPage';
import ModalManager from './components/ModalManager';
import FaitLogo from './components/FaitLogo';
import { ApolloProvider } from '@apollo/client';
import graphqlClient from './api/graphqlClient';
import { AuthProvider } from './contexts/AuthContext';
import Auth from './components/auth/Auth';
import { supabase } from './utils/supabaseClient';

// Mock data for demo purposes
const DEMO_ESTIMATE_ID = '1';

// Create a mock estimate for development
const createMockEstimate = () => {
  return {
    id: DEMO_ESTIMATE_ID,
    user_id: 'user123',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    rooms: [],
    conversation_history: [],
    photos: [],
    totals: {
      labor: 0,
      products: 0,
      tax: 0,
      grand_total: 0
    }
  };
};

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const estimate = useSelector(selectCurrentEstimate);
  const loading = useSelector(selectEstimateLoading);
  const activeTab = useSelector(selectActiveTab);

  useEffect(() => {
    // In a real app, we would get the estimate ID from the URL or user selection
    // For demo purposes, we'll use a hardcoded ID or create a mock estimate
    try {
      dispatch(fetchEstimate(DEMO_ESTIMATE_ID))
        .unwrap()
        .catch(error => {
          console.log('Error fetching estimate, creating mock estimate instead:', error);
          // If fetching fails, create a mock estimate
          const mockEstimate = createMockEstimate();
          console.log('Created mock estimate:', mockEstimate);
          dispatch(setCurrentEstimate(mockEstimate));
        });
    } catch (error) {
      console.error('Error in estimate fetch process:', error);
      // Fallback to mock estimate
      const mockEstimate = createMockEstimate();
      console.log('Created mock estimate (fallback):', mockEstimate);
      dispatch(setCurrentEstimate(mockEstimate));
    }
  }, [dispatch]);

  const handleTabChange = (tab: string) => {
    dispatch(setActiveTab(tab));
  };

  if (loading && !estimate) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading estimate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <FaitLogo className="text-2xl" />
            </div>
            <nav className="flex space-x-4">
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'conversation'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('conversation')}
              >
                Conversation
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'estimate'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('estimate')}
              >
                Estimate
              </button>
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'costData'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => handleTabChange('costData')}
              >
                Cost Data
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden min-h-[calc(100vh-10rem)]">
          {activeTab === 'conversation' && (
            <SimpleChat />
          )}

          {activeTab === 'estimate' && (
            <EstimateDisplay />
          )}

          {activeTab === 'costData' && (
            <CostDataPage />
          )}
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center justify-center">
            <FaitLogo className="text-lg mb-1" />
            <p className="text-center text-gray-500 text-sm mt-1">
              &copy; {new Date().getFullYear()} FAIT Home. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modal Manager */}
      <ModalManager />
    </div>
  );
}

function App() {
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Check for user session on component mount
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setShowAuth(false); // Hide auth modal when user signs in
    });

    // Listen for custom event to open auth modal
    const handleOpenAuthModal = () => {
      setShowAuth(true);
    };

    window.addEventListener('open-auth-modal', handleOpenAuthModal);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('open-auth-modal', handleOpenAuthModal);
    };
  }, []);

  return (
    <ApolloProvider client={graphqlClient}>
      <Provider store={store}>
        <AuthProvider>
          {showAuth ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-lg font-semibold">Sign In or Create Account</h2>
                  <button
                    onClick={() => setShowAuth(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <Auth onAuthSuccess={() => setShowAuth(false)} />
                </div>
              </div>
            </div>
          ) : null}
          <AppContent />
        </AuthProvider>
      </Provider>
    </ApolloProvider>
  );
}

export default App;
