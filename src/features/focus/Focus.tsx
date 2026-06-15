import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { formatTimerDisplay, formatDuration, cn } from '@/utils/helpers.ts';
import { Play, Pause, RotateCcw, SkipForward, Flame, Timer, Brain } from 'lucide-react';

type TimerMode = 'focus' | 'break' | 'longBreak';
const MODE_LABELS: Record<TimerMode, string> = { focus: 'Focus', break: 'Break', longBreak: 'Long Break' };
const MODE_COLORS: Record<TimerMode, string> = { focus: '#6366f1', break: '#10b981', longBreak: '#06b6d4' };

export function Focus() {
  const { addSession, getTodayFocusMinutes, getWeeklyFocusMinutes, sessions } = useFocusStore();
  const subjects = useStudyStore((s) => s.subjects);
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showComplete, setShowComplete] = useState(false);

  const getDuration = useCallback(() => {
    switch (timerMode) {
      case 'focus':     return profile.pomodoroWork * 60;
      case 'break':     return profile.pomodoroBreak * 60;
      case 'longBreak': return profile.pomodoroLongBreak * 60;
    }
  }, [timerMode, profile]);

  const [timeLeft, setTimeLeft] = useState(getDuration());
  const [totalTime, setTotalTime] = useState(getDuration());
  const startTimeRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) { const d = getDuration(); setTimeLeft(d); setTotalTime(d); }
  }, [timerMode, profile, isRunning, getDuration]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setShowComplete(true);
    if (timerMode === 'focus') {
      const durationMins = Math.round(totalTime / 60);
      addSession({
        subjectId: selectedSubject,
        type: 'pomodoro',
        durationMinutes: durationMins,
        breakMinutes: profile.pomodoroBreak,
        startTime: startTimeRef.current || new Date().toISOString(),
        completed: true,
      });
      addXP(30, 'focus', `Completed ${durationMins}min focus session`);
      setPomodoroCount((c) => c + 1);
    }
    setTimeout(() => setShowComplete(false), 3000);
  }, [timerMode, totalTime, selectedSubject, addSession, addXP]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); handleTimerComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, handleTimerComplete]);

  const handleStart = () => { if (!isRunning) { if (timeLeft === totalTime) startTimeRef.current = new Date().toISOString(); setIsRunning(true); } };
  const handlePause = () => { clearInterval(intervalRef.current!); setIsRunning(false); };
  const handleReset = () => { clearInterval(intervalRef.current!); setIsRunning(false); const d = getDuration(); setTimeLeft(d); setTotalTime(d); };
  const handleSkip = () => {
    clearInterval(intervalRef.current!); setIsRunning(false);
    const next: TimerMode = timerMode === 'focus' ? (pomodoroCount > 0 && pomodoroCount % 4 === 0 ? 'longBreak' : 'break') : 'focus';
    setTimerMode(next);
  };

  const todayMin = useMemo(() => getTodayFocusMinutes(), [getTodayFocusMinutes, sessions]);
  const weekMin = useMemo(() => getWeeklyFocusMinutes(), [getWeeklyFocusMinutes, sessions]);
  const todaySessions = sessions.filter((s) => s.completed && s.startTime.startsWith(new Date().toISOString().slice(0, 10))).length;

  const size = 260;
  const strokeW = 14;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = circ * (1 - progress);
  const color = MODE_COLORS[timerMode];
  const dotAngle = (-90 + (1 - progress) * 360) * (Math.PI / 180);
  const dotX = size / 2 + radius * Math.cos(dotAngle);
  const dotY = size / 2 + radius * Math.sin(dotAngle);

  return (
    <div className="animate-fade-in flex flex-col" style={{ minHeight: 'calc(100dvh - 80px)', padding: '16px 16px 24px' }}>
      <div className="flex gap-1.5 mb-8 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
        {(['focus', 'break', 'longBreak'] as TimerMode[]).map((m) => (
          <button key={m} onClick={() => { if (!isRunning) setTimerMode(m); }}
            className={cn('flex-1 py-2.5 rounded-xl text-xs font-bold transition-all', timerMode === m ? 'text-white shadow-lg' : '')}
            style={timerMode === m ? { background: color, boxShadow: `0 4px 12px ${color}44` } : { color: 'var(--text-muted)' }}>
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {showComplete ? (
          <div className="session-complete">
            <div className="text-6xl">🎯</div>
            <p className="text-2xl font-black gradient-text">{timerMode === 'focus' ? 'Focus Complete!' : 'Break Done!'}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>+30 XP earned. Great work!</p>
          </div>
        ) : (
          <>
            <div className="focus-timer-ring" style={{ width: size, height: size }}>
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
                <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeW}
                  strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease', filter: `drop-shadow(0 0 10px ${color}88)` }} />
                <circle r={strokeW / 2 + 2} fill={color} cx={dotX} cy={dotY}
                  style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
              </svg>
              <div className="focus-timer-text">
                <p className="focus-time-value">{formatTimerDisplay(timeLeft)}</p>
                <p className="focus-time-label">{MODE_LABELS[timerMode]}</p>
                {isRunning && <p className="text-[9px] mt-1 animate-pulse" style={{ color, letterSpacing: '0.12em', textAlign: 'center' }}>● LIVE</p>}
              </div>
            </div>

            <div className="flex items-center gap-5 mt-10">
              <button onClick={handleReset} className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <RotateCcw size={20} />
              </button>
              <button onClick={isRunning ? handlePause : handleStart}
                className="w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 40px ${color}55` }}>
                {isRunning ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
              </button>
              <button onClick={handleSkip} className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <SkipForward size={20} />
              </button>
            </div>

            <div className="mt-6 w-full max-w-xs">
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={isRunning} className="modal-input text-center">
                <option value="">No subject selected</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="flex gap-2 mt-5">
              {[0,1,2,3].map((i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{ background: i < (pomodoroCount % 4) ? color : 'rgba(255,255,255,0.1)', transform: i < (pomodoroCount % 4) ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 mt-6">
        {[
          { label: 'Today', value: formatDuration(todayMin), icon: Timer, color: '#6366f1' },
          { label: 'Sessions', value: String(todaySessions), icon: Flame, color: '#f59e0b' },
          { label: 'This Week', value: formatDuration(weekMin), icon: Brain, color: '#10b981' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <div className="flex justify-center mb-1.5" style={{ color: s.color }}><s.icon className="w-4 h-4" /></div>
            <p className="font-extrabold" style={{ fontSize: 15, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</p>
            <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
