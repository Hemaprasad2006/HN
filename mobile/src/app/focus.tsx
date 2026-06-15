import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusStore } from '@/stores/useFocusStore';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { format } from 'date-fns';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, Sparkles } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { Audio } from 'expo-av';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  cancelAnimation 
} from 'react-native-reanimated';

type TimerMode = 'focus' | 'break';

const AMBIENT_RAIN_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'; // Soothing stream fallback

export default function FocusScreen() {
  const {
    addSession,
    getTodayFocusMinutes,
    isFocusRunning,
    setIsFocusRunning,
    focusTaskName,
    setFocusTaskName,
  } = useFocusStore();

  const tasks = usePlannerStore((s) => s.tasks);

  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [ambientSound, setAmbientSound] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<string>('');

  // Breathing pulse shared value
  const breatheScale = useSharedValue(1);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  // Handle breathing animation
  useEffect(() => {
    if (!isFocusRunning) {
      breatheScale.value = withRepeat(
        withTiming(1.03, { duration: 1600 }),
        -1,
        true
      );
    } else {
      cancelAnimation(breatheScale);
      breatheScale.value = withTiming(1, { duration: 300 });
    }
  }, [isFocusRunning]);

  const animatedBreatheStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale.value }],
    };
  });

  // Soundscape audio controllers
  const startSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: AMBIENT_RAIN_URL },
        { shouldPlay: true, isLooping: true, volume: 0.3 }
      );
      soundRef.current = sound;
    } catch (err) {
      console.warn('Unable to load audio stream:', err);
    }
  };

  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  const handleAmbientToggle = async () => {
    if (ambientSound) {
      await stopSound();
      setAmbientSound(false);
    } else {
      await startSound();
      setAmbientSound(true);
    }
  };

  const handleTimerComplete = useCallback(() => {
    setIsFocusRunning(false);
    stopSound();
    setAmbientSound(false);

    if (timerMode === 'focus') {
      const durationMins = Math.round(totalTime / 60);
      addSession({
        type: 'pomodoro',
        durationMinutes: durationMins,
        breakMinutes: 5,
        startTime: startTimeRef.current || new Date().toISOString(),
        completed: true,
      });
      setTimerMode('break');
      setTimeLeft(5 * 60);
      setTotalTime(5 * 60);
    } else {
      setTimerMode('focus');
      setTimeLeft(25 * 60);
      setTotalTime(25 * 60);
    }
  }, [timerMode, totalTime, addSession, setIsFocusRunning]);

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
    stopSound();
    setAmbientSound(false);
    const d = timerMode === 'focus' ? 25 * 60 : 5 * 60;
    setTimeLeft(d);
    setTotalTime(d);
  };

  const handleSkip = () => {
    clearInterval(intervalRef.current!);
    setIsFocusRunning(false);
    stopSound();
    setAmbientSound(false);
    const nextMode = timerMode === 'focus' ? 'break' : 'focus';
    setTimerMode(nextMode);
    const d = nextMode === 'focus' ? 25 * 60 : 5 * 60;
    setTimeLeft(d);
    setTotalTime(d);
  };

  // Clean audio on leave
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const todayMin = getTodayFocusMinutes();

  // SVG parameters
  const size = 260;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ * (1 - timeLeft / totalTime);
  const activeColor = timerMode === 'focus' ? '#8B5CF6' : '#22C55E';

  return (
    <SafeAreaView style={[styles.safeArea, isFocusRunning && styles.safeAreaRunning]}>
      
      {/* Top details - Fades out during active focus */}
      <View style={[styles.header, isFocusRunning && styles.hidden]}>
        <Text style={styles.headerTitle}>{timerMode === 'focus' ? 'Deep Focus' : 'Short Break'}</Text>
        <Text style={styles.headerSubtitle}>Silence distractions, master your attention</Text>
      </View>

      {/* Active task details */}
      {isFocusRunning && (
        <View style={styles.activeDetails}>
          <Text style={styles.activeLabel}>
            <Sparkles size={10} color="#8B5CF6" /> Active Focus Mode
          </Text>
          <Text style={styles.activeTaskName}>{focusTaskName}</Text>
        </View>
      )}

      {/* 70% Immersive Timer Circle */}
      <View style={styles.timerWrapper}>
        <Animated.View style={[styles.circleContainer, animatedBreatheStyle]}>
          <Svg width={size} height={size}>
            <Circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke="rgba(255,255,255,0.015)" 
              strokeWidth={strokeWidth} 
            />
            <Circle 
              cx={center} 
              cy={center} 
              r={radius} 
              fill="none" 
              stroke={activeColor} 
              strokeWidth={strokeWidth}
              strokeDasharray={circ}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${center}, ${center}`}
            />
          </Svg>
          <View style={styles.timeLabel}>
            <Text style={styles.timeText}>{formatTimer(timeLeft)}</Text>
            <Text style={styles.modeText}>{timerMode}</Text>
          </View>
        </Animated.View>
      </View>

      {/* Task Selector Dropdown - Fades out during active focus */}
      <View style={[styles.selectorContainer, isFocusRunning && styles.hidden]}>
        <Text style={styles.selectorLabel}>What are you mastering?</Text>
        {todayTasks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taskScroll}>
            <TouchableOpacity 
              onPress={() => setFocusTaskName('Deep Work')}
              style={[styles.taskOption, focusTaskName === 'Deep Work' && styles.taskOptionSelected]}>
              <Text style={[styles.taskOptionText, focusTaskName === 'Deep Work' && styles.taskOptionTextSelected]}>
                Custom Work
              </Text>
            </TouchableOpacity>
            {todayTasks.map((t) => (
              <TouchableOpacity 
                key={t.id} 
                onPress={() => setFocusTaskName(t.title)}
                style={[styles.taskOption, focusTaskName === t.title && styles.taskOptionSelected]}>
                <Text style={[styles.taskOptionText, focusTaskName === t.title && styles.taskOptionTextSelected]}>
                  {t.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.customTaskWrapper}>
            <Text style={styles.customTaskText}>Focus Mode: {focusTaskName}</Text>
          </View>
        )}
      </View>

      {/* Controls & Soundscapes */}
      <View style={styles.controlsSection}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={handleReset} style={styles.controlBtn}>
            <RotateCcw size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={isFocusRunning ? handlePause : handleStart}
            style={[styles.playBtn, { backgroundColor: activeColor }]}>
            {isFocusRunning ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.controlBtn}>
            <SkipForward size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          {/* Soundscape toggle */}
          <TouchableOpacity 
            onPress={handleAmbientToggle}
            style={[styles.soundToggle, ambientSound && styles.soundToggleActive]}>
            {ambientSound ? <Volume2 size={14} color="#8B5CF6" /> : <VolumeX size={14} color="#94A3B8" />}
            <Text style={[styles.soundToggleText, ambientSound && styles.soundToggleTextActive]}>
              Ambient Rain
            </Text>
          </TouchableOpacity>

          {/* Today stats summary - Fades out when running */}
          <View style={[styles.statSummary, isFocusRunning && styles.hidden]}>
            <Text style={styles.statLabel}>Today:</Text>
            <Text style={styles.statValue}>{todayMin}m focused</Text>
          </View>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090B14',
    padding: 16,
    justifyContent: 'space-between',
  },
  safeAreaRunning: {
    backgroundColor: '#05070B',
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  activeDetails: {
    alignItems: 'center',
    paddingTop: 24,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTaskName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  timerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 48,
    color: '#F8FAFC',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  modeText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 6,
  },
  selectorContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  taskScroll: {
    gap: 8,
  },
  taskOption: {
    backgroundColor: '#121826',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  taskOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  taskOptionText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
  },
  taskOptionTextSelected: {
    color: '#FFFFFF',
  },
  customTaskWrapper: {
    backgroundColor: '#121826',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
  },
  customTaskText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  controlsSection: {
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  controlBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  soundToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  soundToggleActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  soundToggleText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  soundToggleTextActive: {
    color: '#8B5CF6',
  },
  statSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '800',
  },
  hidden: {
    opacity: 0,
    height: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
});
