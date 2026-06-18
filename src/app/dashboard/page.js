'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import StudentDashboard from '@/components/StudentDashboard';
import AdminDashboard from '@/components/AdminDashboard';
import { 
  db, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  getDoc,
  onSnapshot
} from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

// ─── Helper ───────────────────────────────────────────
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const GATE_DOC_ID = 'attendanceGate';
const CERT_DOC_ID = 'certificates';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const today = getTodayStr();

  // Admin can navigate dates; students are locked to today
  const [selectedDate, setSelectedDate] = useState(today);

  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [loadingUid, setLoadingUid] = useState(null);
  const [error, setError] = useState('');

  // ── Attendance Gate State ──
  const [gateOpen, setGateOpen]     = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);

  // ── Certificate Eligibility State ──
  const [certEligible, setCertEligible] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // ── Subscribe to gate state in real-time ──
  useEffect(() => {
    if (!user) return;
    const gateRef = doc(db, 'settings', GATE_DOC_ID);
    const unsub = onSnapshot(gateRef, (snap) => {
      if (snap.exists()) setGateOpen(!!snap.data()?.isOpen);
      else setGateOpen(false);
      setGateChecked(true);
    }, (err) => {
      console.error('Gate snapshot error:', err);
      setGateChecked(true);
    });
    return () => unsub();
  }, [user]);

  // ── Subscribe to certificate eligibility in real-time ──
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const certRef = doc(db, 'settings', CERT_DOC_ID);
    const unsub = onSnapshot(certRef, (snap) => {
      if (snap.exists()) {
        const eligibleUids = snap.data()?.eligibleUids || [];
        setCertEligible(eligibleUids.includes(user.uid));
      } else {
        setCertEligible(false);
      }
    }, (err) => {
      console.error('Certificate snapshot error:', err);
      setCertEligible(false);
    });
    return () => unsub();
  }, [user]);

  // ── Admin: Toggle gate open/closed ──
  const handleToggleGate = async () => {
    if (!user || user.role !== 'admin') return;
    setGateLoading(true);
    const newState = !gateOpen;
    try {
      const gateRef = doc(db, 'settings', GATE_DOC_ID);
      await setDoc(gateRef, {
        isOpen: newState,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });
      // gateOpen will auto-update via onSnapshot
    } catch (err) {
      console.error('Failed to toggle gate:', err);
      setError('Failed to update attendance gate. Check permissions.');
    } finally {
      setGateLoading(false);
    }
  };

  // Load all students and their attendance status for the selected date
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setDataLoading(true);
    setError('');
    
    try {
      // 1. Fetch all registered students
      const studentsQuery = query(collection(db, 'users'));
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsList = [];
      studentsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.role !== 'admin') { 
          studentsList.push({
            uid: docSnap.id,
            name: data.name || 'Anonymous Student',
            email: data.email || ''
          });
        }
      });

      // Sort students alphabetically by name
      studentsList.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(studentsList);

      // 2. Fetch attendance records for the selected date
      const attendanceQuery = query(
        collection(db, 'attendance_records'),
        where('date', '==', selectedDate)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      const newAttendanceMap = {};
      attendanceSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        if (data) {
          newAttendanceMap[data.uid] = {
            isPresent: !!data.isPresent,
            updatedAt: data.updatedAt
          };
        }
      });
      setAttendanceMap(newAttendanceMap);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch attendance data. Please try again.');
    } finally {
      setDataLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedDate, fetchData]);

  // Handle toggle attendance status (strictly enforced for self only)
  const handleToggleAttendance = async (uid, currentStatus) => {
    if (!user) return;

    // Security check: Verify user is modifying their own attendance
    if (uid !== user.uid) {
      setError('Security violation: You can only toggle your own attendance status.');
      return;
    }

    // Gate check: Attendance must be open
    if (!gateOpen) {
      setError('Attendance is currently closed by the admin.');
      return;
    }

    // Students can only mark for today
    if (selectedDate !== today) {
      setError('You can only mark attendance for today.');
      return;
    }

    setLoadingUid(uid);
    setError('');

    try {
      const recordId = `${uid}_${selectedDate}`;
      const docRef = doc(db, 'attendance_records', recordId);
      
      const updatedStatus = !currentStatus;
      
      await setDoc(docRef, {
        uid: uid,
        name: user.displayName || user.name || 'Anonymous Student',
        date: selectedDate,
        isPresent: updatedStatus,
        updatedAt: new Date().toISOString()
      });

      setAttendanceMap(prev => ({
        ...prev,
        [uid]: {
          isPresent: updatedStatus,
          updatedAt: new Date().toISOString()
        }
      }));

    } catch (err) {
      console.error('Error toggling attendance:', err);
      setError('Failed to update attendance. Please verify permissions.');
    } finally {
      setLoadingUid(null);
    }
  };

  const isFutureDate = selectedDate > today;

  // Main Auth loading state
  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <span className="text-zinc-400 text-sm font-semibold">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Route to the appropriate dashboard view based on user role
  if (user.role === 'admin') {
    return (
      <AdminDashboard
        user={user}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        students={students}
        attendanceMap={attendanceMap}
        dataLoading={dataLoading}
        error={error}
        setError={setError}
        gateOpen={gateOpen}
        gateLoading={gateLoading}
        onToggleGate={handleToggleGate}
      />
    );
  }

  return (
    <StudentDashboard
      user={user}
      selectedDate={today}
      setSelectedDate={() => {}}
      students={students}
      attendanceMap={attendanceMap}
      dataLoading={dataLoading}
      loadingUid={loadingUid}
      error={error}
      setError={setError}
      handleToggleAttendance={handleToggleAttendance}
      isFutureDate={false}
      gateOpen={gateOpen}
      gateChecked={gateChecked}
      certEligible={certEligible}
    />
  );
}
