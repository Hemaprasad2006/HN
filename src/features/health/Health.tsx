import { useState, useMemo } from 'react';
import { useHealthStore } from '@/stores/useHealthStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { exerciseTypes } from '@/data/constants.ts';
import { calculateBMI, getBMICategory, getDateKey, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { Heart, Droplets, Moon, Weight, Footprints, Dumbbell, Plus, Trash2, Activity } from 'lucide-react';
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
  const latestWeight = healthLogs.find((l) => l.weight)?.weight || 0;
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
      if (log?.weight) data.push({ date: format(new Date(d), 'MMM d'), weight: log.weight });
    }
    return data;
  }, [healthLogs]);

  const sleepData = useMemo(() => {
    const data: { date: string; hours: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d), 'EEE'), hours: log?.sleepHours || 0 });
    }
    return data;
  }, [healthLogs]);

  const waterData = useMemo(() => {
    const data: { date: string; intake: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const log = healthLogs.find((l) => l.date === d);
      data.push({ date: format(new Date(d), 'EEE'), intake: (log?.waterIntake || 0) / 1000 });
    }
    return data;
  }, [healthLogs]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <Heart className="w-8 h-8 text-rose-400" /> Health Tracker
        </h1>
        <p className="text-gray-400 mt-1">Monitor your body, optimize your life</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Water Tracker */}
        <div className="glass-card p-5 stat-glow-cyan">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold">Water Intake</h3>
          </div>
          <p className="text-3xl font-bold text-cyan-400 mb-1">{waterIntake}ml</p>
          <p className="text-xs text-gray-500 mb-3">Target: {profile.targetWater}ml</p>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 progress-bar-fill transition-all" style={{ width: `${waterPct}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => addWater(250)} className="flex-1 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors">+250ml</button>
            <button onClick={() => addWater(500)} className="flex-1 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors">+500ml</button>
          </div>
        </div>

        {/* Daily Health Log */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" /> Daily Log</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-amber-400 shrink-0" />
              <label className="text-sm text-gray-400 w-16">Sleep</label>
              <input type="number" value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" min={0} max={24} step={0.5} />
              <span className="text-xs text-gray-500">hrs</span>
            </div>
            <div className="flex items-center gap-3">
              <Weight className="w-4 h-4 text-violet-400 shrink-0" />
              <label className="text-sm text-gray-400 w-16">Weight</label>
              <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" min={0} step={0.1} />
              <span className="text-xs text-gray-500">kg</span>
            </div>
            <div className="flex items-center gap-3">
              <Footprints className="w-4 h-4 text-indigo-400 shrink-0" />
              <label className="text-sm text-gray-400 w-16">Steps</label>
              <input type="number" value={steps} onChange={(e) => setSteps(Number(e.target.value))}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" min={0} step={100} />
            </div>
            <button onClick={handleSaveHealth}
              className="w-full py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all">
              Save Log
            </button>
          </div>
        </div>

        {/* BMI Card */}
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">BMI Calculator</h3>
          {bmi > 0 ? (
            <div className="text-center">
              <p className="text-5xl font-bold mb-2" style={{ color: bmiCategory.color }}>{bmi}</p>
              <p className="text-sm font-medium" style={{ color: bmiCategory.color }}>{bmiCategory.label}</p>
              <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 w-1/4 bg-amber-500/60 rounded-l-full" />
                <div className="absolute inset-y-0 left-1/4 w-1/4 bg-emerald-500/60" />
                <div className="absolute inset-y-0 left-2/4 w-1/4 bg-orange-500/60" />
                <div className="absolute inset-y-0 left-3/4 w-1/4 bg-rose-500/60 rounded-r-full" />
                <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                  style={{ left: `${Math.min(95, Math.max(5, ((bmi - 15) / 25) * 100))}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Under</span><span>Normal</span><span>Over</span><span>Obese</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-6">Enter weight and set height in settings to see BMI</p>
          )}
        </div>
      </div>

      {/* Exercise */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Dumbbell className="w-5 h-5 text-rose-400" /> Exercise Log</h3>
          <button onClick={() => setShowExerciseForm(!showExerciseForm)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {showExerciseForm && (
          <div className="p-4 bg-slate-800/50 rounded-xl mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select value={exType} onChange={(e) => setExType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm">
                {exerciseTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex gap-1">
                {(['light', 'moderate', 'intense'] as const).map((i) => (
                  <button key={i} onClick={() => setExIntensity(i)}
                    className={cn('flex-1 py-2 rounded-lg text-xs font-medium transition-all capitalize',
                      exIntensity === i ? 'gradient-primary text-white' : 'bg-slate-700 text-gray-400')}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={exDuration} onChange={(e) => setExDuration(Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" placeholder="Duration (min)" />
              <input type="number" value={exCalories} onChange={(e) => setExCalories(Number(e.target.value))}
                className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" placeholder="Calories (optional)" />
            </div>
            <button onClick={handleAddExercise}
              className="w-full py-2 rounded-lg gradient-danger text-white text-sm font-medium hover:opacity-90 transition-all">
              Log Exercise
            </button>
          </div>
        )}

        {todayExercises.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No exercises logged today</p>
        ) : (
          <div className="space-y-2">
            {todayExercises.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{ex.type}</p>
                  <p className="text-xs text-gray-500">{ex.durationMinutes}min · {ex.intensity}{ex.caloriesBurned ? ` · ${ex.caloriesBurned}cal` : ''}</p>
                </div>
                <button onClick={() => deleteExerciseLog(ex.id)} className="p-1.5 rounded hover:bg-rose-500/20 text-gray-500 hover:text-rose-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {weightData.length > 1 && (
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Weight Trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={weightData}>
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
                <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Sleep (2 weeks)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={sleepData}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="hours" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Water Intake (2 weeks)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={waterData}>
              <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
                formatter={(value: any) => [`${value}L`, 'Intake']} />
              <Bar dataKey="intake" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
