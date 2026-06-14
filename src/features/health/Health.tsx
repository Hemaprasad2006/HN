import { useState, useMemo } from 'react';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { exerciseTypes } from '@/data/constants.ts';
import { calculateBMI, getBMICategory, getDateKey, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { Heart, Droplets, Moon, Weight, Footprints, Dumbbell, Plus, Trash2, Activity, Minus, Scale } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Health() {
  const { healthLogs, exerciseLogs, addHealthLog, updateHealthLog, addExerciseLog, deleteExerciseLog, getLogForDate, addWater } = useHealthStore();
  const { profile } = useSettingsStore();
  const addXP = useGameStore((s) => s.addXP);
  const today = getDateKey();
  const todayLog = getLogForDate(today);
  const [showExerciseForm, setShowExerciseForm] = useState(false);

  // Health form state
  const [weight, setWeight] = useState(todayLog?.weight || 0);
  const [sleepHours, setSleepHours] = useState(todayLog?.sleepHours || 0);
  const [steps, setSteps] = useState(todayLog?.steps || 0);

  // Exercise form
  const [exType, setExType] = useState(exerciseTypes[0]);
  const [exDuration, setExDuration] = useState(30);
  const [exIntensity, setExIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [exCalories, setExCalories] = useState(0);
  const [exNotes, setExNotes] = useState('');

  const waterIntake = todayLog?.waterIntake || 0;
  const waterPct = Math.min(100, (waterIntake / profile.targetWater) * 100);
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
    addXP(10, 'health', 'Updated health log');
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

  // Chart data
  const weightData = useMemo(() => {
    const data: { date: string; weight: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      if (log?.weight) data.push({ date: format(new Date(d + 'T00:00:00'), 'MMM d'), weight: log.weight });
    }
    return data;
  }, [healthLogs]);

  const sleepData = useMemo(() => {
    const data: { date: string; hours: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d + 'T00:00:00'), 'EEE'), hours: log?.sleepHours || 0 });
    }
    return data;
  }, [healthLogs]);

  const waterData = useMemo(() => {
    const data: { date: string; intake: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d + 'T00:00:00'), 'EEE'), intake: (log?.waterIntake || 0) / 1000 });
    }
    return data;
  }, [healthLogs]);

  return (
    <div className="animate-fade-in space-y-4 text-slate-100">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text flex items-center gap-2">
            <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-400" /> Health Tracker
          </h1>
          <p className="text-responsive-xs text-gray-400 mt-0.5">Monitor your body, optimize sleep, steps and workouts</p>
        </div>
      </div>

      {/* Health Logger Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Water Tracker Card */}
        <div className="glass-card p-4 stat-glow-cyan flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-cyan-400" /> Water Tracker
              </span>
              <span className="text-[10px] text-gray-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded-full">
                {waterPct.toFixed(0)}% Target
              </span>
            </div>
            
            <div className="my-2.5">
              <p className="text-2xl font-black text-cyan-400 leading-none">{waterIntake} ml</p>
              <p className="text-[10px] text-gray-500 mt-1">Goal: {profile.targetWater} ml</p>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300" style={{ width: `${waterPct}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleQuickSubtractWater} 
              disabled={waterIntake <= 0}
              className="px-2 py-1.5 rounded-lg bg-slate-800 text-gray-400 text-xs font-semibold hover:text-white transition-colors disabled:opacity-30">
              -250
            </button>
            <button 
              onClick={() => handleQuickAddWater(250)} 
              className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all">
              +250ml
            </button>
            <button 
              onClick={() => handleQuickAddWater(500)} 
              className="flex-1 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 transition-all">
              +500ml
            </button>
          </div>
        </div>

        {/* Daily Log Card with Quick Tap updates */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Daily Health Stats
            </h3>
            
            <div className="space-y-2.5">
              {/* Sleep log */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sleep: <strong className="text-white">{sleepHours}h</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleQuickSleepAdd(-0.5)} className="w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white text-xs">-</button>
                  <button onClick={() => handleQuickSleepAdd(0.5)} className="w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white text-xs">+</button>
                </div>
              </div>

              {/* Steps log */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Footprints className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Steps: <strong className="text-white">{steps.toLocaleString()}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleQuickStepsAdd(-1000)} className="w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white text-xs">-1k</button>
                  <button onClick={() => handleQuickStepsAdd(1000)} className="w-5 h-5 rounded bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white text-xs">+1k</button>
                </div>
              </div>

              {/* Weight log */}
              <div className="flex items-center gap-2">
                <Weight className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-xs text-gray-400 w-12 shrink-0">Weight:</span>
                <input 
                  type="number" 
                  value={weight || ''} 
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="kg"
                  className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-white/5 text-center text-xs text-white" />
                <span className="text-[10px] text-gray-500">kg</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSaveHealth}
            className="w-full mt-3 py-1.5 rounded-lg gradient-primary text-white text-xs font-semibold hover:opacity-90 transition-all">
            Save Log
          </button>
        </div>

        {/* BMI Calculator Card */}
        <div className="glass-card p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-violet-400" /> BMI Calculator
            </h3>
            
            {bmi > 0 ? (
              <div className="text-center py-1.5">
                <p className="text-3xl font-black mb-0.5" style={{ color: bmiCategory.color }}>{bmi}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: bmiCategory.color }}>{bmiCategory.label}</p>
                
                <div className="mt-3.5 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 w-1/4 bg-amber-500/50 rounded-l-full" />
                  <div className="absolute inset-y-0 left-1/4 w-1/4 bg-emerald-500/50" />
                  <div className="absolute inset-y-0 left-2/4 w-1/4 bg-orange-500/50" />
                  <div className="absolute inset-y-0 left-3/4 w-1/4 bg-rose-500/50 rounded-r-full" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-lg"
                    style={{ left: `${Math.min(95, Math.max(5, ((bmi - 15) / 25) * 100))}%` }} />
                </div>
                <div className="flex justify-between text-[8px] text-gray-500 mt-1">
                  <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-xs text-center py-6">Enter weight and height (settings) to see BMI</p>
            )}
          </div>

          <p className="text-[10px] text-gray-500 text-center">BMI based on height: {profile.height || '--'}cm</p>
        </div>
      </div>

      {/* Workouts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Workout list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs md:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-rose-400" /> Today's Exercise Log
            </h3>
            <button 
              onClick={() => setShowExerciseForm(!showExerciseForm)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 transition-all">
              <Plus className="w-3.5 h-3.5" /> Log Exercise
            </button>
          </div>

          {showExerciseForm && (
            <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Workout Type</label>
                  <select value={exType} onChange={(e) => setExType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs">
                    {exerciseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Intensity</label>
                  <div className="flex gap-1">
                    {(['light', 'moderate', 'intense'] as const).map((i) => (
                      <button key={i} onClick={() => setExIntensity(i)}
                        className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all capitalize',
                          exIntensity === i ? 'gradient-primary text-white' : 'bg-slate-800 text-gray-400 hover:text-white')}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Duration (minutes)</label>
                  <input type="number" value={exDuration} onChange={(e) => setExDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs" min={1} />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Calories Burned (optional)</label>
                  <input type="number" value={exCalories || ''} onChange={(e) => setExCalories(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs" placeholder="e.g. 250" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Workout Notes</label>
                <input type="text" value={exNotes} onChange={(e) => setExNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white text-xs placeholder-gray-500" placeholder="e.g. 5x5 squats, heavy set" />
              </div>

              <button onClick={handleAddExercise}
                className="w-full py-2 rounded-lg gradient-danger text-white text-xs font-semibold hover:opacity-90 transition-all">
                Add Exercise Log
              </button>
            </div>
          )}

          {todayExercises.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Dumbbell className="w-8 h-8 mx-auto text-rose-400/40 mb-1.5" />
              <p className="text-responsive-xs text-gray-400">No workouts recorded today. Start moving!</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayExercises.map((ex) => (
                <div key={ex.id} className="glass-card p-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{ex.type}</p>
                    <p className="text-[10px] text-gray-500">
                      {ex.durationMinutes}min · <span className="capitalize">{ex.intensity}</span>
                      {ex.caloriesBurned ? ` · ${ex.caloriesBurned} cal` : ''}
                      {ex.notes ? ` · "${ex.notes}"` : ''}
                    </p>
                  </div>
                  <button onClick={() => deleteExerciseLog(ex.id)} className="p-1 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BMI reference / quick tip */}
        <div className="lg:col-span-5">
          <div className="glass-card p-4 h-full flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold text-white mb-2">Health Quote & Tip</h3>
              <p className="text-responsive-xs text-gray-400 italic">
                "It is a shame for a man to grow old without seeing the beauty and strength of which his body is capable."
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/5 text-responsive-xs text-gray-400 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Drink water consistently throughout the day to boost metabolism.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Keep consistent sleep timings to support circadian rhythm.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {weightData.length > 1 && (
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold text-slate-300 mb-2">Weight Trend (30d)</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, fontSize: 10 }} />
                  <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Sleep hours (14d)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sleepData}>
                <XAxis dataKey="date" tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} width={16} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, fontSize: 10 }} />
                <Area type="monotone" dataKey="hours" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Water Intake (14d)</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterData}>
                <XAxis dataKey="date" tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 9 }} axisLine={false} tickLine={false} width={16} />
                <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 8, fontSize: 10 }}
                  formatter={(value: any) => [`${value}L`, 'Water']} />
                <Bar dataKey="intake" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
