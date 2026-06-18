'use client';

import { Users, CheckCircle2, XCircle, Percent } from 'lucide-react';

export default function AttendanceStats({ totalStudents, presentCount, absentCount }) {
  const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const stats = [
    {
      title: 'Total Enrolled',
      value: totalStudents,
      icon: Users,
      colorClass: 'text-indigo-400',
      bgGlow: 'from-indigo-500/10 to-transparent',
      borderColor: 'border-indigo-500/20'
    },
    {
      title: 'Present Today',
      value: presentCount,
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
      bgGlow: 'from-emerald-500/10 to-transparent',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Absent / Unmarked',
      value: absentCount,
      icon: XCircle,
      colorClass: 'text-rose-400',
      bgGlow: 'from-rose-500/10 to-transparent',
      borderColor: 'border-rose-500/20'
    },
    {
      title: 'Attendance Rate',
      value: `${rate}%`,
      icon: Percent,
      colorClass: 'text-amber-400',
      bgGlow: 'from-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in delay-200">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={idx}
            className={`glass-panel relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between border ${stat.borderColor}`}
          >
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGlow} opacity-30`} />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
                {stat.title}
              </span>
              <div className={`p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 ${stat.colorClass}`}>
                <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            
            <div className="relative z-10 mt-2">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
                {stat.value}
              </h3>
              
              {/* Micro-visual indicator bar for Attendance Rate */}
              {stat.title === 'Attendance Rate' && (
                <div className="w-full bg-zinc-900/80 rounded-full h-1.5 mt-3 border border-zinc-800">
                  <div
                    className="bg-amber-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              )}
              {stat.title === 'Present Today' && (
                <div className="w-full bg-zinc-900/80 rounded-full h-1.5 mt-3 border border-zinc-800">
                  <div
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
