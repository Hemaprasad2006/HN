import { useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell,
  LineChart, Line, BarChart, Bar, Legend,
} from 'recharts';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { BarChart3, TrendingUp, TrendingDown, Brain, Zap, Moon, CheckSquare } from 'lucide-react';

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

  // Story-driven insights generator
  const storyInsights = useMemo(() => {
    const list: { type: 'success' | 'warning' | 'info'; text: string; icon: any; color: string }[] = [];

    // Study Hour Trend Insight
    if (momStats.deltas.studyHours > 10) {
      list.push({
        type: 'success',
        text: `Your study dedication is soaring! You have studied ${momStats.current.studyHours.toFixed(1)}h this month—up ${momStats.deltas.studyHours}% from last month.`,
        icon: Brain,
        color: '#8b5cf6',
      });
    } else if (momStats.deltas.studyHours < -10) {
      list.push({
        type: 'warning',
        text: `Study momentum has slowed down by ${Math.abs(momStats.deltas.studyHours)}%. Try scheduling short 25-minute Pomodoro sessions to ease back in.`,
        icon: Brain,
        color: '#f59e0b',
      });
    }

    // Task Completion Rate Insight
    if (momStats.current.taskRate > 80) {
      list.push({
        type: 'success',
        text: `Elite Execution! You've completed ${momStats.current.taskRate}% of your tasks this month. You're operating with high-performance discipline.`,
        icon: CheckSquare,
        color: '#10b981',
      });
    } else if (momStats.current.taskRate < 50) {
      list.push({
        type: 'warning',
        text: `Task backlog is growing. Try focusing on just 1-2 'High Priority' items daily to avoid feeling overwhelmed.`,
        icon: CheckSquare,
        color: '#ef4444',
      });
    }

    // Sleep Correlation Insight
    const focusCorrelation = correlationData.length > 5;
    if (focusCorrelation) {
      const highSleepPoints = correlationData.filter((p) => p.sleep >= 7.5);
      const highSleepFocus = highSleepPoints.length > 0 ? highSleepPoints.reduce((s, p) => s + p.focus, 0) / highSleepPoints.length : 0;
      
      const lowSleepPoints = correlationData.filter((p) => p.sleep < 6.5);
      const lowSleepFocus = lowSleepPoints.length > 0 ? lowSleepPoints.reduce((s, p) => s + p.focus, 0) / lowSleepPoints.length : 0;

      if (highSleepFocus > lowSleepFocus + 1 && highSleepFocus > 0) {
        list.push({
          type: 'success',
          text: `Sleep correlates directly to focus. On days with 7.5h+ sleep, your focus rating averages ${highSleepFocus.toFixed(1)}/10, compared to ${lowSleepFocus.toFixed(1)}/10 when sleep is low.`,
          icon: Moon,
          color: '#06b6d4',
        });
      }
    }

    // Habit/Discipline Consistency Insight
    if (momStats.current.habitRate > 70) {
      list.push({
        type: 'success',
        text: `Habit consistency is strong at ${momStats.current.habitRate}%. Daily routines compound to build life-changing results.`,
        icon: Zap,
        color: '#f59e0b',
      });
    }

    // Default encouragement if no triggers fired
    if (list.length === 0) {
      list.push({
        type: 'info',
        text: "Keep tracking your daily sleep, study sessions, and habits. Within a few days, your personalized growth correlations will appear here.",
        icon: Zap,
        color: '#6366f1',
      });
    }

    return list;
  }, [momStats, correlationData]);

  const tooltipStyle = {
    background: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#e2e8f0',
    fontSize: 11,
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div>
        <h1 className="page-title gradient-text flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" /> Insights
        </h1>
        <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Deep analytics and performance intelligence</p>
      </div>

      {/* Story-driven Insights Section */}
      <div className="space-y-2.5">
        <div className="section-title">Performance Engine</div>
        {storyInsights.map((insight, idx) => (
          <div key={idx} className="glass-card p-4 flex gap-3.5 items-start">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${insight.color}15` }}>
              <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold leading-relaxed" style={{ color: 'var(--text-primary)' }}>{insight.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Performance Indicators Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Study Hours', value: `${momStats.current.studyHours.toFixed(1)}h`, prev: `${momStats.previous.studyHours.toFixed(1)}h`, delta: momStats.deltas.studyHours, glow: 'stat-glow-violet' },
          { label: 'Task Rate', value: `${momStats.current.taskRate}%`, prev: `${momStats.previous.taskRate}%`, delta: momStats.deltas.taskRate, glow: 'stat-glow-indigo' },
          { label: 'Habit Rate', value: `${momStats.current.habitRate}%`, prev: `${momStats.previous.habitRate}%`, delta: momStats.deltas.habitRate, glow: 'stat-glow-amber' },
          { label: 'Avg Sleep', value: `${momStats.current.sleepAvg.toFixed(1)}h`, prev: `${momStats.previous.sleepAvg.toFixed(1)}h`, delta: momStats.deltas.sleepAvg, glow: 'stat-glow-emerald' },
        ].map((card, i) => (
          <div key={i} className={`glass-card p-3.5 space-y-1.5 ${card.glow}`}>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{card.label}</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{card.value}</h3>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${ card.delta >= 0 ? 'text-emerald-400' : 'text-rose-400' }`}>
                {card.delta >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {card.delta >= 0 ? '+' : ''}{card.delta}%
              </span>
            </div>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>vs {card.prev} last month</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {/* Sleep vs Focus Scatter Chart */}
        <div className="glass-card p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Sleep vs Study Focus</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Comparison of sleep duration against session focus rating (1-10)</p>
          </div>
          <div className="h-48">
            {correlationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 italic text-center px-4">
                Log both sleep hours and study sessions to unlock correlation data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 5, left: -25 }}>
                  <XAxis type="number" dataKey="sleep" name="Sleep" unit="h" domain={[4, 12]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="focus" name="Focus" domain={[1, 10]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                  <Scatter name="Correlation" data={correlationData}>
                    {correlationData.map((_, index) => (<Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weekly Study Hours vs Workouts Bar Chart */}
        <div className="glass-card p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Study vs Workouts</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Weekly breakdown of study hours and exercise workouts (last 8 weeks)</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends} margin={{ top: 10, right: -5, bottom: 5, left: -25 }}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="studyHours" name="Study (h)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="workouts" name="Workouts" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Habit Success Rate vs Study Hours Line Chart */}
        <div className="glass-card p-4 space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Habits vs Study Hours</h3>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Weekly comparison of habit completion rate against total study hours</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends} margin={{ top: 10, right: -5, bottom: 5, left: -25 }}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" stroke="#f59e0b" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.4)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 9, paddingTop: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="habitRate" name="Habits (%)" stroke="#f59e0b" strokeWidth={2.5} dot={{ stroke: '#f59e0b', strokeWidth: 1.5 }} activeDot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="studyHours" name="Study (h)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ stroke: '#8b5cf6', strokeWidth: 1.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
