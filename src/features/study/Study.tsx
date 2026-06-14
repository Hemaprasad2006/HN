import { useState, useMemo } from 'react';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { subjectColors } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { formatDuration, cn } from '@/utils/helpers.ts';
import { format, subDays, differenceInMinutes, parseISO } from 'date-fns';
import { BookOpen, Plus, Clock, Brain, Star, Trash2, GraduationCap } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Study() {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, addSession, deleteSession, getTotalHours } = useStudyStore();
  const addXP = useGameStore((s) => s.addXP);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

  // Subject form
  const [sName, setSName] = useState('');
  const [sTotalChapters, setSTotalChapters] = useState(10);
  const [sCompletedChapters, setSCompletedChapters] = useState(0);
  const [sDifficulty, setSDifficulty] = useState(3);
  const [sNotes, setSNotes] = useState('');
  const [sColor, setSColor] = useState(subjectColors[0]);

  // Session form
  const [sesSubject, setSesSubject] = useState('');
  const [sesTopic, setSesTopic] = useState('');
  const [sesStart, setSesStart] = useState('');
  const [sesEnd, setSesEnd] = useState('');
  const [sesFocus, setSesFocus] = useState(7);
  const [sesProductivity, setSesProductivity] = useState(7);
  const [sesNotes, setSesNotes] = useState('');

  const totalHoursAll = getTotalHours();
  const weekHours = getTotalHours(7);
  const avgFocus = useMemo(() => {
    if (sessions.length === 0) return 0;
    return Math.round(sessions.reduce((s, ses) => s + ses.focusRating, 0) / sessions.length * 10) / 10;
  }, [sessions]);

  const handleAddSubject = () => {
    if (!sName.trim()) return;
    if (editingSubject) {
      updateSubject(editingSubject, { name: sName, totalChapters: sTotalChapters, completedChapters: sCompletedChapters, difficulty: sDifficulty, notes: sNotes, color: sColor });
    } else {
      addSubject({ name: sName, totalChapters: sTotalChapters, completedChapters: sCompletedChapters, difficulty: sDifficulty, notes: sNotes, color: sColor });
    }
    resetSubjectForm();
    setShowSubjectModal(false);
  };

  const resetSubjectForm = () => {
    setSName(''); setSTotalChapters(10); setSCompletedChapters(0);
    setSDifficulty(3); setSNotes(''); setSColor(subjectColors[0]); setEditingSubject(null);
  };

  const handleEditSubject = (id: string) => {
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;
    setEditingSubject(id); setSName(sub.name); setSTotalChapters(sub.totalChapters);
    setSCompletedChapters(sub.completedChapters); setSDifficulty(sub.difficulty);
    setSNotes(sub.notes); setSColor(sub.color); setShowSubjectModal(true);
  };

  const handleAddSession = () => {
    if (!sesSubject || !sesStart || !sesEnd) return;
    const duration = differenceInMinutes(parseISO(sesEnd), parseISO(sesStart));
    if (duration <= 0) return;
    const sub = subjects.find((s) => s.id === sesSubject);
    addSession({
      subjectId: sesSubject, topic: sesTopic, startTime: sesStart, endTime: sesEnd,
      durationMinutes: duration, focusRating: sesFocus, productivityRating: sesProductivity, notes: sesNotes,
    });
    addXP(20, 'study', `Studied ${sub?.name || 'subject'} for ${formatDuration(duration)}`);
    setSesTopic(''); setSesStart(''); setSesEnd(''); setSesNotes('');
    setShowSessionModal(false);
  };

  // Weekly chart data
  const weeklyData = useMemo(() => {
    const data: { day: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const dayMins = sessions
        .filter((s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      data.push({ day: format(d, 'EEE'), hours: Math.round(dayMins / 60 * 10) / 10 });
    }
    return data;
  }, [sessions]);

  // Subject breakdown
  const subjectData = useMemo(() => {
    return subjects.map((sub) => {
      const hours = sessions.filter((s) => s.subjectId === sub.id).reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
      return { name: sub.name, hours: Math.round(hours * 10) / 10, color: sub.color };
    }).filter((s) => s.hours > 0);
  }, [subjects, sessions]);

  const recentSessions = useMemo(() => [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8), [sessions]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" /> Study Management
          </h1>
          <p className="text-gray-400 mt-1">Track your learning journey</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { resetSubjectForm(); setShowSubjectModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-gray-300 font-medium hover:bg-slate-700 transition-all">
            <Plus className="w-4 h-4" /> Subject
          </button>
          <button onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all hover:scale-105">
            <Plus className="w-5 h-5" /> Log Session
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Hours', value: `${Math.round(totalHoursAll * 10) / 10}h`, icon: <Clock className="w-5 h-5" />, color: 'text-indigo-400', glow: 'stat-glow-indigo' },
          { label: 'This Week', value: `${Math.round(weekHours * 10) / 10}h`, icon: <BookOpen className="w-5 h-5" />, color: 'text-emerald-400', glow: 'stat-glow-emerald' },
          { label: 'Avg Focus', value: `${avgFocus}/10`, icon: <Brain className="w-5 h-5" />, color: 'text-violet-400', glow: 'stat-glow-violet' },
          { label: 'Subjects', value: subjects.length, icon: <GraduationCap className="w-5 h-5" />, color: 'text-amber-400', glow: 'stat-glow-amber' },
        ].map((stat, i) => (
          <div key={i} className={cn('glass-card p-4 animate-slide-in-up', stat.glow)} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={cn('mb-2', stat.color)}>{stat.icon}</div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Subjects Panel */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Subjects</h3>
          {subjects.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-indigo-400/50 mb-3" />
              <p className="text-gray-400">Add your first subject to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div key={sub.id} className="glass-card p-4 cursor-pointer" onClick={() => handleEditSubject(sub.id)}
                  style={{ borderLeft: `3px solid ${sub.color}` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{sub.name}</h4>
                    <button onClick={(e) => { e.stopPropagation(); deleteSubject(sub.id); }}
                      className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span>{sub.completedChapters}/{sub.totalChapters} chapters</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn('w-3 h-3', s <= sub.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
                      ))}
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${sub.totalChapters > 0 ? (sub.completedChapters / sub.totalChapters) * 100 : 0}%`, background: sub.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Sessions</h3>
          {recentSessions.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Clock className="w-12 h-12 mx-auto text-indigo-400/50 mb-3" />
              <p className="text-gray-400">No study sessions logged yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((ses) => {
                const sub = subjects.find((s) => s.id === ses.subjectId);
                return (
                  <div key={ses.id} className="glass-card p-3 flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full" style={{ background: sub?.color || '#6366f1' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sub?.name || 'Unknown'} — {ses.topic || 'General'}</p>
                      <p className="text-xs text-gray-500">{format(parseISO(ses.startTime), 'MMM d, h:mm a')} · {formatDuration(ses.durationMinutes)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-indigo-400 font-medium">Focus: {ses.focusRating}/10</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Weekly Study Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
              <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {subjectData.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Subject Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={subjectData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="hours" nameKey="name" label={(entry: any) => `${entry.name}: ${entry.value}h`}>
                  {subjectData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <Modal isOpen={showSubjectModal} onClose={() => { setShowSubjectModal(false); resetSubjectForm(); }}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Subject Name</label>
            <input value={sName} onChange={(e) => setSName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500"
              placeholder="e.g., Mathematics, Programming..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Total Chapters</label>
              <input type="number" value={sTotalChapters} onChange={(e) => setSTotalChapters(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Completed</label>
              <input type="number" value={sCompletedChapters} onChange={(e) => setSCompletedChapters(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" min={0} max={sTotalChapters} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setSDifficulty(s)}>
                  <Star className={cn('w-6 h-6 transition-colors', s <= sDifficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
            <div className="flex gap-2">
              {subjectColors.map((c) => (
                <button key={c} onClick={() => setSColor(c)}
                  className={cn('w-7 h-7 rounded-full transition-all', sColor === c && 'ring-2 ring-white scale-110')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea value={sNotes} onChange={(e) => setSNotes(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none"
              placeholder="Any notes..." />
          </div>
          <button onClick={handleAddSubject}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all">
            {editingSubject ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </Modal>

      {/* Log Session Modal */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Log Study Session" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
            <select value={sesSubject} onChange={(e) => setSesSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white">
              <option value="">Select subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Topic Studied</label>
            <input value={sesTopic} onChange={(e) => setSesTopic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500"
              placeholder="What did you study?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
              <input type="datetime-local" value={sesStart} onChange={(e) => setSesStart(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" value={sesEnd} onChange={(e) => setSesEnd(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Focus Rating: {sesFocus}/10</label>
              <input type="range" min={1} max={10} value={sesFocus} onChange={(e) => setSesFocus(Number(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Productivity: {sesProductivity}/10</label>
              <input type="range" min={1} max={10} value={sesProductivity} onChange={(e) => setSesProductivity(Number(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea value={sesNotes} onChange={(e) => setSesNotes(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none" />
          </div>
          <button onClick={handleAddSession}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all">
            Log Session
          </button>
        </div>
      </Modal>
    </div>
  );
}
