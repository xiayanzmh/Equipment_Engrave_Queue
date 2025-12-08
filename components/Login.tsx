
import React, { useState } from 'react';
import { Lock, LogIn, Mail, AlertCircle, Loader, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebaseConfig';

interface LoginProps {
  onLoginSuccess: () => void;
  onCancel: () => void;
}

export const Login = ({ onLoginSuccess, onCancel }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between Login and Sign Up

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Sign Up Logic
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      console.error("Auth failed", err);
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: any) => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (err: any) {
      console.error("Social login failed", err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (err: any) => {
    if (err.code === 'auth/email-already-in-use') {
      setError('That email is already registered. Please log in.');
    } else if (err.code === 'auth/weak-password') {
      setError('Password should be at least 6 characters.');
    } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      setError('Invalid email or password.');
    } else if (err.code === 'auth/too-many-requests') {
      setError('Too many failed attempts. Try again later.');
    } else if (err.code === 'auth/operation-not-allowed') {
      setError('This sign-in method is not enabled in Firebase Console.');
    } else {
      setError(err.message || 'Authentication failed. Please check your connection.');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isRegistering ? 'Create Staff Account' : 'Staff Portal Access'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isRegistering ? 'Register to manage the queue' : 'Use staff credentials to log in'}
          </p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
        )}

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleSocialLogin(googleProvider)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium text-slate-700">Google</span>
          </button>
          
          <button
            type="button"
            onClick={() => handleSocialLogin(appleProvider)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.02 4.12-.55 1.5.25 2.37 1.17 2.88 1.95-3.13 1.81-2.4 5.79.48 7.36-1.02 1.64-1.98 2.86-2.56 3.47zM12.03 5.44c.52-2.22 3.12-3.8 3.07-5.44-2.14.28-4.71 2.27-4.32 5.09.43.2.86.35 1.25.35z"/>
            </svg>
            <span className="text-sm font-medium">Apple</span>
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="staff@engravequeue.com"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
             <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                isRegistering ? (
                  <><UserPlus className="w-4 h-4" /> Sign Up</>
                ) : (
                  <><LogIn className="w-4 h-4" /> Login</>
                )
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
          >
            {isRegistering 
              ? "Already have an account? Log in" 
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
