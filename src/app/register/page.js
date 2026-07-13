'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, User, KeyRound, Mail, AlertCircle, Loader2, CheckSquare, MapPin, Building2, AlertTriangle } from 'lucide-react';

export default function RegisterPage() {
  const { user, loading, signUp } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [samithi, setSamithi] = useState('');
  const [district, setDistrict] = useState('');
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
    if (!name || !email || !password || !samithi || !district) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await signUp(email, password, name, samithi, district);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      const message = err.message || '';
      if (message.includes('auth/email-already-in-use')) {
        setError('Email already in use. Please use a different email or log in.');
      } else if (message.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (message.includes('auth/weak-password')) {
        setError('Password is too weak. Must be at least 6 characters.');
      } else {
        setError(message.replace(/^Error:\s*/, '') || 'Failed to register.');
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
          <h1 className="text-3xl font-black text-zinc-100 tracking-tight">Create Account</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Register as a student to log your attendance.
          </p>
        </div>

        {/* Signup Card */}
        <div className="glass-panel rounded-2xl p-8 border border-zinc-800/80">

          {/* ⚠️ Spelling Alert */}
          {/* <div className="flex items-start gap-3 p-4 mb-6 bg-yellow-500/10 border border-yellow-500/25 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-500/90 leading-relaxed">
              <span className="font-extrabold text-yellow-500 block mb-1">Please check your spellings carefully!</span>
              Your <span className="font-bold">Name</span>, <span className="font-bold">Samithi</span>, and <span className="font-bold">District</span> will be printed exactly as entered on your attendance certificates.
            </div>
          </div> */}

          {error && (
            <div className="flex items-start gap-2.5 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Samithi field */}
            <div className="space-y-1.5">
              <label htmlFor="samithi" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Samithi Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="samithi"
                  type="text"
                  placeholder="Enter your Samithi name"
                  value={samithi}
                  onChange={(e) => setSamithi(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* District field */}
            <div className="space-y-1.5">
              <label htmlFor="district" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                District
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="district"
                  type="text"
                  placeholder="Enter your District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={submitting}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Email field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
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
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  placeholder="•••••••• (Min. 6 characters)"
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
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center border-t border-zinc-800/80 pt-5">
            <span className="text-zinc-450 text-xs font-semibold">
              Already have an account?{' '}
            </span>
            <Link
              href="/"
              className="text-indigo-400 hover:text-indigo-300 font-bold text-xs hover:underline transition-all"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
