import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { CustomerInterface } from './components/CustomerInterface';
import { BackendInterface } from './components/BackendInterface';
import { Login } from './components/Login';
import { QueueProvider } from './contexts/QueueContext';
import { Toaster } from 'react-hot-toast';

function App() {
  const [currentView, setCurrentView] = useState('customer'); // 'customer' or 'backend'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // A simple mock login function
  const handleLogin = (password: string) => {
    // In a real app, you'd verify this against a backend
    if (password === 'password') { // Replace with a more secure check
      setIsLoggedIn(true);
      setCurrentView('backend'); // Default to backend view after login
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('customer'); // Revert to customer view on logout
  };

  return (
    <QueueProvider>
      <Toaster position="bottom-right" />
      <Layout 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        currentView={currentView}
        onChangeView={setCurrentView}
      >
        {!isLoggedIn ? (
          <div className="p-8">
            <Login onLogin={handleLogin} />
          </div>
        ) : currentView === 'customer' ? (
          <CustomerInterface />
        ) : (
          <BackendInterface />
        )}
      </Layout>
    </QueueProvider>
  );
}

export default App;
