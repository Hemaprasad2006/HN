import { useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, Cell,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { BarChart3, Percent } from 'lucide-react';

export function AdvancedAnalytics() {
  const tasks = usePlannerStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const studySessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const exerciseLogs = useHealthStore((s) => s.exerciseLogs);

  const correlationData = useMemo(() => {
    const pairs: Record<string, { date: string; sleep: number; focusSum: number; focusCount: number }> = {};
    healthLogs.forEach((l) => { pairs[l.date] = { date: l.date, sleep: l.sleepHours, focusSum: 0, focusCount: 0 }; });
    studySessions.forEach((s) => {
      const dateStr = format(parseISO(s.startTime), 'yyyy-MM-dd');
      if (pairs[dateStr]) { pairs[dateStr].focusSum += s.focusRating; pairs[dateStr].focusCount += 1; }
      else { pairs[dateStr] = { date: dateStr, sleep: 0, focusSum: s.focusRating, focusCount: 1 }; }
    });
    return Object.values(pairs).filter((p) => p.sleep > 0 && p.focusCount > 0)
      .map((p) => ({ date: p.date, sleep: Number(p.sleep.toFixed(1)), focus: Number((p.focusSum / p.focusCount).toFixed(1)) }))
      .sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [healthLogs, studySessions]);

  const weeklyTrends = useMemo(() => {
    const weeksData: Record<number, { week: string; studyHours: number; workouts: number; habitRate: number; count: number }> = {};
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = subDays(now, i * 7);
      const weekNum = format(weekStart, 'w');
      weeksData[Number(weekNum)] = { week: `Wk ${weekNum}`, studyHours: 0, workouts: 0, habitRate: 0, count: 0 };
    }
    studySessions.forEach((s) => {
      const date = parseISO(s.startTime); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) weeksData[w].studyHours += s.durationMinutes / 60; }
    });
    exerciseLogs.forEach((l) => {
      const date = parseISO(l.date); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) weeksData[w].workouts += 1; }
    });
    habitLogs.forEach((l) => {
      const date = parseISO(l.date); const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) { const w = Number(format(date, 'w')); if (weeksData[w]) { if (l.completed) weeksData[w].habitRate += 1; weeksData[w].count += 1; } }
    });
    return Object.values(weeksData).map((w) => ({ week: w.week, studyHours: Number(w.studyHours.toFixed(1)), workouts: w.workouts, habitRate: w.count > 0 ? Math.round((w.habitRate / w.count) * 100) : 0 }));
  }, [studySessions, exerciseLogs, habitLogs]);

  const momStats = useMemo(() => {
    const now = new Date(); const thisMonthStart = subDays(now, 30); const lastMonthStart = subDays(now, 60);
    const getStatsForRange = (start: Date, end: Date) => {
      const inRange = (d: string) => { const p = parseISO(d); return p >= start && p < end; };
      const rangeTasks = tasks.filter((t) => inRange(t.dueDate));
      const completedTasks = rangeTasks.filter((t) => t.status === 'done').length;
      const totalTasks = rangeTasks.length;
      const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;
      const rangeSessions = studySessions.filter((s) => inRange(s.startTime));
      const studyHours = rangeSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
      const focusAvg = rangeSessions.length > 0 ? rangeSessions.reduce((sum, s) => sum + s.focusRating, 0) / rangeSessions.length : 0;
      const rangeLogs = habitLogs.filter((l) => inRange(l.date));
      const habitRate = rangeLogs.length > 0 ? Math.round((rangeLogs.filter((l) => l.completed).length / rangeLogs.length) * 100) : 0;
      const rangeHealth = healthLogs.filter((l) => inRange(l.date));
      const sleepAvg = rangeHealth.length > 0 ? rangeHealth.reduce((sum, l) => sum + l.sleepHours, 0) / rangeHealth.length : 0;
      return { taskRate, studyHours, focusAvg, habitRate, sleepAvg };
    };
    const currentStats = getStatsForRange(thisMonthStart, now);
    const previousStats = getStatsForRange(lastMonthStart, thisMonthStart);
    const calcDelta = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
    return {
      current: currentStats, previous: previousStats,
      deltas: { taskRate: currentStats.taskRate - previousStats.taskRate, studyHours: calcDelta(currentStats.studyHours, previousStats.studyHours), focusAvg: calcDelta(currentStats.focusAvg, previousStats.focusAvg), habitRate: currentStats.habitRate - previousStats.habitRate, sleepAvg: calcDelta(currentStats.sleepAvg, previousStats.sleepAvg) },
    };
  }, [tasks, studySessions, habitLogs, healthLogs]);

  const tooltipStyle = { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0', fontSize: 11 };

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> Analytics
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Discover trends across sleep, habits, and study focus.</p>
      </div>

      {/* MoM Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Study Hours', value: `${momStats.current.studyHours.toFixed(1)}h`, prev: `${momStats.previous.studyHours.toFixed(1)}h`, delta: momStats.deltas.studyHours },
          { label: 'Task Rate', value: `${momStats.current.taskRate}%`, prev: `${momStats.previous.taskRate}%`, delta: momStats.deltas.taskRate },
          { label: 'Habit Rate', value: `${momStats.current.habitRate}%`, prev: `${momStats.previous.habitRate}%`, delta: momStats.deltas.habitRate },
          { label: 'Avg Sleep', value: `${momStats.current.sleepAvg.toFixed(1)}h`, prev: `${momStats.previous.sleepAvg.toFixed(1)}h`, delta: momStats.deltas.sleepAvg },
        ].map((card, i) => (
          <div key={i} className="glass-card p-3 md:p-4 space-y-1">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{card.label}</p>
            <div className="flex items-end justify-between gap-1">
              <h3 className="text-xl md:text-2xl font-extrabold text-white">{card.value}</h3>
              <span className={`text-[10px] font-semibold shrink-0 ${ card.delta >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                {card.delta >= 0 ? '+' : ''}{card.delta}%
              </span>
            </div>
            <p className="text-[10px] text-gray-500">vs {card.prev} last month</p>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sleep vs Focus Scatter (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-4 space-y-3">
          <div className="border-b border-white/[0.06] pb-2">
            <h3 className="text-xs md:text-sm font-semibold text-gray-300">Sleep vs Study Focus</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Daily sleep hours vs average study focus (last 30 data points)</p>
          </div>
          <div className="h-48 md:h-56">
            {correlationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                Log both sleep and study sessions on the same day to see correlations.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                  <XAxis type="number" dataKey="sleep" name="Sleep" unit="h" domain={[4, 12]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis type="number" dataKey="focus" name="Focus" domain={[1, 10]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                  <Scatter name="Correlation" data={correlationData} fill="#6366f1">
                    {correlationData.map((_, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Study vs Workout */}
        <div className="glass-card p-4 space-y-3">
          <div className="border-b border-white/[0.06] pb-2">
            <h3 className="text-xs md:text-sm font-semibold text-gray-300">Study vs Workouts</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Weekly comparison (last 8 weeks)</p>
          </div>
          <div className="h-48 md:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="studyHours" name="Study (h)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="workouts" name="Workouts" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Habit vs Study Line Chart */}
      <div className="glass-card p-4 space-y-3">
        <div className="border-b border-white/[0.06] pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-xs md:text-sm font-semibold text-gray-300">Habit Success vs Study Hours</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">Weekly trend comparison (last 8 weeks)</p>
          </div>
          <Percent className="w-4 h-4 text-indigo-400 shrink-0" />
        </div>
        <div className="h-44 md:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends}>
              <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" stroke="#6366f1" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="habitRate" name="Habit (%)" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="studyHours" name="Study (h)" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
