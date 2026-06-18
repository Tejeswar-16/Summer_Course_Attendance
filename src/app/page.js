'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, KeyRound, Mail, AlertCircle, Loader2, CheckSquare } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard immediately
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      // Clean up Firebase error messages for display
      const message = err.message || '';
      if (message.includes('auth/user-not-found') || message.includes('auth/invalid-credential')) {
        setError('Invalid email or password.');
      } else if (message.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (message.includes('auth/network-request-failed')) {
        setError('Network error. Check your connection.');
      } else {
        setError(message.replace(/^Error:\s*/, '') || 'Failed to sign in.');
      }
      setSubmitting(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-semibold">Loading Attendance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 relative min-h-screen">
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white glow-primary border border-indigo-400 mb-3.5">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-gray-100 tracking-tight">Sri Sathya Sai Summer Course Attendance</h1>
          <h1 className="text-2xl font-black text-blue-500 tracking-tight">Welcome Back</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Log in to manage and record your attendance.
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8 border border-zinc-800/80">
          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Action button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mt-2 rounded-xl bg-indigo-500 text-white font-bold text-sm tracking-wide border border-indigo-450 hover:bg-indigo-650 transition-all shadow-lg glow-primary active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-8 text-center border-t border-zinc-800/80 pt-6">
            <span className="text-zinc-450 text-xs font-semibold">
              Don't have an account?{' '}
            </span>
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-bold text-xs hover:underline transition-all"
            >
              Sign Up
            </Link>
          </div>
        </div>


      </div>
    </div>
  );
}
