'use client';

import { Calendar, ChevronLeft, ChevronRight, Today } from 'lucide-react';

export default function CalendarSelector({ selectedDate, setSelectedDate }) {
  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatDate(date));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatDate(date));
  };

  const handleSetToday = () => {
    setSelectedDate(formatDate(new Date()));
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getFriendlyDate = () => {
    const todayStr = formatDate(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    if (selectedDate === todayStr) {
      return 'Today';
    } else if (selectedDate === yesterdayStr) {
      return 'Yesterday';
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(selectedDate).toLocaleDateString('en-US', options);
  };

  const todayStr = formatDate(new Date());
  const isTodayOrFuture = selectedDate >= todayStr;

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in delay-100">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Active Date</span>
          <h2 className="text-xl font-bold text-zinc-100 leading-tight">{getFriendlyDate()}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          className="p-2.5 rounded-xl border border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:text-white hover:bg-zinc-750 hover:border-zinc-650 transition-all active:scale-95"
          title="Previous Day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleSetToday}
          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
            selectedDate === todayStr
              ? 'bg-indigo-500 text-white border-indigo-450 shadow-md glow-primary'
              : 'border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:text-white hover:bg-zinc-750'
          }`}
        >
          Today
        </button>

        <button
          onClick={handleNextDay}
          disabled={isTodayOrFuture}
          className="p-2.5 rounded-xl border border-zinc-700/60 bg-zinc-800/40 text-zinc-300 hover:text-white hover:bg-zinc-750 hover:border-zinc-650 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
          title="Next Day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="relative ml-2 border-l border-zinc-800 pl-4">
          <input
            type="date"
            value={selectedDate}
            max={todayStr}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedDate(e.target.value);
              }
            }}
            className="px-3 py-2 rounded-xl border border-zinc-700/60 bg-zinc-900/60 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
          />
        </div>
      </div>
    </div>
  );
}
