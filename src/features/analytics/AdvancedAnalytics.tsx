import { useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { subDays, format, parseISO, differenceInDays } from 'date-fns';
import { TrendingUp, Award, BarChart3, Shuffle, Calendar, Percent } from 'lucide-react';

export function AdvancedAnalytics() {
  const tasks = usePlannerStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const studySessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const exerciseLogs = useHealthStore((s) => s.exerciseLogs);

  // 1. Paired Date Correlation (Sleep Hours vs Study Focus Rating)
  const correlationData = useMemo(() => {
    const pairs: Record<string, { date: string; sleep: number; focusSum: number; focusCount: number }> = {};
    
    // Map health sleep logs
    healthLogs.forEach((l) => {
      pairs[l.date] = { date: l.date, sleep: l.sleepHours, focusSum: 0, focusCount: 0 };
    });

    // Map study sessions focus ratings
    studySessions.forEach((s) => {
      const dateStr = format(parseISO(s.startTime), 'yyyy-MM-dd');
      if (pairs[dateStr]) {
        pairs[dateStr].focusSum += s.focusRating;
        pairs[dateStr].focusCount += 1;
      } else {
        pairs[dateStr] = { date: dateStr, sleep: 0, focusSum: s.focusRating, focusCount: 1 };
      }
    });

    // Format pairs with valid values
    return Object.values(pairs)
      .filter((p) => p.sleep > 0 && p.focusCount > 0)
      .map((p) => ({
        date: p.date,
        sleep: Number(p.sleep.toFixed(1)),
        focus: Number((p.focusSum / p.focusCount).toFixed(1)),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 points
  }, [healthLogs, studySessions]);

  // 2. Weekly Health & Study Trends (Last 8 Weeks)
  const weeklyTrends = useMemo(() => {
    const weeksData: Record<number, { week: string; studyHours: number; workouts: number; habitRate: number; count: number }> = {};
    const now = new Date();
    
    // Generate last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const weekStart = subDays(now, i * 7);
      const weekNum = format(weekStart, 'w');
      const label = `Wk ${weekNum}`;
      weeksData[Number(weekNum)] = { week: label, studyHours: 0, workouts: 0, habitRate: 0, count: 0 };
    }

    // Accumulate study hours
    studySessions.forEach((s) => {
      const date = parseISO(s.startTime);
      const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) {
        const weekNum = Number(format(date, 'w'));
        if (weeksData[weekNum]) {
          weeksData[weekNum].studyHours += s.durationMinutes / 60;
        }
      }
    });

    // Accumulate workouts
    exerciseLogs.forEach((l) => {
      const date = parseISO(l.date);
      const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) {
        const weekNum = Number(format(date, 'w'));
        if (weeksData[weekNum]) {
          weeksData[weekNum].workouts += 1;
        }
      }
    });

    // Accumulate habit rates
    habitLogs.forEach((l) => {
      const date = parseISO(l.date);
      const daysDiff = differenceInDays(now, date);
      if (daysDiff >= 0 && daysDiff < 56) {
        const weekNum = Number(format(date, 'w'));
        if (weeksData[weekNum]) {
          if (l.completed) {
            weeksData[weekNum].habitRate += 1;
          }
          weeksData[weekNum].count += 1;
        }
      }
    });

    return Object.values(weeksData).map((w) => ({
      week: w.week,
      studyHours: Number(w.studyHours.toFixed(1)),
      workouts: w.workouts,
      habitRate: w.count > 0 ? Math.round((w.habitRate / w.count) * 100) : 0,
    }));
  }, [studySessions, exerciseLogs, habitLogs]);

  // 3. Month-over-Month Comparative Analytics
  const momStats = useMemo(() => {
    const now = new Date();
    
    // Date ranges
    const thisMonthStart = subDays(now, 30);
    const lastMonthStart = subDays(now, 60);

    const getStatsForRange = (start: Date, end: Date) => {
      const inRange = (d: string) => {
        const parsed = parseISO(d);
        return parsed >= start && parsed < end;
      };

      // Tasks
      const rangeTasks = tasks.filter((t) => inRange(t.dueDate));
      const completedTasks = rangeTasks.filter((t) => t.status === 'done').length;
      const totalTasks = rangeTasks.length;
      const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

      // Study
      const rangeSessions = studySessions.filter((s) => inRange(s.startTime));
      const studyHours = rangeSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
      
      const focusAvg = rangeSessions.length > 0
        ? rangeSessions.reduce((sum, s) => sum + s.focusRating, 0) / rangeSessions.length
        : 0;

      // Habits
      const rangeLogs = habitLogs.filter((l) => inRange(l.date));
      const completedLogs = rangeLogs.filter((l) => l.completed).length;
      const totalLogs = rangeLogs.length;
      const habitRate = totalLogs > 0 ? Math.round((completedLogs / totalLogs) * 100) : 0;

      // Health sleep
      const rangeHealth = healthLogs.filter((l) => inRange(l.date));
      const sleepAvg = rangeHealth.length > 0
        ? rangeHealth.reduce((sum, l) => sum + l.sleepHours, 0) / rangeHealth.length
        : 0;

      return {
        taskRate,
        studyHours,
        focusAvg,
        habitRate,
        sleepAvg,
      };
    };

    const currentStats = getStatsForRange(thisMonthStart, now);
    const previousStats = getStatsForRange(lastMonthStart, thisMonthStart);

    const calcDelta = (cur: number, prev: number) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 100);
    };

    return {
      current: currentStats,
      previous: previousStats,
      deltas: {
        taskRate: currentStats.taskRate - previousStats.taskRate,
        studyHours: calcDelta(currentStats.studyHours, previousStats.studyHours),
        focusAvg: calcDelta(currentStats.focusAvg, previousStats.focusAvg),
        habitRate: currentStats.habitRate - previousStats.habitRate,
        sleepAvg: calcDelta(currentStats.sleepAvg, previousStats.sleepAvg),
      },
    };
  }, [tasks, studySessions, habitLogs, healthLogs]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-400" /> Advanced Analytics & Correlation
        </h1>
        <p className="text-gray-400 mt-1">
          Unlock hidden data trends. Discover how sleep, habits, and focus metrics align.
        </p>
      </div>

      {/* MoM Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex justify-between items-center text-2xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Study Hours</span>
            <span
              className={`text-2xs font-semibold ${
                momStats.deltas.studyHours >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {momStats.deltas.studyHours >= 0 ? '+' : ''}
              {momStats.deltas.studyHours}% MoM
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">{momStats.current.studyHours.toFixed(1)}h</h3>
          <p className="text-3xs text-gray-500">vs {momStats.previous.studyHours.toFixed(1)}h last month</p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex justify-between items-center text-2xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Planner Task Rate</span>
            <span
              className={`text-2xs font-semibold ${
                momStats.deltas.taskRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {momStats.deltas.taskRate >= 0 ? '+' : ''}
              {momStats.deltas.taskRate}% MoM
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">{momStats.current.taskRate}%</h3>
          <p className="text-3xs text-gray-500">vs {momStats.previous.taskRate}% last month</p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex justify-between items-center text-2xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Habit success</span>
            <span
              className={`text-2xs font-semibold ${
                momStats.deltas.habitRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {momStats.deltas.habitRate >= 0 ? '+' : ''}
              {momStats.deltas.habitRate}% MoM
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">{momStats.current.habitRate}%</h3>
          <p className="text-3xs text-gray-500">vs {momStats.previous.habitRate}% last month</p>
        </div>

        <div className="glass-card p-4 space-y-1">
          <div className="flex justify-between items-center text-2xs text-gray-400 font-bold uppercase tracking-wider">
            <span>Sleep Duration</span>
            <span
              className={`text-2xs font-semibold ${
                momStats.deltas.sleepAvg >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {momStats.deltas.sleepAvg >= 0 ? '+' : ''}
              {momStats.deltas.sleepAvg}% MoM
            </span>
          </div>
          <h3 className="text-2xl font-extrabold text-white">{momStats.current.sleepAvg.toFixed(1)}h</h3>
          <p className="text-3xs text-gray-500">vs {momStats.previous.sleepAvg.toFixed(1)}h last month</p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sleep vs Focus Scatter Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold text-gray-300">Sleep Duration vs Study Focus Rating</h3>
            <p className="text-3xs text-gray-500">Analysis of daily sleep hours vs average study focus (Last 30 data points)</p>
          </div>

          <div className="h-64">
            {correlationData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 italic">
                Need study logs and sleep logs on the same date to visualize correlations.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                  <XAxis
                    type="number"
                    dataKey="sleep"
                    name="Sleep"
                    unit="h"
                    domain={[4, 12]}
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="focus"
                    name="Focus"
                    domain={[1, 10]}
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Scatter name="Correlation Point" data={correlationData} fill="#6366f1">
                    {correlationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#8b5cf6'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 8-Week study vs workout bar chart (1 Col) */}
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold text-gray-300">Focused Study vs Exercise Trends</h3>
            <p className="text-3xs text-gray-500">Weekly study hours compared to workout sessions logged (Last 8 weeks)</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrends}>
                <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#8b5cf6" tick={{ fontSize: 9 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#e2e8f0',
                    fontSize: 11,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar yAxisId="left" dataKey="studyHours" name="Study (h)" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="workouts" name="Workouts" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Habit heat correlations */}
      <div className="glass-card p-5 space-y-4">
        <div className="border-b border-white/5 pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">Weekly Habit Success vs Academic Hours</h3>
            <p className="text-3xs text-gray-500">Compare overall habit completion percentage vs study hours (Last 8 weeks)</p>
          </div>
          <Percent className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends}>
              <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#6366f1" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#e2e8f0',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="habitRate" name="Habit Success (%)" stroke="#6366f1" strokeWidth={2} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="studyHours" name="Study Hours" stroke="#8b5cf6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
