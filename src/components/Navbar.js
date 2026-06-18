'use client';

import { LogOut, User, CheckSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, signOutUser } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
      {/* Brand logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white glow-primary border border-indigo-400">
          <CheckSquare className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold text-zinc-100 text-lg tracking-tight">Sri Sathya Sai Summer Course</span>
          <span className="text-xs text-indigo-400 font-bold block -mt-1 uppercase tracking-widest">Attendance</span>
        </div>
      </div>

      {/* User Actions */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 border-r border-zinc-800 pr-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300 text-xs font-bold uppercase">
              {getInitials(user.displayName || user.name)}
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-zinc-200 block leading-none">
                {user.displayName || user.name || 'Student'}
              </span>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {user.email}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-zinc-350 hover:text-rose-400 bg-zinc-900/60 border border-zinc-800 hover:bg-rose-500/5 hover:border-rose-500/20 text-sm font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
}
