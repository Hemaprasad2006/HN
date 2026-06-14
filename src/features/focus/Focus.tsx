import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { formatTimerDisplay, formatDuration, cn } from '@/utils/helpers.ts';
import { Timer, Play, Pause, RotateCcw, SkipForward, Clock, Zap, Brain, Coffee } from 'lucide-react';

type TimerMode = 'focus' | 'break' | 'longBreak';

export function Focus() {
  const { addSession, getTodayFocusMinutes, getWeeklyFocusMinutes, sessions } = useFocusStore();
  const subjects = useStudyStore((s) => s.subjects);
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);

  const [mode, setMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(45);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');

  const getDuration = useCallback(() => {
    if (mode === 'custom') return customMinutes * 60;
    switch (timerMode) {
      case 'focus': return profile.pomodoroWork * 60;
      case 'break': return profile.pomodoroBreak * 60;
      case 'longBreak': return profile.pomodoroLongBreak * 60;
    }
  }, [mode, timerMode, customMinutes, profile]);

  const [timeLeft, setTimeLeft] = useState(getDuration());
  const [totalTime, setTotalTime] = useState(getDuration());
  const startTimeRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset timer when mode or timerMode changes
  useEffect(() => {
    if (!isRunning) {
      const d = getDuration();
      setTimeLeft(d);
      setTotalTime(d);
    }
  }, [mode, timerMode, customMinutes, profile, isRunning, getDuration]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    const durationMins = Math.round(totalTime / 60);

    if (timerMode === 'focus' || mode === 'custom') {
      addSession({
        type: mode === 'pomodoro' ? 'pomodoro' : 'custom',
        durationMinutes: durationMins,
        breakMinutes: mode === 'pomodoro' ? profile.pomodoroBreak : 0,
        subjectId: selectedSubject || undefined,
        topic: topic || undefined,
        startTime: startTimeRef.current,
        endTime: new Date().toISOString(),
        completed: true,
      });
      addXP(30, 'focus', `Completed ${durationMins}min focus session`);

      if (mode === 'pomodoro') {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        if (newCount % 4 === 0) {
          setTimerMode('longBreak');
        } else {
          setTimerMode('break');
        }
      }
    } else {
      // Break finished, switch back to focus
      setTimerMode('focus');
    }
    const d = getDuration();
    setTimeLeft(d);
    setTotalTime(d);
  };

  const handleStart = () => {
    if (!isRunning) {
      startTimeRef.current = new Date().toISOString();
      // If timer was reset, set total time
      if (timeLeft === totalTime) {
        const d = getDuration();
        setTimeLeft(d);
        setTotalTime(d);
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    const d = getDuration();
    setTimeLeft(d);
    setTotalTime(d);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (timerMode === 'break' || timerMode === 'longBreak') {
      setTimerMode('focus');
    }
    const d = getDuration();
    setTimeLeft(d);
    setTotalTime(d);
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const todayMins = getTodayFocusMinutes();
  const weekMins = getWeeklyFocusMinutes();
  const todaySessions = sessions.filter((s) => {
    const d = new Date(s.startTime);
    const today = new Date();
    return s.completed && d.toDateString() === today.toDateString();
  }).length;

  const modeLabel = timerMode === 'focus' ? 'Focus' : timerMode === 'break' ? 'Break' : 'Long Break';
  const modeColor = timerMode === 'focus' ? '#6366f1' : timerMode === 'break' ? '#10b981' : '#f59e0b';

  return (
    <div className={cn('animate-fade-in min-h-[80vh] flex flex-col', isRunning && 'focus-overlay rounded-2xl')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Timer className="w-8 h-8 text-indigo-400" /> Focus Mode
          </h1>
          <p className="text-gray-400 mt-1">Deep work, no distractions</p>
        </div>
        {/* Mode toggle */}
        <div className="flex gap-1 bg-slate-800/80 p-1 rounded-xl">
          <button onClick={() => { setMode('pomodoro'); setTimerMode('focus'); setIsRunning(false); }}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mode === 'pomodoro' ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white')}>
            Pomodoro
          </button>
          <button onClick={() => { setMode('custom'); setIsRunning(false); }}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mode === 'custom' ? 'gradient-primary text-white' : 'text-gray-400 hover:text-white')}>
            Custom
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative w-80 h-80 flex items-center justify-center mb-8">
          {/* SVG Ring */}
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="150" cy="150" r="140" fill="none" stroke={modeColor} strokeWidth="6"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000" />
          </svg>
          {/* Timer text */}
          <div className="text-center z-10">
            <p className="timer-display text-7xl font-bold tracking-tight" style={{ color: modeColor }}>
              {formatTimerDisplay(timeLeft)}
            </p>
            <p className="text-sm text-gray-400 mt-2 font-medium uppercase tracking-wider">{modeLabel}</p>
          </div>
        </div>

        {/* Pomodoro dots */}
        {mode === 'pomodoro' && (
          <div className="flex gap-2 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn('w-3 h-3 rounded-full transition-all',
                i < (pomodoroCount % 4) ? 'bg-indigo-400' : 'bg-slate-700')} />
            ))}
            <span className="text-xs text-gray-500 ml-2">{pomodoroCount} completed</span>
          </div>
        )}

        {/* Custom timer input */}
        {mode === 'custom' && !isRunning && (
          <div className="flex items-center gap-3 mb-6">
            <input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(Math.max(1, Number(e.target.value)))}
              className="w-20 px-3 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-center font-mono"
              min={1} max={120} />
            <span className="text-gray-400 text-sm">minutes</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleReset}
            className="p-3 rounded-xl bg-slate-800/80 border border-white/10 text-gray-400 hover:text-white hover:bg-slate-700 transition-all">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={handleStart}
            className="p-5 rounded-2xl gradient-primary text-white shadow-lg hover:opacity-90 transition-all hover:scale-105 animate-pulse-glow">
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
          </button>
          {(timerMode === 'break' || timerMode === 'longBreak') && (
            <button onClick={handleSkip}
              className="p-3 rounded-xl bg-slate-800/80 border border-white/10 text-gray-400 hover:text-white hover:bg-slate-700 transition-all">
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Session details */}
        {!isRunning && (
          <div className="flex gap-4 mb-8 flex-wrap justify-center">
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm">
              <option value="">No subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input value={topic} onChange={(e) => setTopic(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white text-sm placeholder-gray-500"
              placeholder="Topic (optional)" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Focus", value: formatDuration(todayMins), icon: <Clock className="w-5 h-5" />, color: 'text-indigo-400' },
          { label: 'This Week', value: formatDuration(weekMins), icon: <Zap className="w-5 h-5" />, color: 'text-emerald-400' },
          { label: 'Sessions Today', value: todaySessions, icon: <Brain className="w-5 h-5" />, color: 'text-violet-400' },
          { label: 'Pomodoros', value: pomodoroCount, icon: <Coffee className="w-5 h-5" />, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className={cn('flex justify-center mb-2', stat.color)}>{stat.icon}</div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
