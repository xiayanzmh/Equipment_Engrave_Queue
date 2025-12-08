import React, { useState } from 'react';
import { Mail, Lock, User, Loader, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { ADMIN_EMAIL } from '../constants';

export const AuthLanding = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'staff'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'staff') {
        // Staff Login - Password Only (using constant ADMIN_EMAIL)
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, password);
      } else if (activeTab === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user && fullName) {
            await updateProfile(userCredential.user, {
                displayName: fullName
            });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') setError('That email is already in use.');
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') setError('Invalid credentials.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
      setEmail('');
      setPassword('');
      setFullName('');
      setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FDFBF7] p-4 font-sans">
      
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-900 text-white rounded-2xl mb-6 shadow-xl">
             <span className="font-serif text-3xl italic">Eq</span>
        </div>
        <h1 className="font-serif text-4xl text-stone-900 mb-2">EngraveQueue</h1>
        <p className="text-stone-500 font-light text-lg">Workshop Management Portal</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden border border-stone-100">
        
        <div className="flex border-b border-stone-100 bg-stone-50/50">
            <button
                onClick={() => { setActiveTab('login'); clearForm(); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'login' 
                    ? 'border-stone-900 text-stone-900 bg-white' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
            >
                Login
            </button>
            <button
                onClick={() => { setActiveTab('register'); clearForm(); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'register' 
                    ? 'border-stone-900 text-stone-900 bg-white' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
            >
                Register
            </button>
            <button
                onClick={() => { setActiveTab('staff'); clearForm(); }}
                className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'staff' 
                    ? 'border-stone-900 text-stone-900 bg-white' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
            >
                Staff
            </button>
        </div>

        <div className="p-8">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-serif text-stone-900 mb-2">
                    {activeTab === 'login' && 'Welcome Back'}
                    {activeTab === 'register' && 'Create Account'}
                    {activeTab === 'staff' && 'Staff Portal'}
                </h2>
                <p className="text-sm text-stone-500">
                    {activeTab === 'login' && 'Sign in to check your status or add orders.'}
                    {activeTab === 'register' && 'Enter your details to start a new order.'}
                    {activeTab === 'staff' && 'Enter Master Password to access backend.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {activeTab === 'register' && (
                <div className="animate-fade-in-down">
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                    <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                    <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                        placeholder="e.g. Jane Doe"
                    />
                    </div>
                </div>
                )}

                {activeTab !== 'staff' && (
                    <div className="animate-fade-in">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                            <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                            placeholder="name@example.com"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-1.5 ml-1">
                        {activeTab === 'staff' ? 'Master Password' : 'Password'}
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                        <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        minLength={6}
                        />
                    </div>
                </div>

                {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
                    {error}
                </div>
                )}

                <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center gap-2 py-3.5 px-6 text-white rounded-xl font-medium text-lg focus:outline-none focus:ring-4 disabled:opacity-70 disabled:cursor-wait transition-all shadow-lg transform active:scale-[0.98] ${
                    activeTab === 'staff' 
                    ? 'bg-indigo-900 hover:bg-indigo-800 focus:ring-indigo-200 shadow-indigo-900/20' 
                    : 'bg-stone-900 hover:bg-stone-800 focus:ring-stone-200 shadow-stone-900/20'
                }`}
                >
                {isLoading ? (
                    <Loader className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                    {activeTab === 'login' && <><LogIn className="w-5 h-5" /> Log In</>}
                    {activeTab === 'register' && <><UserPlus className="w-5 h-5" /> Create Account</>}
                    {activeTab === 'staff' && <><ShieldCheck className="w-5 h-5" /> Access Backend</>}
                    </>
                )}
                </button>
            </form>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-stone-400 font-serif italic">
         Precision Engraving Services — Est. 2024
      </div>
    </div>
  );
};