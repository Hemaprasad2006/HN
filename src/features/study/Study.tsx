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

  const pauseTimer = () => { setTimerIsRunning(false); };

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
      String(secs).padStart(2, '0'),
    ].filter(Boolean).join(':');
  };

  const handleCompleteTimerSession = () => {
    if (timerSeconds < 60) {
      alert('Study session must be at least 1 minute long to log.');
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
    setTimerIsRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    setTimerTopic('');
    setShowSessionModal(true);
  };

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
    <div className="study-page animate-fade-in space-y-3 md:space-y-4">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text flex items-center gap-2">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> Study
          </h1>
          <p className="study-subtitle">Track learning progress and log study blocks</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => { resetSubjectForm(); setShowSubjectModal(true); }}
            className="study-btn-secondary"
          >
            <Plus className="w-3 h-3" /> Subject
          </button>
          <button
            onClick={() => setShowSessionModal(true)}
            className="study-btn-primary"
          >
            <Plus className="w-3 h-3" /> Log Session
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: `${Math.round(totalHoursAll * 10) / 10}h`, icon: <Clock className="w-3.5 h-3.5" />, color: 'text-indigo-400', glow: 'stat-glow-indigo' },
          { label: 'Week', value: `${Math.round(weekHours * 10) / 10}h`, icon: <BookOpen className="w-3.5 h-3.5" />, color: 'text-emerald-400', glow: 'stat-glow-emerald' },
          { label: 'Focus', value: `${avgFocus}/10`, icon: <Brain className="w-3.5 h-3.5" />, color: 'text-violet-400', glow: 'stat-glow-violet' },
          { label: 'Subjects', value: subjects.length, icon: <GraduationCap className="w-3.5 h-3.5" />, color: 'text-amber-400', glow: 'stat-glow-amber' },
        ].map((stat, i) => (
          <div key={i} className={cn('glass-card p-2.5 md:p-3 animate-slide-in-up', stat.glow)} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={cn('mb-1', stat.color)}>{stat.icon}</div>
            <p className="study-stat-value">{stat.value}</p>
            <p className="study-stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">

        {/* Left: Subjects */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="study-section-title">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Active Subjects
            </h3>
          </div>

          {subjects.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <GraduationCap className="w-7 h-7 mx-auto text-indigo-400/50 mb-2" />
              <p className="study-empty-text">Add your first subject to start tracking chapters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {subjects.map((sub) => {
                const pct = sub.totalChapters > 0 ? Math.round((sub.completedChapters / sub.totalChapters) * 100) : 0;
                return (
                  <div
                    key={sub.id}
                    className="glass-card p-3 flex flex-col justify-between"
                    style={{ borderLeft: `3px solid ${sub.color}` }}
                  >
                    {/* Subject Header */}
                    <div className="flex items-start justify-between mb-1.5">
                      <h4 className="study-subject-name truncate max-w-[75%]">{sub.name}</h4>
                      <div className="flex gap-0.5 shrink-0 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn('w-2.5 h-2.5', s <= sub.difficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-600')} />
                        ))}
                      </div>
                    </div>

                    {sub.notes && (
                      <p className="study-note line-clamp-1 mb-1.5">"{sub.notes}"</p>
                    )}

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between study-progress-label">
                        <span>Ch. <strong style={{ color: sub.color }}>{sub.completedChapters}</strong> / {sub.totalChapters}</span>
                        <span style={{ color: sub.color }}>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden study-progress-track">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, background: sub.color }}
                        />
                      </div>

                      {/* Chapter Controls */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => decrementChapter(e, sub.id)}
                            disabled={sub.completedChapters <= 0}
                            className="study-ctrl-btn study-ctrl-dec"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => incrementChapter(e, sub.id)}
                            disabled={sub.completedChapters >= sub.totalChapters}
                            className="study-ctrl-btn study-ctrl-inc"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEditSubject(sub.id)} className="study-link-btn">Edit</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Delete subject ${sub.name}?`)) deleteSubject(sub.id); }}
                            className="study-delete-btn"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Timer + Recent Sessions */}
        <div className="lg:col-span-5 space-y-3">

          {/* Live Timer */}
          <div className="glass-card p-3 border border-indigo-500/20 stat-glow-indigo">
            <h3 className="study-section-title mb-2.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Session Timer
            </h3>

            {subjects.length === 0 ? (
              <p className="study-empty-text">Add a subject first to use the stopwatch timer.</p>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="study-label">Subject</label>
                    <select
                      value={timerSubjectId}
                      onChange={(e) => { setTimerSubjectId(e.target.value); resetTimer(); }}
                      disabled={timerIsRunning}
                      className="study-select"
                    >
                      <option value="">Select...</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="study-label">Topic (opt.)</label>
                    <input
                      type="text"
                      value={timerTopic}
                      onChange={(e) => setTimerTopic(e.target.value)}
                      placeholder="e.g. Ch. 3"
                      className="study-input"
                    />
                  </div>
                </div>

                {/* Timer Display */}
                <div className="study-timer-display">
                  <div>
                    <span className="study-timer-label">Duration</span>
                    <span className="study-timer-value">{formatTimer(timerSeconds)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!timerIsRunning ? (
                      <button onClick={startTimer} disabled={!timerSubjectId} className="study-timer-btn study-timer-play">
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={pauseTimer} className="study-timer-btn study-timer-pause">
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={resetTimer} disabled={timerSeconds === 0} className="study-timer-btn study-timer-reset">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleCompleteTimerSession}
                      disabled={timerSeconds < 60}
                      className="study-timer-btn study-timer-log"
                    >
                      <Check className="w-3 h-3" /> Log
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent Sessions */}
          <div>
            <h3 className="study-section-title mb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Recent Sessions
            </h3>
            {recentSessions.length === 0 ? (
              <div className="glass-card p-5 text-center">
                <Clock className="w-7 h-7 mx-auto text-indigo-400/50 mb-1.5" />
                <p className="study-empty-text">No sessions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.map((ses) => {
                  const sub = subjects.find((s) => s.id === ses.subjectId);
                  return (
                    <div key={ses.id} className="glass-card p-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1 h-6 rounded-full shrink-0" style={{ background: sub?.color || '#6366f1' }} />
                        <div className="min-w-0">
                          <p className="study-session-name truncate">
                            {sub?.name || 'Unknown'}{ses.topic ? ` — ${ses.topic}` : ''}
                          </p>
                          <p className="study-session-meta">
                            {format(parseISO(ses.startTime), 'MMM d, h:mm a')} · {formatDuration(ses.durationMinutes)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="study-focus-badge">F:{ses.focusRating}</span>
                        <button
                          onClick={() => { if (confirm('Delete study session log?')) deleteSession(ses.id); }}
                          className="study-delete-btn"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <div className="glass-card p-3 md:p-4">
          <h3 className="study-section-title mb-3">Weekly Study Hours</h3>
          <div className="h-36 md:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis dataKey="day" tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148, 163, 184, 0.7)', fontSize: 10 }} axisLine={false} tickLine={false} width={22} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {subjectData.length > 0 && (
          <div className="glass-card p-3 md:p-4">
            <h3 className="study-section-title mb-3">Subject Breakdown</h3>
            <div className="h-36 md:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={subjectData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="hours" nameKey="name">
                    {subjectData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Add/Edit Subject Modal ── */}
      <Modal isOpen={showSubjectModal} onClose={() => { setShowSubjectModal(false); resetSubjectForm(); }}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}>
        <div className="space-y-4">
          <div>
            <label className="modal-label">Subject Name</label>
            <input value={sName} onChange={(e) => setSName(e.target.value)}
              className="modal-input"
              placeholder="e.g., Mathematics, Coding..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="modal-label">Total Chapters</label>
              <input type="number" value={sTotalChapters} onChange={(e) => setSTotalChapters(Number(e.target.value))}
                className="modal-input" min={1} />
            </div>
            <div>
              <label className="modal-label">Chapters Done</label>
              <input type="number" value={sCompletedChapters} onChange={(e) => setSCompletedChapters(Number(e.target.value))}
                className="modal-input" min={0} max={sTotalChapters} />
            </div>
          </div>
          <div>
            <label className="modal-label mb-1.5">Difficulty Level</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setSDifficulty(s)}>
                  <Star className={cn('w-5 h-5 transition-colors', s <= sDifficulty ? 'text-amber-400 fill-amber-400' : 'text-gray-400')} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="modal-label mb-1.5">Color Accent</label>
            <div className="flex gap-2 flex-wrap">
              {subjectColors.map((c) => (
                <button key={c} onClick={() => setSColor(c)}
                  className={cn('w-6 h-6 rounded-full transition-all', sColor === c && 'ring-2 ring-indigo-400 scale-110')}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <label className="modal-label">Notes / Target</label>
            <textarea value={sNotes} onChange={(e) => setSNotes(e.target.value)} rows={2}
              className="modal-input resize-none"
              placeholder="e.g. Pass final exam, 2 hours a day" />
          </div>
          <button onClick={handleAddSubject}
            className="w-full py-2.5 rounded-xl gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all">
            {editingSubject ? 'Update Subject' : 'Add Subject'}
          </button>
        </div>
      </Modal>

      {/* ── Log Session Modal ── */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Log Study Session" size="lg">
        <div className="space-y-4">
          <div>
            <label className="modal-label">Subject</label>
            <select value={sesSubject} onChange={(e) => setSesSubject(e.target.value)} className="modal-input">
              <option value="">Select subject...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="modal-label">Topic Studied</label>
            <input value={sesTopic} onChange={(e) => setSesTopic(e.target.value)}
              className="modal-input" placeholder="What did you study?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="modal-label">Start Time</label>
              <input type="datetime-local" value={sesStart} onChange={(e) => setSesStart(e.target.value)} className="modal-input" />
            </div>
            <div>
              <label className="modal-label">End Time</label>
              <input type="datetime-local" value={sesEnd} onChange={(e) => setSesEnd(e.target.value)} className="modal-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="modal-label">Focus Level: {sesFocus}/10</label>
              <input type="range" min={1} max={10} value={sesFocus} onChange={(e) => setSesFocus(Number(e.target.value))}
                className="w-full accent-indigo-500" />
            </div>
            <div>
              <label className="modal-label">Productivity: {sesProductivity}/10</label>
              <input type="range" min={1} max={10} value={sesProductivity} onChange={(e) => setSesProductivity(Number(e.target.value))}
                className="w-full accent-violet-500" />
            </div>
          </div>
          <div>
            <label className="modal-label">Notes / Summary</label>
            <textarea value={sesNotes} onChange={(e) => setSesNotes(e.target.value)} rows={2}
              className="modal-input resize-none" placeholder="Optional notes..." />
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
