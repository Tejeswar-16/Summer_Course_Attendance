'use client';

import { useState } from 'react';
import { Search, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function StudentList({
  students,
  attendanceMap,
  currentUser,
  onToggleAttendance,
  loadingUid,
  isFutureDate = false,
  gateOpen = false
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Helper to generate consistent colors based on name length
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

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 animate-fade-in delay-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Registered Students</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Showing {filteredStudents.length} of {students.length} students enrolled.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-zinc-500 font-medium"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="overflow-hidden border border-zinc-800/60 rounded-xl bg-zinc-950/20">
        {filteredStudents.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm font-medium">
            No students found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredStudents.map((student) => {
              const isSelf = currentUser && student.uid === currentUser.uid;
              const isPresent = typeof attendanceMap[student.uid] === 'object' ? !!attendanceMap[student.uid]?.isPresent : !!attendanceMap[student.uid];
              const isLoading = loadingUid === student.uid;
              
              return (
                <div
                  key={student.uid}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 gap-4 transition-all duration-300 ${
                    isSelf 
                      ? 'bg-indigo-500/5 border-l-2 border-indigo-500' 
                      : 'hover:bg-zinc-900/20'
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold border shrink-0 ${getAvatarBg(student.name)}`}>
                      {getInitials(student.name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-100 text-base">{student.name}</span>
                        {isSelf && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 block mt-0.5">{student.email}</span>
                    </div>
                  </div>

                  {/* Right: Toggle (Self) or Badge (Others) */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 pr-2">
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 bg-zinc-800/40 px-2.5 py-1 rounded-lg border border-zinc-800/60">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </div>

                    {/* Attendance Action Button / Toggle */}
                    {isSelf ? (
                      <div className="flex items-center gap-2">
                        {isLoading ? (
                          <div className="w-12 h-6 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          </div>
                        ) : !gateOpen ? (
                          // Gate is closed — locked toggle with tooltip
                          <div className="relative group cursor-not-allowed">
                            <label className="relative inline-flex items-center opacity-40 pointer-events-none">
                              <input
                                type="checkbox"
                                checked={isPresent}
                                disabled
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-5 after:w-5 peer-checked:bg-zinc-700 border border-zinc-800"></div>
                            </label>
                            {/* Tooltip */}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-52 p-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl text-[10px] text-zinc-350 text-center leading-normal">
                              🔒 Attendance is closed. Wait for admin to open it.
                            </div>
                          </div>
                        ) : isFutureDate ? (
                          // Disabled Toggle for Self (Future Date)
                          <div className="relative group cursor-not-allowed">
                            <label className="relative inline-flex items-center opacity-40 pointer-events-none">
                              <input
                                type="checkbox"
                                checked={isPresent}
                                disabled
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-5 after:w-5 peer-checked:bg-zinc-700 border border-zinc-800"></div>
                            </label>
                            {/* Tooltip on Hover */}
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-48 p-2 bg-zinc-900 border border-zinc-850 rounded-lg shadow-xl text-[10px] text-zinc-350 text-center leading-normal">
                              Cannot mark attendance for future dates.
                            </div>
                          </div>
                        ) : (
                          // Interactive Toggle
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={() => onToggleAttendance(student.uid, isPresent)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 peer-checked:after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 border border-zinc-750 peer-checked:border-indigo-450 glow-primary transition-all"></div>
                          </label>
                        )}
                      </div>
                    ) : (
                      // Disabled Toggle for Others
                      <div className="relative group cursor-not-allowed">
                        <label className="relative inline-flex items-center opacity-40 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={isPresent}
                            disabled
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-850 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-500 after:rounded-full after:h-5 after:w-5 peer-checked:bg-zinc-700 border border-zinc-800"></div>
                        </label>
                        
                        {/* Tooltip on Hover */}
                        <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block z-20 w-48 p-2 bg-zinc-900 border border-zinc-850 rounded-lg shadow-xl text-[10px] text-zinc-300 text-center leading-normal">
                          Only {student.name.split(' ')[0]} can mark their own attendance.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
