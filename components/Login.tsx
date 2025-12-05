import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onCancel: () => void;
}

export const Login = ({ onLogin, onCancel }: LoginProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Hardcoded simple auth for demonstration as per original logic implies checking against something
    if (password === 'admin' || password === 'staff') {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Access</h2>
          <p className="text-slate-500 mt-2">Enter password to access backend</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="••••••••"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
                error ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-indigo-500'
              }`}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2">Incorrect password. Try 'admin'.</p>}
          </div>

          <div className="flex gap-4">
             <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Login
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
          Hint: Use 'admin' to log in
        </div>
      </div>
    </div>
  );
};