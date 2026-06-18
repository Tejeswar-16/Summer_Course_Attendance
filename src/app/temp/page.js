'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileSpreadsheet, 
  Download, 
  Loader2, 
  Search, 
  AlertCircle, 
  CheckSquare, 
  Award,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { generateCertificatePDF } from '@/lib/generateCertificate';

export default function TempPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [downloadingUid, setDownloadingUid] = useState(null);

  // Fetch and parse CSV file content from the public folder
  const loadCSV = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/students.csv?' + Date.now()); // cache bust
      if (!response.ok) {
        throw new Error(
          `Could not load /students.csv (Status: ${response.status}). ` +
          `Please ensure you have placed a file named "students.csv" in your project's "public/" directory.`
        );
      }
      const text = await response.text();
      const parsedData = parseCSV(text);
      if (parsedData.length === 0) {
        throw new Error('No student records found in "students.csv".');
      }
      setStudents(parsedData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to parse CSV file. Ensure it contains "name" and "district" columns.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCSV();
  }, []);

  // CSV Parsing helper (handles quotes)
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Parse header row
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    const nameIndex = headers.indexOf('name');
    const districtIndex = headers.indexOf('district');

    if (nameIndex === -1 || districtIndex === -1) {
      throw new Error('CSV headers must contain "name" and "district" columns.');
    }

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = [];
      let current = '';
      let inQuotes = false;
      for (let charIndex = 0; charIndex < line.length; charIndex++) {
        const char = line[charIndex];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));

      if (values.length > Math.max(nameIndex, districtIndex)) {
        const studentName = values[nameIndex].trim();
        const studentDistrict = values[districtIndex].trim();

        if (studentName) {
          result.push({
            id: `${i}_${Date.now()}`,
            name: studentName,
            district: studentDistrict
          });
        }
      }
    }
    return result;
  };

  // Download handler for a specific student row
  const handleDownload = async (student) => {
    setDownloadingUid(student.id);
    try {
      const name     = student.name;
      const district = student.district || '';
      await generateCertificatePDF(name, district);
    } catch (err) {
      console.error(err);
      alert('Error generating certificate PDF. Ensure the template public/certificate_template.jpg is present.');
    } finally {
      setDownloadingUid(null);
    }
  };

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pb-12">
      {/* Top Banner Navigation */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-zinc-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white glow-primary border border-indigo-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-zinc-100 text-lg tracking-tight">Sri Sathya Sai Summer Course</span>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 text-xs font-bold transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Main
        </Link>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-6 animate-fade-in">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-100 tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-500" />Certificate Issuance
            </h1>
          </div>
          {students.length > 0 && (
            <button
              onClick={loadCSV}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Reload CSV
            </button>
          )}
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <span className="text-zinc-500 text-sm font-semibold">Loading students.csv...</span>
          </div>
        )}

        {/* Error Notification */}
        {error && !loading && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-xl text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Header Status */}
        {students.length > 0 && !loading && (
          <div className="glass-panel rounded-2xl p-5 border border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Loaded Dataset</span>
                <h2 className="text-sm font-bold text-zinc-100 mt-0.5">public/students.csv ({students.length} records parsed)</h2>
              </div>
            </div>
          </div>
        )}

        {/* Results Table Section */}
        {students.length > 0 && !loading && (
          <div className="glass-panel rounded-2xl p-6 flex flex-col gap-5 border border-zinc-200/80 animate-fade-in delay-100">
            {/* Search Tool */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
              <h2 className="text-base font-extrabold text-zinc-100">Student List</h2>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by name or district..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-black text-sm focus:outline-none focus:border-indigo-500 placeholder-zinc-400 font-medium shadow-inner"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden border border-zinc-200 rounded-xl bg-white/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 text-white">Student Name</th>
                    <th className="p-4 text-white">District</th>
                    <th className="p-4 text-white text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-10 text-center text-zinc-400 text-sm font-medium">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isRowDownloading = downloadingUid === student.id;
                      return (
                        <tr 
                          key={student.id} 
                          className="hover:bg-zinc-50/50 transition duration-150"
                        >
                          <td className="p-4">
                            <span className="font-bold text-black-800 text-sm">{student.name}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-zinc-500 text-xs font-semibold">{student.district || '—'}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDownload(student)}
                              disabled={downloadingUid !== null}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-650 text-white font-extrabold text-xs border border-indigo-450 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              {isRowDownloading ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                              ) : (
                                <><Download className="w-3.5 h-3.5" /> Download Certificate</>
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
