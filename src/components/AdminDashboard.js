'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from './Navbar';
import CalendarSelector from './CalendarSelector';
import AttendanceStats from './AttendanceStats';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
  LockOpen,
  Lock,
  ShieldAlert
} from 'lucide-react';

export default function AdminDashboard({
  user,
  selectedDate,
  setSelectedDate,
  students,
  attendanceMap,
  dataLoading,
  error,
  setError,
  // Gate props
  gateOpen,
  gateLoading,
  onToggleGate
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'present', 'absent'

  // Calculate statistics
  const totalStudentsCount = students.length;
  
  const presentStudents = students.filter(student => {
    const record = attendanceMap[student.uid];
    if (typeof record === 'object') {
      return !!record?.isPresent;
    }
    return !!record;
  });
  
  const presentCount = presentStudents.length;
  const absentCount = totalStudentsCount - presentCount;

  // Filter students based on search term and status tab
  const filteredStudents = students.filter(student => {
    const record = attendanceMap[student.uid];
    const isPresent = typeof record === 'object' ? !!record?.isPresent : !!record;
    
    // Status Filter
    if (statusFilter === 'present' && !isPresent) return false;
    if (statusFilter === 'absent' && isPresent) return false;

    // Search filter
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
      
    return matchesSearch;
  });

  // Helper to get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Helper to generate avatar color
  const getAvatarBg = (name) => {
    const colors = [
      'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'bg-violet-500/20 text-violet-400 border-violet-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    ];
    if (!name) return colors[0];
    const index = name.length % colors.length;
    return colors[index];
  };

  // Helper to format check-in time
  const getCheckInTime = (uid) => {
    const record = attendanceMap[uid];
    if (record && typeof record === 'object' && record.updatedAt) {
      try {
        return new Date(record.updatedAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: true 
        });
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-12">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6">
        {/* Admin Header Banner */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-6 border border-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-40 pointer-events-none" />
          <div className="relative z-10">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/35">
              Admin Portal
            </span>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight mt-1.5">Roster &amp; Metrics</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Review and monitor student check-in compliance logs in real-time.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <Link
              href="/dashboard/reports"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-650 border border-indigo-450 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>View Roster Percentages</span>
            </Link>
            <div className="px-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 font-semibold uppercase tracking-wider">
              Role: <span className="text-indigo-400 font-bold">Administrator</span>
            </div>
          </div>
        </div>

        {/* ── Attendance Gate Control Panel ── */}
        <div className={`relative overflow-hidden rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-500 ${
          gateOpen 
            ? 'bg-emerald-500/5 border-emerald-500/25' 
            : 'bg-zinc-900/60 border-zinc-800/80'
        }`}>
          {/* Status glow pulse when open */}
          {gateOpen && (
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          )}

          <div className="flex items-center gap-4 relative z-10">
            {/* Animated status icon */}
            <div className={`p-3 rounded-xl border transition-all duration-500 ${
              gateOpen 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-500'
            }`}>
              {gateOpen 
                ? <LockOpen className="w-6 h-6" /> 
                : <Lock className="w-6 h-6" />
              }
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-100 tracking-tight">
                Attendance Gate
              </h2>
              <p className={`text-xs font-semibold mt-0.5 transition-all duration-500 ${
                gateOpen ? 'text-emerald-400' : 'text-zinc-500'
              }`}>
                {gateOpen 
                  ? '✅ Open — Students can mark their attendance right now.' 
                  : '🔒 Closed — Students cannot submit attendance until you open it.'
                }
              </p>
            </div>
          </div>

          {/* Toggle Gate Button */}
          <button
            onClick={onToggleGate}
            disabled={gateLoading}
            className={`relative z-10 flex items-center gap-2.5 px-5 py-3 rounded-xl font-extrabold text-sm border transition-all active:scale-95 cursor-pointer disabled:opacity-60 shadow-md ${
              gateOpen
                ? 'bg-rose-500/10 text-gray-800 border-rose-500/30 hover:bg-rose-500/20'
                : 'bg-emerald-500/15 text-gray-800 border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            {gateLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : gateOpen ? (
              <Lock className="w-4 h-4" />
            ) : (
              <LockOpen className="w-4 h-4" />
            )}
            {gateLoading 
              ? 'Updating...' 
              : gateOpen 
                ? 'Close Attendance' 
                : 'Open Attendance'
            }
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-fade-in shrink-0">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 flex justify-between items-center">
              <span>{error}</span>
              <button 
                onClick={() => setError('')} 
                className="text-xs font-bold hover:underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Date Selector */}
        <CalendarSelector 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate} 
        />

        {/* Loading overlay for data fetch */}
        {dataLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-zinc-400 text-sm font-medium">Querying attendance records...</span>
          </div>
        ) : (
          <>
            {/* Analytics Stats cards */}
            <AttendanceStats 
              totalStudents={totalStudentsCount} 
              presentCount={presentCount} 
              absentCount={absentCount} 
            />

            {/* Admin Student Table / List */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 animate-fade-in delay-300 border border-zinc-800/80">
              
              {/* Toolbar: Search, Filters & Tabs */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search students by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-500 font-medium"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-x-auto self-start xl:self-center shrink-0">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow'
                        : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    All ({totalStudentsCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('present')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      statusFilter === 'present'
                        ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'
                        : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> Present ({presentCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('absent')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                      statusFilter === 'absent'
                        ? 'bg-rose-500/10 text-rose-450 border border-rose-500/25'
                        : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> Absent ({absentCount})
                  </button>
                </div>
              </div>

              {/* Roster list */}
              <div className="overflow-hidden border border-zinc-800/60 rounded-xl bg-zinc-950/20">
                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm font-medium">
                    No students match the active filters.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-800/60">
                    {filteredStudents.map((student) => {
                      const record = attendanceMap[student.uid];
                      const isPresent = typeof record === 'object' ? !!record?.isPresent : !!record;
                      const checkInTime = getCheckInTime(student.uid);

                      return (
                        <div
                          key={student.uid}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4 hover:bg-zinc-900/10 transition-all duration-300"
                        >
                          {/* Student Details */}
                          <div className="flex items-center gap-3.5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${getAvatarBg(student.name)}`}>
                              {getInitials(student.name)}
                            </div>
                            <div>
                              <h3 className="font-bold text-zinc-100 text-base">{student.name}</h3>
                              <span className="text-xs text-zinc-450 block mt-0.5">{student.email}</span>
                            </div>
                          </div>

                          {/* Attendance Status */}
                          <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                            {/* Check-in Time */}
                            {isPresent && checkInTime && (
                              <div className="flex items-center gap-1 text-zinc-500 text-xs font-semibold mr-1 bg-zinc-900/40 border border-zinc-800/60 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" /> {checkInTime}
                              </div>
                            )}

                            {/* Status Pill */}
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-450 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/25 glow-success">
                                <CheckCircle2 className="w-4 h-4" /> Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-zinc-800/40 px-3 py-1.5 rounded-xl border border-zinc-800/80">
                                <XCircle className="w-4 h-4" /> Absent
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
