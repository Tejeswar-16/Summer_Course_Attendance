'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  db, 
  collection, 
  getDocs, 
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query, 
  where 
} from '@/lib/firebase';
import { 
  ArrowLeft, 
  Search, 
  Loader2, 
  AlertCircle, 
  FileText, 
  Percent, 
  CalendarRange,
  Download,
  Hash,
  Award,
  CheckCircle2,
  Send,
  Trash2,
  EyeOff
} from 'lucide-react';

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const getFormattedDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getFormattedDate(d);
  });
  const [endDate, setEndDate] = useState(() => getFormattedDate(new Date()));

  const [students, setStudents]       = useState([]);
  const [presentCounts, setPresentCounts] = useState({});
  const [studentMeta, setStudentMeta] = useState({});
  const [totalDays, setTotalDays]     = useState(0);

  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [minDaysFilter, setMinDaysFilter] = useState('');
  const [calcError, setCalcError]     = useState('');
  const [error, setError]             = useState('');

  // Certificate publish state
  const [publishing, setPublishing]   = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishedCertConfig, setPublishedCertConfig] = useState(null);
  const [unpublishing, setUnpublishing] = useState(false);

  // Subscribe to published certificates state in real-time
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const certRef = doc(db, 'settings', 'certificates');
    const unsub = onSnapshot(certRef, (snap) => {
      if (snap.exists()) {
        setPublishedCertConfig(snap.data());
      } else {
        setPublishedCertConfig(null);
      }
    }, (err) => {
      console.error('Error fetching published certificates:', err);
    });
    return () => unsub();
  }, [user]);

  // Auth Guard: Admins only
  useEffect(() => {
    if (!authLoading) {
      if (!user) router.push('/');
      else if (user.role !== 'admin') router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const generateReport = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    if (startDate > endDate) {
      setCalcError('End date must be after or equal to start date.');
      setTotalDays(0);
      setPresentCounts({});
      return;
    }

    setCalcError('');
    setDataLoading(true);
    setError('');
    setPublishSuccess(false);

    try {
      const start = new Date(startDate);
      const end   = new Date(endDate);
      const days  = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(days);

      // Fetch all non-admin students
      const studentsSnapshot = await getDocs(query(collection(db, 'users')));
      const studentsList = [];
      const meta = {};
      studentsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.role !== 'admin') {
          studentsList.push({ uid: docSnap.id, name: data.name || 'ANONYMOUS STUDENT', email: data.email || '' });
          meta[docSnap.id] = { samithi: data.samithi || '', district: data.district || '' };
        }
      });
      studentsList.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(studentsList);
      setStudentMeta(meta);

      // Fetch attendance records in range
      const rangeQuery = query(
        collection(db, 'attendance_records'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      const querySnapshot = await getDocs(rangeQuery);

      const counts = {};
      querySnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.uid && data.isPresent === true) {
          counts[data.uid] = (counts[data.uid] || 0) + 1;
        }
      });
      setPresentCounts(counts);
    } catch (err) {
      console.error('Error generating report:', err);
      setError('Failed to query database. Please verify permissions.');
    } finally {
      setDataLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (user && user.role === 'admin') generateReport();
  }, [user, startDate, endDate, generateReport]);

  // Build computed rows for all students
  const computedRows = students.map(student => {
    const presentDays = presentCounts[student.uid] || 0;
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 0;
    const meta = studentMeta[student.uid] || {};
    return {
      uid: student.uid,
      name: student.name,
      email: student.email,
      samithi: meta.samithi || '',
      district: meta.district || '',
      presentDays,
      rate
    };
  });

  // Apply filters
  const filteredRows = computedRows.filter(row => {
    const matchesSearch =
      row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.samithi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.district.toLowerCase().includes(searchTerm.toLowerCase());

    const minDays = parseInt(minDaysFilter, 10);
    const matchesDays = isNaN(minDays) || row.presentDays >= minDays;
    return matchesSearch && matchesDays;
  });

  // Color coding
  const getRateStatus = (rate) => {
    if (rate >= 75) return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', progressBg: 'bg-emerald-500' };
    if (rate >= 50) return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/25',   progressBg: 'bg-amber-400' };
    return              { bg: 'bg-rose-500/10 text-rose-400 border-rose-500/25',           progressBg: 'bg-rose-500' };
  };

  const getInitials = (name) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ['Name', 'Samithi', 'District', 'Days Present', 'Total Days', 'Attendance %'];
    const rows = filteredRows.map(r => [
      `"${r.name}"`, `"${r.samithi}"`, `"${r.district}"`,
      r.presentDays, totalDays, `${r.rate.toFixed(1)}%`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `attendance_report_${startDate}_to_${endDate}.csv`);
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const exportExcel = () => {
    const headers = ['Name', 'Samithi', 'District', 'Days Present', 'Total Days', 'Attendance %'];
    const tableRows = filteredRows.map(r =>
      `<tr><td>${r.name}</td><td>${r.samithi}</td><td>${r.district}</td><td>${r.presentDays}</td><td>${totalDays}</td><td>${r.rate.toFixed(1)}%</td></tr>`
    ).join('');
    const table = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const blob = new Blob([table], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    triggerDownload(blob, `attendance_report_${startDate}_to_${endDate}.xls`);
  };

  const triggerDownload = (blob, filename) => {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Publish Certificates ──────────────────────────────────────────────────
  // Saves the current filtered list to Firestore so students can download their certs
  const handlePublishCertificates = async () => {
    if (filteredRows.length === 0) return;
    setPublishing(true);
    setPublishSuccess(false);
    try {
      const eligibleStudents = filteredRows.map(r => ({
        uid:      r.uid,
        name:     r.name,
        district: r.district,
        samithi:  r.samithi,
        attendanceRate: r.rate,
        presentDays:    r.presentDays
      }));
      const eligibleUids = eligibleStudents.map(s => s.uid);

      await setDoc(doc(db, 'settings', 'certificates'), {
        eligibleUids,
        eligibleStudents,
        publishedAt:   new Date().toISOString(),
        publishedBy:   user.uid,
        dateRange:     { start: startDate, end: endDate },
        totalDays,
        minDaysFilter: parseInt(minDaysFilter, 10) || 0,
        studentCount:  eligibleStudents.length
      });
      setPublishSuccess(true);
    } catch (err) {
      console.error('Error publishing certificates:', err);
      setError('Failed to publish certificates. Please check Firestore permissions.');
    } finally {
      setPublishing(false);
    }
  };

  // ── Unpublish Certificates ────────────────────────────────────────────────
  // Deletes the certificates document from Firestore so students can no longer download
  const handleUnpublishCertificates = async () => {
    setUnpublishing(true);
    setPublishSuccess(false);
    setError('');
    try {
      await deleteDoc(doc(db, 'settings', 'certificates'));
    } catch (err) {
      console.error('Error unpublishing certificates:', err);
      setError('Failed to unpublish certificates. Please check Firestore permissions.');
    } finally {
      setUnpublishing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (authLoading || (user && user.role !== 'admin')) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-semibold">Authorizing access...</span>
        </div>
      </div>
    );
  }
  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col pb-12">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
                <FileText className="w-6 h-6 text-indigo-400" /> Attendance Reports
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Cumulative attendance rates &amp; certificate publishing.</p>
            </div>
          </div>
        </div>

        {/* Date Range Selectors */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Date Range</span>
              <h2 className="text-lg font-bold text-zinc-100 mt-0.5">
                {totalDays > 0 && !calcError ? `${totalDays} Day${totalDays > 1 ? 's' : ''} in Range` : 'Select valid range'}
              </h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1 max-w-xl">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 font-semibold" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 font-semibold" />
            </div>
          </div>
        </div>

        {/* Errors */}
        {(calcError || error) && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{calcError || error}</span>
          </div>
        )}

        {/* Loading */}
        {dataLoading && !calcError ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-zinc-400 text-sm font-medium">Computing attendance percentages...</span>
          </div>
        ) : !calcError ? (
          <>
            {/* Student Report Table */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-6 border border-zinc-800/80 animate-fade-in delay-100">

              {/* Toolbar */}
              <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100">Student Compliance Summary</h2>
                    <p className="text-xs text-zinc-450 mt-1">
                      {startDate} → {endDate} &nbsp;·&nbsp;
                      <span className="text-indigo-400 font-bold">{filteredRows.length} students shown</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={exportCSV} disabled={filteredRows.length === 0}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="text" placeholder="Search by name, samithi, district or email..."
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-zinc-500 font-medium" />
                  </div>
                  <div className="relative sm:w-64">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input type="number" min="0" max={totalDays}
                      placeholder={`Min. days attended (0–${totalDays})`}
                      value={minDaysFilter} onChange={e => setMinDaysFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 placeholder-zinc-500 font-medium" />
                  </div>
                </div>
              </div>

              {/* Row list */}
              <div className="overflow-hidden border border-zinc-800/60 rounded-xl bg-zinc-950/20">
                {filteredRows.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 text-sm font-medium">No students match the current filters.</div>
                ) : (
                  <div className="divide-y divide-zinc-800/60">
                    {filteredRows.map(row => {
                      const s = getRateStatus(row.rate);
                      return (
                        <div key={row.uid} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 gap-5 hover:bg-zinc-900/10 transition duration-300">
                          <div className="flex items-center gap-3.5 min-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-zinc-850 border border-zinc-750 flex items-center justify-center font-bold text-zinc-350 text-xs shrink-0">
                              {getInitials(row.name)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-zinc-200 text-sm leading-tight truncate">{row.name}</h3>
                              <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
                                {row.samithi && <span className="text-[10px] text-indigo-400 font-semibold">{row.samithi}</span>}
                                {row.samithi && row.district && <span className="text-zinc-700 text-[10px]">·</span>}
                                {row.district && <span className="text-[10px] text-zinc-450">{row.district}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 w-full flex flex-col gap-1.5 md:px-6">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500 font-semibold uppercase tracking-wider">Attendance</span>
                              <span className="text-zinc-300 font-bold">{row.presentDays} / {totalDays} day{totalDays !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="w-full bg-zinc-900/80 rounded-full h-2 border border-zinc-800">
                              <div className={`${s.progressBg} h-2 rounded-full transition-all duration-500`} style={{ width: `${row.rate}%` }} />
                            </div>
                          </div>
                          <div className="shrink-0 self-end md:self-center">
                            <span className={`inline-flex items-center gap-1 text-sm font-extrabold px-3.5 py-2 rounded-xl border ${s.bg}`}>
                              <Percent className="w-3.5 h-3.5" />{row.rate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Certificate Publishing Panel ── */}
            <div className={`rounded-2xl border p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 transition-all duration-500 animate-fade-in ${
              publishSuccess 
                ? 'bg-emerald-500/5 border-emerald-500/25' 
                : publishedCertConfig
                  ? 'bg-indigo-500/5 border-indigo-500/25'
                  : 'glass-panel border-amber-500/20 bg-amber-500/5'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border shrink-0 ${
                  publishSuccess 
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                    : publishedCertConfig
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                }`}>
                  {publishSuccess ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : publishedCertConfig ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Award className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-400 text-base">
                    {publishSuccess 
                      ? '✅ Certificates Published!' 
                      : publishedCertConfig 
                        ? '🟢 Certificates Currently Active' 
                        : '🎓 Publish Certificates'}
                  </h3>
                  {publishSuccess ? (
                    <p className="text-xs text-emerald-400 mt-1 font-semibold">
                      {filteredRows.length} student{filteredRows.length !== 1 ? 's' : ''} can now download their certificate from the student dashboard.
                    </p>
                  ) : publishedCertConfig ? (
                    <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      <p className="font-semibold text-zinc-300">
                        {publishedCertConfig.studentCount} student{publishedCertConfig.studentCount !== 1 ? 's' : ''} are currently authorized to download certificates.
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Active Filter Range: <span className="font-bold text-zinc-400">{publishedCertConfig.dateRange?.start}</span> to <span className="font-bold text-zinc-400">{publishedCertConfig.dateRange?.end}</span> (Min Days: <span className="font-bold text-zinc-400">{publishedCertConfig.minDaysFilter}</span>)
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      This will make certificates available for the <span className="font-bold text-amber-300">{filteredRows.length} student{filteredRows.length !== 1 ? 's' : ''}</span> in the current filtered list.
                      Each student will see a <strong>Download Certificate</strong> button on their dashboard.
                      <br/>
                      <span className="text-zinc-500">Note: Students can only download if their attendance matches current filters.</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {publishedCertConfig && (
                  <button
                    onClick={handleUnpublishCertificates}
                    disabled={unpublishing}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm border border-rose-500/30 bg-rose-500/10 text-rose-450 hover:bg-rose-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {unpublishing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Unpublishing...</>
                    ) : (
                      <><EyeOff className="w-4 h-4" /> Unpublish</>
                    )}
                  </button>
                )}

                <button
                  onClick={handlePublishCertificates}
                  disabled={publishing || filteredRows.length === 0}
                  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold text-sm border transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-md ${
                    publishSuccess
                      ? 'bg-green-500/15 text-black-300 border-green-500/30 hover:bg-green-500/25'
                      : publishedCertConfig
                        ? 'bg-green-500/15 text-black-300 border-green-500/30 hover:bg-green-500/25'
                        : 'bg-yellow-500/15 text-black-300 border-yellow-500/30 hover:bg-yellow-600/25'
                  }`}
                >
                  {publishing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                  ) : publishedCertConfig ? (
                    <><Send className="w-4 h-4" /> Re-publish / Update</>
                  ) : (
                    <><Send className="w-4 h-4" /> Publish Certificates</>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}