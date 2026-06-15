import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { formatTimerDisplay, formatDuration } from '@/utils/helpers.ts';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

type TimerMode = 'focus' | 'break';

export function Focus() {
  const { addSession, getTodayFocusMinutes, sessions } = useFocusStore();
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const getDuration = useCallback(() => {
    switch (timerMode) {
      case 'focus': return profile.pomodoroWork * 60;
      case 'break': return profile.pomodoroBreak * 60;
    }
  }, [timerMode, profile]);

  const [timeLeft, setTimeLeft] = useState(getDuration());
  const [totalTime, setTotalTime] = useState(getDuration());
  const startTimeRef = useRef<string>('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) { 
      const d = getDuration(); 
      setTimeLeft(d); 
      setTotalTime(d); 
    }
  }, [timerMode, profile, isRunning, getDuration]);

  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    setShowComplete(true);
    if (timerMode === 'focus') {
      const durationMins = Math.round(totalTime / 60);
      addSession({
        type: 'pomodoro',
        durationMinutes: durationMins,
        breakMinutes: profile.pomodoroBreak,
        startTime: startTimeRef.current || new Date().toISOString(),
        completed: true,
      });
      addXP(30, 'focus', `Completed ${durationMins}min focus session`);
      setTimerMode('break');
    } else {
      setTimerMode('focus');
    }
    setTimeout(() => setShowComplete(false), 2000);
  }, [timerMode, totalTime, addSession, addXP, profile.pomodoroBreak]);

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
    return () => clearInterval(intervalRef.current!);
  }, [isRunning, handleTimerComplete]);

  const handleStart = () => { 
    if (!isRunning) { 
      if (timeLeft === totalTime) startTimeRef.current = new Date().toISOString(); 
      setIsRunning(true); 
    } 
  };
  const handlePause = () => { 
    clearInterval(intervalRef.current!); 
    setIsRunning(false); 
  };
  const handleReset = () => { 
    clearInterval(intervalRef.current!); 
    setIsRunning(false); 
    const d = getDuration(); 
    setTimeLeft(d); 
    setTotalTime(d); 
  };
  const handleSkip = () => {
    clearInterval(intervalRef.current!); 
    setIsRunning(false);
    setTimerMode(timerMode === 'focus' ? 'break' : 'focus');
  };

  const todayMin = useMemo(() => getTodayFocusMinutes(), [getTodayFocusMinutes, sessions]);

  const size = 280;
  const strokeW = 8;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = circ * (1 - progress);
  const color = timerMode === 'focus' ? '#8B5CF6' : '#22C55E';

  return (
    <div className="animate-fade-in flex flex-col items-center justify-between" style={{ minHeight: 'calc(100dvh - 48px)', padding: '32px 16px' }}>
      
      {/* Immersive Header */}
      <div className="text-center">
        <h1 className="text-page-title text-white font-extrabold">{timerMode === 'focus' ? 'Deep Focus' : 'Short Break'}</h1>
        <p className="text-secondary-text text-gray-400 mt-1">Silence distractions, center your mind</p>
      </div>

      {/* Center Timer Display */}
      <div className="flex-1 flex items-center justify-center my-8">
        {showComplete ? (
          <div className="text-center animate-celebration space-y-3">
            <span className="text-5xl">⚡</span>
            <h2 className="text-page-title text-[#22C55E] font-black">Session Logged</h2>
            <p className="text-secondary-text text-gray-400">+30 XP Earned</p>
          </div>
        ) : (
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth={strokeW} />
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeW}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
                className="transition-all duration-300"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            </svg>
            <div className="absolute text-center">
              <p className="text-display text-white text-5xl font-black">{formatTimerDisplay(timeLeft)}</p>
              <p className="text-label text-gray-400 uppercase tracking-widest mt-2">{timerMode}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls and Total Stats */}
      <div className="w-full flex flex-col items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={handleReset} 
            className="w-12 h-12 rounded-2xl bg-[#141B2D] border border-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform">
            <RotateCcw size={18} />
          </button>
          
          <button onClick={isRunning ? handlePause : handleStart}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl"
            style={{ background: color, boxShadow: `0 8px 32px ${color}33` }}>
            {isRunning ? (
              <Pause size={28} className="text-white" />
            ) : (
              <Play size={28} className="text-white ml-1 fill-current" />
            )}
          </button>

          <button onClick={handleSkip} 
            className="w-12 h-12 rounded-2xl bg-[#141B2D] border border-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Labeled Stat Card */}
        <div className="glass-card px-6 py-3 bg-[#141B2D]">
          <p className="text-label text-gray-500 uppercase tracking-wider text-center">Today's Focus Time</p>
          <p className="text-card-title text-white font-extrabold mt-0.5 text-center">{formatDuration(todayMin)}</p>
        </div>
      </div>

    </div>
  );
}
