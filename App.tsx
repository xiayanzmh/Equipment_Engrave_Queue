import React, { useState } from 'react';
import { QueueProvider } from './contexts/QueueContext';
import { Layout } from './components/Layout';
import { CustomerInterface } from './components/CustomerInterface';
import { BackendInterface } from './components/BackendInterface';
import { Login } from './components/Login';

const App = () => {
  const [currentView, setCurrentView] = useState('customer'); // 'customer', 'login', 'backend'
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentView('backend');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('customer');
  };

  const handleChangeView = (view: string) => {
    if (view === 'backend' && !isLoggedIn) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <Login onLogin={handleLogin} onCancel={() => setCurrentView('customer')} />;
      case 'backend':
        return isLoggedIn ? <BackendInterface /> : <Login onLogin={handleLogin} onCancel={() => setCurrentView('customer')} />;
      case 'customer':
      default:
        return <CustomerInterface />;
    }
  };

  return (
    <QueueProvider>
      <Layout 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout}
        currentView={currentView}
        onChangeView={handleChangeView}
      >
        {renderContent()}
      </Layout>
    </QueueProvider>
  );
};

export default App;