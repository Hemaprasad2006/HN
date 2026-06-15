import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusStore } from '@/stores/useFocusStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { formatTimerDisplay, formatDuration, getDateKey } from '@/utils/helpers.ts';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

type TimerMode = 'focus' | 'break';

export function Focus() {
  const { 
    addSession, 
    getTodayFocusMinutes, 
    sessions,
    isFocusRunning,
    setIsFocusRunning,
    focusTaskName,
    setFocusTaskName
  } = useFocusStore();
  
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);
  const tasks = usePlannerStore((s) => s.tasks);

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [showComplete, setShowComplete] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

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
    if (!isFocusRunning) { 
      const d = getDuration(); 
      setTimeLeft(d); 
      setTotalTime(d); 
    }
  }, [timerMode, profile, isFocusRunning, getDuration]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      setIsFocusRunning(false);
    };
  }, [setIsFocusRunning]);

  const startAmbientSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Brownian noise (soothing heavy rain/waterfall soundscape)
        output[i] = (lastOut + (0.025 * white)) / 1.025;
        lastOut = output[i];
        output[i] *= 3.8; 
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(ctx.destination);
      
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    } catch (err) {
      console.error('Failed to synthesize ambient sound:', err);
    }
  };

  const stopAmbientSound = () => {
    if (noiseSourceRef.current) {
      try { noiseSourceRef.current.stop(); } catch (e) {}
      noiseSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  };

  const handleAmbientToggle = () => {
    if (ambientSound) {
      stopAmbientSound();
      setAmbientSound(false);
    } else {
      startAmbientSound();
      setAmbientSound(true);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsFocusRunning(false);
    setShowComplete(true);
    stopAmbientSound();
    setAmbientSound(false);
    
    if (timerMode === 'focus') {
      const durationMins = Math.round(totalTime / 60);
      addSession({
        type: 'pomodoro',
        durationMinutes: durationMins,
        breakMinutes: profile.pomodoroBreak,
        startTime: startTimeRef.current || new Date().toISOString(),
        completed: true,
      });
      addXP(30, 'focus', `Focused for ${durationMins}m on: ${focusTaskName}`);
      setTimerMode('break');
    } else {
      setTimerMode('focus');
    }
    setTimeout(() => setShowComplete(false), 2200);
  }, [timerMode, totalTime, addSession, addXP, profile.pomodoroBreak, focusTaskName, setIsFocusRunning]);

  useEffect(() => {
    if (!isFocusRunning) return;
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
  }, [isFocusRunning, handleTimerComplete]);

  const handleStart = () => { 
    if (!isFocusRunning) { 
      if (timeLeft === totalTime) startTimeRef.current = new Date().toISOString(); 
      setIsFocusRunning(true); 
    } 
  };
  
  const handlePause = () => { 
    clearInterval(intervalRef.current!); 
    setIsFocusRunning(false); 
  };

  const handleReset = () => { 
    clearInterval(intervalRef.current!); 
    setIsFocusRunning(false); 
    stopAmbientSound();
    setAmbientSound(false);
    const d = getDuration(); 
    setTimeLeft(d); 
    setTotalTime(d); 
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current!); 
    setIsFocusRunning(false);
    stopAmbientSound();
    setAmbientSound(false);
    setTimerMode(timerMode === 'focus' ? 'break' : 'focus');
  };

  const todayMin = useMemo(() => getTodayFocusMinutes(), [getTodayFocusMinutes, sessions]);

  // Immersive layout sizing
  const size = 300;
  const strokeW = 6;
  const radius = (size - strokeW) / 2;
  const circ = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const dashOffset = circ * (1 - progress);
  const themeAccentColor = timerMode === 'focus' ? '#8B5CF6' : '#22C55E';

  return (
    <div className="flex flex-col items-center justify-between transition-all duration-700 w-full" 
      style={{ 
        minHeight: 'calc(100dvh - 48px)', 
        padding: '32px 16px',
        backgroundColor: isFocusRunning ? '#05070B' : '#090B14' 
      }}>
      
      {/* Top Header Section (Fades out when running) */}
      <div className={`text-center transition-all duration-500 w-full ${isFocusRunning ? 'opacity-0 pointer-events-none h-0 overflow-hidden my-0' : 'opacity-100 mb-4'}`}>
        <h1 className="text-page-title text-white font-extrabold">{timerMode === 'focus' ? 'Deep Focus' : 'Short Break'}</h1>
        <p className="text-secondary-text text-gray-400 mt-1">Silence notifications, master your attention</p>
      </div>

      {/* Center focus details when running */}
      {isFocusRunning && (
        <div className="text-center animate-fade-in space-y-1 mb-2">
          <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 fill-current" /> Active Focus Mode
          </span>
          <h2 className="text-card-title text-white font-extrabold truncate max-w-xs mx-auto">
            {focusTaskName}
          </h2>
        </div>
      )}

      {/* Large Circular Timer Area (occupies 70% of main screen area) */}
      <div className="flex-1 flex items-center justify-center my-6">
        {showComplete ? (
          <div className="text-center animate-pop-in space-y-3">
            <span className="text-6xl animate-bounce inline-block">🌲</span>
            <h2 className="text-page-title text-emerald-400 font-black">Session Logged</h2>
            <p className="text-secondary-text text-gray-400 font-medium">+30 XP Identity Growth</p>
          </div>
        ) : (
          <div className={`relative flex items-center justify-center rounded-full transition-transform duration-500 ${!isFocusRunning ? 'animate-breathe' : ''}`}
            style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth={strokeW} />
              <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={themeAccentColor} strokeWidth={strokeW}
                strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dashOffset}
                className="transition-all duration-300"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-display text-white text-5xl font-black font-mono tracking-tight">{formatTimerDisplay(timeLeft)}</span>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-3">{timerMode}</span>
            </div>
          </div>
        )}
      </div>

      {/* Task Selection and Settings (Hidden when running) */}
      <div className={`w-full max-w-sm transition-all duration-500 flex flex-col gap-4 ${isFocusRunning ? 'opacity-0 pointer-events-none h-0 overflow-hidden my-0' : 'opacity-100 my-4'}`}>
        <label className="block text-label font-bold text-gray-500 uppercase tracking-wider px-1">What are you mastering?</label>
        
        {todayTasks.length > 0 ? (
          <select 
            value={focusTaskName} 
            onChange={(e) => setFocusTaskName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white focus:outline-none focus:border-violet-500 transition-colors text-secondary-text font-bold">
            <option value="Deep Work" className="bg-[#121826]">Custom: Deep Work</option>
            {todayTasks.map((t) => (
              <option key={t.id} value={t.title} className="bg-[#121826]">{t.title}</option>
            ))}
          </select>
        ) : (
          <input 
            value={focusTaskName}
            onChange={(e) => setFocusTaskName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-secondary-text font-bold"
            placeholder="Enter study topic or work description..."
          />
        )}
      </div>

      {/* Controls & Ambient soundscapes */}
      <div className="w-full max-w-xs flex flex-col items-center gap-6">
        
        {/* Controls Layout */}
        <div className="flex items-center gap-6">
          
          {/* Reset / End Session */}
          <button onClick={handleReset} 
            className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10"
            aria-label="Reset timer">
            <RotateCcw size={18} />
          </button>
          
          {/* Play / Pause Toggle */}
          <button onClick={isFocusRunning ? handlePause : handleStart}
            className="w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl hover:brightness-105"
            style={{ 
              background: themeAccentColor, 
              boxShadow: `0 8px 32px ${themeAccentColor}30` 
            }}>
            {isFocusRunning ? (
              <Pause size={28} className="text-white" />
            ) : (
              <Play size={28} className="text-white ml-1 fill-current" />
            )}
          </button>

          {/* Skip Timer */}
          <button onClick={handleSkip} 
            className="w-12 h-12 rounded-[18px] bg-white/5 border border-white/5 text-gray-400 flex items-center justify-center active:scale-90 transition-transform hover:bg-white/10"
            aria-label="Skip session">
            <SkipForward size={18} />
          </button>
        </div>

        {/* Ambient Sounds and Today Stats */}
        <div className="flex items-center gap-4 w-full justify-center">
          
          {/* Rain Soundscape button */}
          <button onClick={handleAmbientToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-label uppercase font-extrabold tracking-wider transition-all active:scale-95 ${
              ambientSound 
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-400 shadow-md' 
                : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
            }`}>
            {ambientSound ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>Rain Soundscape</span>
          </button>

          {/* Today total stats (Hidden when running) */}
          <div className={`glass-card px-4 py-2.5 bg-white/5 border-white/5 text-center flex items-center gap-2 transition-all duration-500 ${isFocusRunning ? 'opacity-0 pointer-events-none w-0 h-0 overflow-hidden px-0 py-0' : 'opacity-100'}`}>
            <span className="text-[10px] text-gray-500 font-bold uppercase leading-none">Today:</span>
            <span className="text-label text-white font-extrabold leading-none">{formatDuration(todayMin)}</span>
          </div>

        </div>

      </div>

    </div>
  );
}

