import React, { useState, useEffect } from 'react';
import { QueueProvider } from './contexts/QueueContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { CustomerInterface } from './components/CustomerInterface';
import { BackendInterface } from './components/BackendInterface';
import { AuthLanding } from './components/AuthLanding';
import { ADMIN_EMAIL } from './constants';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState('customer'); 

  // Effect to automatically route based on role when user logs in
  useEffect(() => {
    if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
            setCurrentView('backend');
        } else {
            setCurrentView('customer');
        }
    }
  }, [currentUser]);

  // 1. Loading State
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="text-slate-500 text-sm font-medium">Loading session...</p>
            </div>
        </div>
    )
  }

  // 2. Unauthenticated State (The Landing Page)
  if (!currentUser) {
    return <AuthLanding />;
  }

  // 3. Authenticated States
  let content;
  
  // Security check: Only show backend if email matches admin
  if (currentView === 'backend' && currentUser.email === ADMIN_EMAIL) {
     content = <BackendInterface />;
  } else {
     // Default to customer interface for everyone else (or if admin switches view)
     content = <CustomerInterface />;
  }

  const handleChangeView = (view: string) => {
    // Prevent unauthorized view switching
    if (view === 'backend' && currentUser.email !== ADMIN_EMAIL) {
        console.warn("Unauthorized access attempt to backend");
        return;
    }
    setCurrentView(view);
  };

  return (
    <Layout 
      currentView={currentView}
      onChangeView={handleChangeView}
      isLoggedIn={!!currentUser}
    >
      {content}
    </Layout>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <QueueProvider>
        <AppContent />
      </QueueProvider>
    </AuthProvider>
  );
};

export default App;