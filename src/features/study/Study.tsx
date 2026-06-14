import { useState, useEffect, useMemo } from 'react';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { subjectColors } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { formatDuration, cn } from '@/utils/helpers.ts';
import { format, subDays, differenceInMinutes, parseISO } from 'date-fns';
import {
  BookOpen, Plus, Clock, Brain, Star, Trash2, GraduationCap,
  Play, Pause, RotateCcw, Check, Minus
} from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Study() {
  const { subjects, sessions, addSubject, updateSubject, deleteSubject, addSession, deleteSession, getTotalHours } = useStudyStore();
  const addXP = useGameStore((s) => s.addXP);
  
  // Modals state
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);

  // Subject Form state
  const [sName, setSName] = useState('');
  const [sTotalChapters, setSTotalChapters] = useState(10);
  const [sCompletedChapters, setSCompletedChapters] = useState(0);
  const [sDifficulty, setSDifficulty] = useState(3);
  const [sNotes, setSNotes] = useState('');
  const [sColor, setSColor] = useState(subjectColors[0]);

  // Session Form state
  const [sesSubject, setSesSubject] = useState('');
  const [sesTopic, setSesTopic] = useState('');
  const [sesStart, setSesStart] = useState('');
  const [sesEnd, setSesEnd] = useState('');
  const [sesFocus, setSesFocus] = useState(7);
  const [sesProductivity, setSesProductivity] = useState(7);
  const [sesNotes, setSesNotes] = useState('');

  // Live Timer/Stopwatch state
  const [timerSubjectId, setTimerSubjectId] = useState('');
  const [timerTopic, setTimerTopic] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<string | null>(null);

  // Live Timer Ticking
  useEffect(() => {
    let interval: any = null;
    if (timerIsRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerIsRunning]);

  const startTimer = () => {
    if (!timerSubjectId) return;
    if (!timerIsRunning) {
      if (timerSeconds === 0) {
        setTimerStartTime(new Date().toISOString());
      }
      setTimerIsRunning(true);
    }
  };

  const pauseTimer = () => {
    setTimerIsRunning(false);
  };

  const resetTimer = () => {
    setTimerIsRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
  };

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].filter(Boolean).join(':');
  };

  const handleCompleteTimerSession = () => {
    if (timerSeconds < 60) {
      alert("Study session must be at least 1 minute long to log.");
      return;
    }
    setSesSubject(timerSubjectId);
    setSesTopic(timerTopic);
    const startIso = timerStartTime || subDays(new Date(), timerSeconds / 86400).toISOString();
    const endIso = new Date().toISOString();
    setSesStart(format(parseISO(startIso), "yyyy-MM-dd'T'HH:mm"));
    setSesEnd(format(parseISO(endIso), "yyyy-MM-dd'T'HH:mm"));
    setSesFocus(7);
    setSesProductivity(7);
    setSesNotes(`Stopwatch session: ${formatTimer(timerSeconds)}`);
    
    // Reset stopwatch fields
    setTimerIsRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    setTimerTopic('');
    
    setShowSessionModal(true);
  };

  // Subject quick progress update
  const incrementChapter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;
    if (sub.completedChapters < sub.totalChapters) {
      updateSubject(id, { completedChapters: sub.completedChapters + 1 });
      addXP(10, 'study', `Incremented progress for ${sub.name}`);
    }
  };

  const decrementChapter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const sub = subjects.find((s) => s.id === id);
    if (!sub) return;
    if (sub.completedChapters > 0) {
      updateSubject(id, { completedChapters: sub.completedChapters - 1 });
    }
  };

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

  const subjectData = useMemo(() => {
    return subjects.map((sub) => {
      const hours = sessions.filter((s) => s.subjectId === sub.id).reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
      return { name: sub.name, hours: Math.round(hours * 10) / 10, color: sub.color };
    }).filter((s) => s.hours > 0);
  }, [subjects, sessions]);

  const recentSessions = useMemo(() => [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [sessions]);

  return (
    <div className="animate-fade-in space-y-4 text-slate-100">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> Study
          </h1>
          <p className="text-responsive-xs text-gray-400 mt-0.5">Track learning progress and log study blocks</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { resetSubjectForm(); setShowSubjectModal(true); }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-gray-300 text-xs font-semibold hover:bg-slate-700 transition-all">
            <Plus className="w-3.5 h-3.5" /> Subject
          </button>
          <button onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all hover:scale-105">
            <Plus className="w-3.5 h-3.5" /> Log Manual
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Total Hours', value: `${Math.round(totalHoursAll * 10) / 10}h`, icon: <Clock className="w-4 h-4" />, color: 'text-indigo-400', glow: 'stat-glow-indigo' },
          { label: 'This Week', value: `${Math.round(weekHours * 10) / 10}h`, icon: <BookOpen className="w-4 h-4" />, color: 'text-emerald-400', glow: 'stat-glow-emerald' },
          { label: 'Avg Focus', value: `${avgFocus}/10`, icon: <Brain className="w-4 h-4" />, color: 'text-violet-400', glow: 'stat-glow-violet' },
          { label: 'Subjects', value: subjects.length, icon: <GraduationCap className="w-4 h-4" />, color: 'text-amber-400', glow: 'stat-glow-amber' },
        ].map((stat, i) => (
          <div key={i} className={cn('glass-card p-3 animate-slide-in-up', stat.glow)} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={cn('mb-1', stat.color)}>{stat.icon}</div>
            <p className="text-lg md:text-xl font-extrabold text-white">{stat.value}</p>
            <p className="text-responsive-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid: Left Side Subjects / Right Side Timer & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Subject Progress (Lg: 7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" /> Active Subjects
            </h3>
          </div>
          
          {subjects.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <GraduationCap className="w-8 h-8 mx-auto text-indigo-400/50 mb-2" />
              <p className="text-xs text-gray-400">Add your first subject to start tracking chapters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.map((sub) => (
                <div key={sub.id} 
                  className="glass-card p-3 hover:bg-white/[0.06] transition-all flex flex-col justify-between"
                  style={{ borderLeft: `3px solid ${sub.color}` }}>
                  <div>
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-xs md:text-sm font-semibold text-white truncate max-w-[80%]">{sub.name}</h4>
                      <div className="flex gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('w-2.5 h-2.5', s <= sub.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
                        ))}
                      </div>
                    </div>
                    
                    {sub.notes && (
                      <p className="text-responsive-xs text-gray-500 line-clamp-1 mb-2 italic">"{sub.notes}"</p>
                    )}
                  </div>

                  <div className="space-y-2 mt-2">
                    {/* Chapter Progress Indicator */}
                    <div className="flex items-center justify-between text-responsive-xs text-gray-400">
                      <span>Progress: <strong className="text-white">{sub.completedChapters}</strong> / {sub.totalChapters} Ch.</span>
                      <span>{sub.totalChapters > 0 ? Math.round((sub.completedChapters / sub.totalChapters) * 100) : 0}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" 
                        style={{ width: `${sub.totalChapters > 0 ? (sub.completedChapters / sub.totalChapters) * 100 : 0}%`, background: sub.color }} />
                    </div>

                    {/* Tap Actions & Edit */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={(e) => decrementChapter(e, sub.id)}
                          disabled={sub.completedChapters <= 0}
                          className="w-6 h-6 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors disabled:opacity-30">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => incrementChapter(e, sub.id)}
                          disabled={sub.completedChapters >= sub.totalChapters}
                          className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditSubject(sub.id)}
                          className="text-[10px] text-indigo-400 hover:underline">
                          Edit
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if (confirm(`Delete subject ${sub.name}?`)) deleteSubject(sub.id); }}
                          className="text-gray-500 hover:text-rose-400 p-0.5 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Live Timer & Recent Sessions (Lg: 5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Live Timer Widget */}
          <div className="glass-card p-3.5 border border-indigo-500/20 stat-glow-indigo">
            <h3 className="text-xs md:text-sm font-semibold text-white mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Study Session Timer
            </h3>
            
            {subjects.length === 0 ? (
              <p className="text-responsive-xs text-gray-400">Add a subject first to use the stopwatch timer.</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Subject</label>
                    <select 
                      value={timerSubjectId} 
                      onChange={(e) => { setTimerSubjectId(e.target.value); resetTimer(); }}
                      disabled={timerIsRunning}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white">
                      <option value="">Select Subject...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Topic (Optional)</label>
                    <input 
                      type="text" 
                      value={timerTopic} 
                      onChange={(e) => setTimerTopic(e.target.value)}
                      placeholder="e.g. Chapter 3, Quiz prep"
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-xs text-white" />
                  </div>
                </div>

                {/* Digital Counter */}
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Logged Duration</span>
                    <span className="text-2xl font-bold font-mono text-indigo-400 leading-none tracking-tight">
                      {formatTimer(timerSeconds)}
                    </span>
                  </div>
                  
                  {/* Control Buttons */}
                  <div className="flex items-center gap-1.5">
                    {!timerIsRunning ? (
                      <button 
                        onClick={startTimer}
                        disabled={!timerSubjectId}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-all">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button 
                        onClick={pauseTimer}
                        className="p-2 rounded-lg bg-amber-500 text-amber-400 hover:bg-amber-500 transition-all">
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button 
                      onClick={resetTimer}
                      disabled={timerSeconds === 0}
                      className="p-2 rounded-lg bg-slate-800 text-gray-400 hover:text-white transition-all disabled:opacity-40">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={handleCompleteTimerSession}
                      disabled={timerSeconds < 60}
                      title="Log this study block"
                      className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-30 transition-all">
                      <Check className="w-3 h-3" /> Log
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Study Sessions List */}
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-gray-300 mb-2.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Recent Sessions
            </h3>
            {recentSessions.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <Clock className="w-8 h-8 mx-auto text-indigo-400/50 mb-1.5" />
                <p className="text-responsive-xs text-gray-400">No sessions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.map((ses) => {
                  const sub = subjects.find((s) => s.id === ses.subjectId);
                  return (
                    <div key={ses.id} className="glass-card p-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-7 rounded-full shrink-0" style={{ background: sub?.color || '#6366f1' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {sub?.name || 'Unknown'} - {ses.topic || 'General'}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {format(parseISO(ses.startTime), 'MMM d, h:mm a')} · {formatDuration(ses.durationMinutes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-indigo-400 font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                          F:{ses.focusRating}
                        </span>
                        <button 
                          onClick={() => { if (confirm("Delete study session log?")) deleteSession(ses.id); }}
                          className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Chart */}
        <div className="glass-card p-4">
          <h3 className="text-xs md:text-sm font-semibold text-gray-300 mb-3">Weekly Study Hours</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        {subjectData.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="text-xs md:text-sm font-semibold text-gray-300 mb-3">Subject Breakdown</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subjectData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="hours" nameKey="name">
                    {subjectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Subject Modal */}
      <Modal isOpen={showSubjectModal} onClose={() => { setShowSubjectModal(false); resetSubjectForm(); }}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Subject Name</label>
            <input value={sName} onChange={(e) => setSName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder-gray-500"
              placeholder="e.g., Mathematics, Coding..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Total Chapters</label>
              <input type="number" value={sTotalChapters} onChange={(e) => setSTotalChapters(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs" min={1} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Chapters Completed</label>
              <input type="number" value={sCompletedChapters} onChange={(e) => setSCompletedChapters(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs" min={0} max={sTotalChapters} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Difficulty Level</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setSDifficulty(s)}>
                  <Star className={cn('w-5 h-5 transition-colors', s <= sDifficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Color Accent</label>
            <div className="flex gap-2 flex-wrap">
              {subjectColors.map((c) => (
                <button key={c} onClick={() => setSColor(c)}
                  className={cn('w-6 h-6 rounded-full transition-all border border-white/10', sColor === c && 'ring-2 ring-white scale-110')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Target</label>
            <textarea value={sNotes} onChange={(e) => setSNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-xs placeholder-gray-500 resize-none"
              placeholder="e.g. Pass final exam, read 2 hours a day" />
          </div>
          <button onClick={handleAddSubject}
            className="w-full py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all">
            {editingSubject ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </Modal>

      {/* Log Session Modal */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Log Study Session" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Subject</label>
            <select value={sesSubject} onChange={(e) => setSesSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs">
              <option value="">Select subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Topic Studied</label>
            <input value={sesTopic} onChange={(e) => setSesTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs placeholder-gray-500"
              placeholder="What did you study?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Start Time</label>
              <input type="datetime-local" value={sesStart} onChange={(e) => setSesStart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" value={sesEnd} onChange={(e) => setSesEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Focus Level: {sesFocus}/10</label>
              <input type="range" min={1} max={10} value={sesFocus} onChange={(e) => setSesFocus(Number(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Productivity: {sesProductivity}/10</label>
              <input type="range" min={1} max={10} value={sesProductivity} onChange={(e) => setSesProductivity(Number(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Summary</label>
            <textarea value={sesNotes} onChange={(e) => setSesNotes(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs placeholder-gray-500 resize-none" />
          </div>
          <button onClick={handleAddSession}
            className="w-full py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all">
            Log Session
          </button>
        </div>
      </Modal>
    </div>
  );
}
