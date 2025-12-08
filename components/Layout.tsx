import React from 'react';
import { Ticket, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ADMIN_EMAIL } from '../constants';

interface LayoutProps {
  children?: React.ReactNode;
  currentView: string;
  onChangeView: (view: string) => void;
  isLoggedIn: boolean;
}

export const Layout = ({ children, currentView, onChangeView }: LayoutProps) => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const isLanding = currentView === 'landing';
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center" onClick={() => !isLanding && onChangeView('customer')}>
              <div className={`flex-shrink-0 flex items-center gap-2 ${!isLanding ? 'cursor-pointer' : ''}`}>
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-slate-900 tracking-tight">EngraveQueue</span>
                    <span className="text-xs text-slate-500 font-medium">Customer Kiosk</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentUser && !isLanding && (
                <>
                  {isAdmin && (
                      <button 
                        onClick={() => onChangeView('backend')}
                        className={`text-sm font-medium transition-colors ${currentView === 'backend' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        Backend
                      </button>
                  )}
                  <button 
                    onClick={() => onChangeView('customer')}
                    className={`text-sm font-medium transition-colors ${currentView === 'customer' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    My Queue
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-2"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} EngraveQueue. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};