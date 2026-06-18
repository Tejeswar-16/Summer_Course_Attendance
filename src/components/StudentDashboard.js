'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import AttendanceStats from './AttendanceStats';
import StudentList from './StudentList';
import { Loader2, AlertCircle, Lock, CalendarCheck, Award, Download } from 'lucide-react';
import { generateCertificatePDF } from '@/lib/generateCertificate';

export default function StudentDashboard({
  user,
  selectedDate,
  setSelectedDate,
  students,
  attendanceMap,
  dataLoading,
  loadingUid,
  error,
  setError,
  handleToggleAttendance,
  isFutureDate,
  gateOpen,
  gateChecked,
  certEligible
}) {
  const [certDownloading, setCertDownloading] = useState(false);
  const [certError, setCertError]             = useState('');

  // Statistics
  const totalStudentsCount = students.length;
  const presentCount = Object.keys(attendanceMap).filter(
    uid => students.some(s => s.uid === uid) &&
      (typeof attendanceMap[uid] === 'object' ? !!attendanceMap[uid]?.isPresent : !!attendanceMap[uid]) === true
  ).length;
  const absentCount = totalStudentsCount - presentCount;

  // Today display
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Certificate download handler
  const handleDownloadCertificate = async () => {
    setCertDownloading(true);
    setCertError('');
    try {
      const name     = user?.name     || user?.displayName || 'STUDENT';
      const district = user?.district || '';
      await generateCertificatePDF(name, district);
    } catch (err) {
      console.error('Certificate error:', err);
      setCertError(
        err.message.includes('not found')
          ? 'Certificate template not found. Please contact admin.'
          : 'Failed to generate certificate. Please try again.'
      );
    } finally {
      setCertDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-12">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6">

        {/* Today's Date Banner */}
        <div className="glass-panel relative overflow-hidden rounded-2xl p-5 border border-zinc-800/80 flex items-center gap-4 animate-fade-in">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Today's Date</p>
            <h1 className="text-lg font-extrabold text-white mt-0.5">{formattedDate}</h1>
          </div>
        </div>

        {/* ── Certificate Download Card (shown only if eligible) ── */}
        {certEligible && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            {/* Background glow */}
            <div className="absolute right-0 top-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  🎓 Your Certificate is Ready!
                </h2>
                <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                  Certificate of Participation — issued for <span className="font-bold text-amber-200">{user?.name || user?.displayName}</span>
                  {user?.district ? <> from <span className="font-bold text-amber-200">{user.district}</span> district</> : ''}.
                </p>
                {certError && (
                  <p className="text-xs text-rose-400 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {certError}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleDownloadCertificate}
              disabled={certDownloading}
              className="relative z-10 flex items-center gap-2.5 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm border border-amber-400 transition-all active:scale-95 cursor-pointer disabled:opacity-60 shadow-lg shrink-0"
            >
              {certDownloading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                : <><Download className="w-4 h-4" /> Download Certificate</>
              }
            </button>
          </div>
        )}

        {/* Gate Status Banner */}
        {gateChecked && (
          <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border font-semibold text-sm transition-all duration-500 animate-fade-in ${
            gateOpen
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-500'
          }`}>
            {gateOpen
              ? <><span className="text-lg">✅</span><span>Attendance is <strong>open</strong>. You can mark your attendance below.</span></>
              : <><Lock className="w-4 h-4 shrink-0" /><span>Attendance is currently <strong>closed</strong> by the admin. Please wait for it to open.</span></>
            }
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-fade-in shrink-0">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-xs font-bold hover:underline ml-4 cursor-pointer">Dismiss</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {dataLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-zinc-400 text-sm font-medium">Syncing database records...</span>
          </div>
        ) : (
          <>
            <AttendanceStats
              totalStudents={totalStudentsCount}
              presentCount={presentCount}
              absentCount={absentCount}
            />
            <StudentList
              students={students}
              attendanceMap={attendanceMap}
              currentUser={user}
              onToggleAttendance={handleToggleAttendance}
              loadingUid={loadingUid}
              isFutureDate={isFutureDate}
              gateOpen={gateOpen}
            />
          </>
        )}
      </main>
    </div>
  );
}
