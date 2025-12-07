import React from 'react';
import { Ticket, LogOut, Settings } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Layout = ({ children, isLoggedIn, onLogout, currentView, onChangeView }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onChangeView('customer')}>
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-slate-900 tracking-tight">EngraveQueue Kiosk</span>
                    <span className="text-xs text-slate-500 font-medium">Management System v1.0</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <>
                  <button 
                    onClick={() => onChangeView('backend')}
                    className={`text-sm font-medium transition-colors ${currentView === 'backend' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Backend
                  </button>
                  <button 
                    onClick={() => onChangeView('customer')}
                    className={`text-sm font-medium transition-colors ${currentView === 'customer' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Customer View
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-2"></div>
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                currentView !== 'login' && (
                  <button
                    onClick={() => onChangeView('login')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Staff Access
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} EngraveQueue Kiosk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};