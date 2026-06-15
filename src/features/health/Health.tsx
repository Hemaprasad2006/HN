import { useState, useMemo } from 'react';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { exerciseTypes } from '@/data/constants.ts';
import { calculateBMI, getBMICategory, getDateKey, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { Droplets, Moon, Weight, Footprints, Dumbbell, Trash2, Plus, Minus, Scale } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type HealthTab = 'overview' | 'hydration' | 'exercise' | 'sleep';

export function Health() {
  const { healthLogs, exerciseLogs, addHealthLog, updateHealthLog, addExerciseLog, deleteExerciseLog, getLogForDate, addWater } = useHealthStore();
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);
  const today = getDateKey();
  const todayLog = getLogForDate(today);

  const [activeTab, setActiveTab] = useState<HealthTab>('overview');

  // Form states
  const [weight, setWeight] = useState(todayLog?.weight || 0);
  const [sleepHours, setSleepHours] = useState(todayLog?.sleepHours || 0);
  const [steps, setSteps] = useState(todayLog?.steps || 0);

  // Exercise Form state
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [exType, setExType] = useState(exerciseTypes[0]);
  const [exDuration, setExDuration] = useState(30);
  const [exIntensity, setExIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [exCalories, setExCalories] = useState(0);
  const [exNotes, setExNotes] = useState('');

  const waterIntake = todayLog?.waterIntake || 0;
  const waterPct = Math.min(100, (waterIntake / (profile.targetWater || 3000)) * 100);
  const latestWeight = healthLogs.find((l) => l.weight)?.weight || weight || 0;
  const bmi = calculateBMI(latestWeight, profile.height || 170);
  const bmiCategory = getBMICategory(bmi);

  const todayExercises = exerciseLogs.filter((e) => e.date === today);

  const handleSaveHealth = () => {
    if (todayLog) {
      updateHealthLog(todayLog.id, { weight: weight || undefined, sleepHours, steps: steps || undefined });
    } else {
      addHealthLog({ date: today, weight: weight || undefined, sleepHours, steps: steps || undefined, waterIntake: 0 });
    }
    addXP(10, 'health', 'Updated health logs');
  };

  const handleQuickAddWater = (amount: number) => {
    addWater(amount);
    addXP(5, 'health', `Logged water intake: ${amount}ml`);
  };

  const handleQuickSubtractWater = () => {
    if (waterIntake >= 250) {
      addWater(-250);
    }
  };

  const handleQuickStepsAdd = (amount: number) => {
    const newSteps = Math.max(0, steps + amount);
    setSteps(newSteps);
    if (todayLog) {
      updateHealthLog(todayLog.id, { steps: newSteps || undefined });
    } else {
      addHealthLog({ date: today, weight: weight || undefined, sleepHours, steps: newSteps || undefined, waterIntake: 0 });
    }
    if (amount > 0) addXP(5, 'health', `Added steps: ${amount}`);
  };

  const handleQuickSleepAdd = (amount: number) => {
    const newSleep = Math.max(0, Math.min(24, sleepHours + amount));
    setSleepHours(newSleep);
    if (todayLog) {
      updateHealthLog(todayLog.id, { sleepHours: newSleep });
    } else {
      addHealthLog({ date: today, weight: weight || undefined, sleepHours: newSleep, steps: steps || undefined, waterIntake: 0 });
    }
    if (amount > 0) addXP(5, 'health', `Added sleep: ${amount}h`);
  };

  const handleAddExercise = () => {
    addExerciseLog({
      date: today, type: exType, durationMinutes: exDuration,
      intensity: exIntensity, caloriesBurned: exCalories || undefined, notes: exNotes,
    });
    addXP(15, 'health', `Logged ${exType} workout`);
    setShowExerciseForm(false);
    setExNotes('');
  };

  // Water History
  const waterHistory = useMemo(() => {
    const data: { date: string; intake: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d + 'T00:00:00'), 'dd'), intake: (log?.waterIntake || 0) / 1000 });
    }
    return data;
  }, [healthLogs]);

  // Sleep History
  const sleepHistory = useMemo(() => {
    const data: { date: string; hours: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d + 'T00:00:00'), 'dd'), hours: log?.sleepHours || 0 });
    }
    return data;
  }, [healthLogs]);

  const tooltipStyle = {
    background: '#141B2D',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    color: '#F8FAFC',
    fontSize: '11px',
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 className="text-page-title text-white font-extrabold">Health</h1>
        <p className="text-secondary-text text-gray-400 mt-1">Track metrics, sleep patterns, and physical training</p>
      </div>

      {/* Tabs Selection Bar */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-[#141B2D] border border-white/5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {(['overview', 'hydration', 'exercise', 'sleep'] as HealthTab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap px-3 text-center',
              activeTab === tab ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-400'
            )}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Weight & BMI Card */}
          <div className="glass-card p-4 bg-[#141B2D] flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="text-label text-gray-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-violet-400" /> BMI Evaluation
              </span>
              <span className="text-label px-2 py-0.5 rounded-full font-bold" style={{ color: bmiCategory.color, backgroundColor: `${bmiCategory.color}15` }}>
                {bmiCategory.label}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-label text-gray-500">Latest BMI Score</p>
                <p className="text-card-title text-white font-black mt-1">{bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-label text-gray-500">Current Weight</p>
                <p className="text-card-title text-white font-black mt-1">{latestWeight > 0 ? `${latestWeight} kg` : '—'}</p>
              </div>
            </div>

            <div className="border-t border-white/5 pt-3 flex gap-3">
              <div className="flex-1">
                <label className="text-label text-gray-400 block mb-1">Update Weight (kg)</label>
                <input type="number" value={weight || ''} onChange={(e) => setWeight(Number(e.target.value))} className="modal-input" placeholder="e.g. 70" />
              </div>
              <button onClick={handleSaveHealth} className="btn-primary self-end py-3 text-xs">Save</button>
            </div>
          </div>

          {/* Quick Metrics Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-4 bg-[#141B2D] flex flex-col justify-between gap-3">
              <span className="text-label text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Footprints className="w-3.5 h-3.5 text-[#22C55E]" /> Today Steps
              </span>
              <p className="text-card-title text-white font-black leading-none">{steps.toLocaleString()} steps</p>
              <div className="flex gap-1">
                <button onClick={() => handleQuickStepsAdd(1000)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300">+1k</button>
                <button onClick={() => handleQuickStepsAdd(5000)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300">+5k</button>
              </div>
            </div>

            <div className="glass-card p-4 bg-[#141B2D] flex flex-col justify-between gap-3">
              <span className="text-label text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-[#F59E0B]" /> Today Sleep
              </span>
              <p className="text-card-title text-white font-black leading-none">{sleepHours}h rested</p>
              <div className="flex gap-1">
                <button onClick={() => handleQuickSleepAdd(-1)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300">-1h</button>
                <button onClick={() => handleQuickSleepAdd(1)} className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-gray-300">+1h</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hydration' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {/* Hydration Log Card */}
          <div className="glass-card p-4 bg-[#141B2D] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-label text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-[#22C55E]" /> Hydration Target
              </span>
              <span className="text-label text-[#22C55E] bg-[#22C55E]/10 px-2 py-0.5 rounded-full font-bold">
                {waterPct.toFixed(0)}%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-display text-[#22C55E] font-black leading-none">{waterIntake}</p>
                <p className="text-label text-gray-400 mt-1">ml consumed / {profile.targetWater || 3000}ml target</p>
              </div>
              <button onClick={handleQuickSubtractWater} className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white">
                <Minus className="w-4 h-4" />
              </button>
            </div>

            <div className="h-2 rounded-full overflow-hidden bg-white/5">
              <div className="h-full rounded-full transition-all duration-300" style={{ width: `${waterPct}%`, background: '#22C55E' }} />
            </div>

            <div className="flex gap-2">
              {[250, 500, 750].map((ml) => (
                <button key={ml} onClick={() => handleQuickAddWater(ml)} 
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E] transition-all active:scale-95">
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Water History Chart */}
          <div className="glass-card p-4 bg-[#141B2D] space-y-3">
            <div>
              <h4 className="text-card-title text-white font-bold">Daily Water Intake</h4>
              <p className="text-label text-gray-500 mt-0.5">Hydration values logged (last 14 days in Liters)</p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waterHistory} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="intake" stroke="#22C55E" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exercise' && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {/* Add Workout Section Toggle */}
          {!showExerciseForm ? (
            <button onClick={() => setShowExerciseForm(true)} 
              className="w-full glass-card p-4 flex items-center justify-between bg-gradient-to-r from-[#EF4444]/10 to-transparent border border-[#EF4444]/20 active:scale-95 transition-all">
              <span className="text-body font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#EF4444]" /> Log Workout Session
              </span>
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <div className="glass-card p-4 bg-[#141B2D] flex flex-col gap-4">
              <h4 className="text-card-title text-white font-bold">New Workout</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label text-gray-400 block mb-1">Activity Type</label>
                  <select value={exType} onChange={(e) => setExType(e.target.value)} className="modal-input">
                    {exerciseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-label text-gray-400 block mb-1">Duration (mins)</label>
                  <input type="number" value={exDuration} onChange={(e) => setExDuration(Number(e.target.value))} className="modal-input" min={5} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label text-gray-400 block mb-1">Intensity</label>
                  <select value={exIntensity} onChange={(e) => setExIntensity(e.target.value as any)} className="modal-input">
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>
                <div>
                  <label className="text-label text-gray-400 block mb-1">Est. Calories Burned</label>
                  <input type="number" value={exCalories} onChange={(e) => setExCalories(Number(e.target.value))} className="modal-input" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="text-label text-gray-400 block mb-1">Workout Notes</label>
                <input value={exNotes} onChange={(e) => setExNotes(e.target.value)} className="modal-input" placeholder="e.g. Completed outdoor running loop" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowExerciseForm(false)} className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300">Cancel</button>
                <button onClick={handleAddExercise} className="flex-1 btn-primary py-3 text-xs" style={{ background: '#EF4444' }}>Save Session</button>
              </div>
            </div>
          )}

          {/* Today's Exercises */}
          <div>
            <div className="text-label text-gray-400 uppercase tracking-wider mb-2 px-1">Today's Workouts</div>
            {todayExercises.length === 0 ? (
              <div className="glass-card p-4 text-center bg-[#141B2D]">
                <p className="text-secondary-text text-gray-400">No workout sessions logged for today.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {todayExercises.map((ex) => (
                  <div key={ex.id} className="glass-card p-4 bg-[#141B2D] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-body font-bold text-white">{ex.type}</p>
                        <p className="text-label text-gray-400">{ex.durationMinutes}m · {ex.intensity} intensity {ex.caloriesBurned ? `· ${ex.caloriesBurned} kcal` : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteExerciseLog(ex.id)} className="text-gray-500 hover:text-[#EF4444] transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sleep' && (
        <div className="flex flex-col gap-5 animate-fade-in">
          {/* Sleep Config */}
          <div className="glass-card p-4 bg-[#141B2D] flex flex-col gap-4">
            <span className="text-label text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-[#F59E0B]" /> Rest Management
            </span>
            <div>
              <p className="text-label text-gray-500">Sleep logged today</p>
              <p className="text-display text-[#F59E0B] font-black leading-none mt-1">{sleepHours} hours</p>
            </div>
            
            <div>
              <label className="text-label text-gray-400 block mb-1">Slider Entry (Hours)</label>
              <input type="range" min={0} max={16} step={0.5} value={sleepHours} 
                onChange={(e) => handleQuickSleepAdd(Number(e.target.value) - sleepHours)}
                className="w-full accent-[#F59E0B]" />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-bold">
                <span>0h</span>
                <span>8h Target</span>
                <span>16h</span>
              </div>
            </div>
          </div>

          {/* Sleep History Chart */}
          <div className="glass-card p-4 bg-[#141B2D] space-y-3">
            <div>
              <h4 className="text-card-title text-white font-bold">Sleep Quality Cycles</h4>
              <p className="text-label text-gray-500 mt-0.5">Total sleep hours per day (last 14 days)</p>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sleepHistory} margin={{ top: 10, right: 0, bottom: 5, left: -25 }}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="hours" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
