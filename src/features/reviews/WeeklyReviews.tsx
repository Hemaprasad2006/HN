import { useState, useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useWeeklyReviewStore } from '@/stores/useWeeklyReviewStore';
import { useGameStore } from '@/stores/useGameStore';
import { generateAIContent, generateMockWeeklyReviewInsights } from '@/utils/ai';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subWeeks,
  parseISO,
  isWithinInterval,
  getWeek,
  getYear,
} from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  Calendar,
  Sparkles,
  TrendingUp,
  Brain,
  Activity,
  Award,
  ChevronDown,
  Trash2,
  FileText,
  Lock,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export function WeeklyReviews() {
  const settings = useSettingsStore((s) => s.profile);
  const addXP = useGameStore((s) => s.addXP);
  
  const tasks = usePlannerStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const subjects = useStudyStore((s) => s.subjects);
  const studySessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);
  const exerciseLogs = useHealthStore((s) => s.exerciseLogs);

  const { reviews, saveWeeklyReview, deleteWeeklyReview } = useWeeklyReviewStore();

  // Selected week offset (0 = current week, 1 = last week, 2 = 2 weeks ago, etc.)
  const [weekOffset, setWeekOffset] = useState(0);
  const [aiInsights, setAiInsights] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);

  // Compute selected week date interval
  const weekStart = useMemo(() => {
    return startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }); // Monday start
  }, [weekOffset]);

  const weekEnd = useMemo(() => {
    return endOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }); // Sunday end
  }, [weekOffset]);

  const weekNum = useMemo(() => getWeek(weekStart), [weekStart]);
  const yearNum = useMemo(() => getYear(weekStart), [weekStart]);

  const weekString = useMemo(() => {
    return `Week ${weekNum} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')})`;
  }, [weekNum, weekStart, weekEnd]);

  // Check if a review already exists for this week
  const existingReview = useMemo(() => {
    return reviews.find((r) => r.year === yearNum && r.weekNumber === weekNum);
  }, [reviews, yearNum, weekNum]);

  // Aggregate stats for the selected week
  const weeklyStats = useMemo(() => {
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');
    const interval = { start: weekStart, end: weekEnd };

    // 1. Tasks
    const weekTasks = tasks.filter((t) => {
      const taskDate = parseISO(t.dueDate);
      return isWithinInterval(taskDate, interval);
    });
    const tasksCompleted = weekTasks.filter((t) => t.status === 'done').length;
    const tasksMissed = weekTasks.filter((t) => t.status !== 'done').length;

    // Find most productive day (most completed tasks)
    const completionsByDay: Record<string, number> = {};
    weekTasks
      .filter((t) => t.status === 'done' && t.completedAt)
      .forEach((t) => {
        const dayName = format(parseISO(t.completedAt!), 'EEEE');
        completionsByDay[dayName] = (completionsByDay[dayName] || 0) + 1;
      });
    let mostProductiveDay = 'None';
    let maxCompletions = 0;
    Object.entries(completionsByDay).forEach(([day, count]) => {
      if (count > maxCompletions) {
        maxCompletions = count;
        mostProductiveDay = day;
      }
    });

    // 2. Habits
    const habitSuccessRate: Record<string, number> = {};
    const habitNames: Record<string, string> = {};
    const daysInWeek = eachDayOfInterval(interval);
    
    habits.forEach((h) => {
      habitNames[h.id] = h.name;
      const completedDays = daysInWeek.filter((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return habitLogs.some((l) => l.habitId === h.id && l.date === dateStr && l.completed);
      }).length;
      habitSuccessRate[h.id] = Math.round((completedDays / 7) * 100);
    });

    // 3. Study
    const weekSessions = studySessions.filter((s) => {
      const sessDate = parseISO(s.startTime);
      return isWithinInterval(sessDate, interval);
    });
    const studyHoursTotal = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    
    const studySubjectMinutes: Record<string, number> = {};
    const subjectNames: Record<string, string> = {};
    subjects.forEach((s) => {
      subjectNames[s.id] = s.name;
    });

    weekSessions.forEach((s) => {
      studySubjectMinutes[s.subjectId] = (studySubjectMinutes[s.subjectId] || 0) + s.durationMinutes;
    });

    // Daily study chart data
    const dailyStudyData = daysInWeek.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const mins = studySessions
        .filter((s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);
      return {
        day: format(day, 'EEE'),
        hours: Number((mins / 60).toFixed(1)),
      };
    });

    // 4. Health
    const weekHealth = healthLogs.filter((l) => {
      const logDate = parseISO(l.date);
      return isWithinInterval(logDate, interval);
    });
    
    const averageSleep = weekHealth.length > 0
      ? weekHealth.reduce((sum, l) => sum + l.sleepHours, 0) / weekHealth.length
      : 0;

    const waterTotal = weekHealth.reduce((sum, l) => sum + l.waterIntake, 0);
    
    const weekWorkouts = exerciseLogs.filter((l) => {
      const exerciseDate = parseISO(l.date);
      return isWithinInterval(exerciseDate, interval);
    }).length;

    return {
      tasksCompleted,
      tasksMissed,
      mostProductiveDay,
      habitSuccessRate,
      habitNames,
      studyHoursTotal,
      studySubjectMinutes,
      subjectNames,
      averageSleep,
      waterTotal,
      workoutCount: weekWorkouts,
      dailyStudyData,
    };
  }, [weekStart, weekEnd, tasks, habits, habitLogs, subjects, studySessions, healthLogs, exerciseLogs]);

  // Generate Insights via AI or local heuristics
  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    setAiInsights('');
    
    const prompt = `You are a supportive but honest productivity coach analyzing my week of logs.
My stats for ${weekString}:
- Tasks: Completed ${weeklyStats.tasksCompleted}, Missed/Overdue ${weeklyStats.tasksMissed}. Most productive day: ${weeklyStats.mostProductiveDay}.
- Habits Completed: ${Object.entries(weeklyStats.habitSuccessRate)
      .map(([id, rate]) => `${weeklyStats.habitNames[id]}: ${rate}%`)
      .join(', ')}
- Study: Total ${weeklyStats.studyHoursTotal.toFixed(1)} hours studied. Breakdown by subjects: ${Object.entries(
      weeklyStats.studySubjectMinutes
    )
      .map(([id, mins]) => `${weeklyStats.subjectNames[id] || 'Other'}: ${(mins / 60).toFixed(1)}h`)
      .join(', ')}
- Sleep: Average ${weeklyStats.averageSleep.toFixed(1)} hours per night.
- Water Intake: Total ${(weeklyStats.waterTotal / 1000).toFixed(1)}L.
- Workouts: Logged ${weeklyStats.workoutCount} sessions.

Based on these statistics, provide:
1. A brief summary evaluation of my discipline and performance.
2. Analytics/correlations (e.g. how sleep or workouts impacted my studies or habit rates).
3. 3 actionable growth recommendations for next week.

Format the output beautifully with markdown headings and bullet points.`;

    try {
      const apiKey = settings.useModel === 'openai' ? settings.openaiApiKey : settings.geminiApiKey;
      if (apiKey) {
        const result = await generateAIContent(prompt, {
          apiKey,
          provider: settings.useModel || 'gemini',
        });
        setAiInsights(result);
      } else {
        // Fallback
        const result = generateMockWeeklyReviewInsights(weeklyStats);
        setAiInsights(result);
      }
      addXP(30, 'weekly-review', 'Generated weekly review insights');
    } catch (e: any) {
      console.error(e);
      // Fallback on API failure
      const result = generateMockWeeklyReviewInsights(weeklyStats);
      setAiInsights(`${result}\n\n*(Note: AI request failed - "${e.message}". Showing offline coaching heuristics).*`);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleLockReview = () => {
    if (!aiInsights) return;
    const finalReview = {
      id: `${yearNum}-W${weekNum}`,
      weekStartDate: format(weekStart, 'yyyy-MM-dd'),
      weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
      year: yearNum,
      weekNumber: weekNum,
      tasksCompleted: weeklyStats.tasksCompleted,
      tasksMissed: weeklyStats.tasksMissed,
      mostProductiveDay: weeklyStats.mostProductiveDay,
      habitSuccessRate: weeklyStats.habitSuccessRate,
      studyHoursTotal: weeklyStats.studyHoursTotal,
      studySubjectMinutes: weeklyStats.studySubjectMinutes,
      averageSleep: weeklyStats.averageSleep,
      waterTotal: weeklyStats.waterTotal,
      workoutCount: weeklyStats.workoutCount,
      aiInsights,
      createdAt: new Date().toISOString(),
    };
    saveWeeklyReview(finalReview);
    addXP(50, 'weekly-review', 'Locked and finalized weekly review');
  };

  const selectedPastReview = useMemo(() => {
    return reviews.find((r) => r.id === viewingReviewId);
  }, [reviews, viewingReviewId]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-400" /> Weekly Reflection System
          </h1>
          <p className="text-gray-400 mt-1">Review your habits, studies, health, and productivity logs weekly.</p>
        </div>

        {/* Selector */}
        <div className="flex items-center gap-2 bg-white/[0.04] p-1.5 rounded-xl border border-white/[0.06]">
          <select
            value={weekOffset}
            onChange={(e) => {
              setWeekOffset(Number(e.target.value));
              setAiInsights('');
            }}
            className="bg-transparent border-0 text-sm font-medium text-gray-200 outline-none pr-8 pl-2 cursor-pointer"
          >
            <option value={0} className="bg-slate-950">This Week (Current)</option>
            <option value={1} className="bg-slate-950">Last Week</option>
            <option value={2} className="bg-slate-950">2 Weeks Ago</option>
            <option value={3} className="bg-slate-950">3 Weeks Ago</option>
            <option value={4} className="bg-slate-950">4 Weeks Ago</option>
          </select>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Selected Week Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {existingReview && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-300 flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Review finalized and saved for {weekString}. Scroll down to delete/re-generate.</span>
            </div>
          )}

          {/* Core Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-card p-4 space-y-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Productivity</p>
              <h3 className="text-2xl font-bold text-white">
                {weeklyStats.tasksCompleted} <span className="text-xs text-gray-500">/ {weeklyStats.tasksCompleted + weeklyStats.tasksMissed}</span>
              </h3>
              <p className="text-2xs text-gray-500">Tasks Completed</p>
            </div>

            <div className="glass-card p-4 space-y-2">
              <Brain className="w-5 h-5 text-purple-400" />
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Study Hours</p>
              <h3 className="text-2xl font-bold text-white">{weeklyStats.studyHoursTotal.toFixed(1)}h</h3>
              <p className="text-2xs text-gray-500">Focused Study</p>
            </div>

            <div className="glass-card p-4 space-y-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Workouts</p>
              <h3 className="text-2xl font-bold text-white">{weeklyStats.workoutCount}</h3>
              <p className="text-2xs text-gray-500">Exercise Blocks</p>
            </div>

            <div className="glass-card p-4 space-y-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <p className="text-2xs font-semibold text-gray-400 uppercase tracking-wider">Avg Sleep</p>
              <h3 className="text-2xl font-bold text-white">{weeklyStats.averageSleep.toFixed(1)}h</h3>
              <p className="text-2xs text-gray-500">Hours / Night</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Daily Study Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyStats.dailyStudyData}>
                  <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }} />
                  <Bar dataKey="hours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Habit Weekly Completion Rate (%)</h3>
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {habits.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No habits registered yet.</p>
                ) : (
                  Object.entries(weeklyStats.habitSuccessRate).map(([id, rate]) => (
                    <div key={id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-300">
                        <span>{weeklyStats.habitNames[id]}</span>
                        <span>{rate}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Insights & Coach Actions */}
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> AI Coach Review & Recommendations
              </h3>
              {!existingReview && (
                <button
                  onClick={handleGenerateInsights}
                  disabled={loadingAI}
                  className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2"
                >
                  {loadingAI ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Synthesizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" /> Generate Insights
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Response Output */}
            {(aiInsights || (existingReview && existingReview.aiInsights)) ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-gray-300 leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans">
                  {aiInsights || existingReview?.aiInsights}
                </div>

                {!existingReview && aiInsights && (
                  <button
                    onClick={handleLockReview}
                    className="btn-secondary w-full py-2 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Finalize & Lock Week Review
                  </button>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500 space-y-2">
                <Sparkles className="w-8 h-8 text-white/10 mx-auto" />
                <p className="text-sm font-semibold">Ready to reflect on your week?</p>
                <p className="text-xs max-w-xs mx-auto">
                  Click 'Generate Insights' above. Our coach will analyze your logs and output custom tips.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Historical Review List */}
        <div className="glass-card p-6 space-y-4 h-[fit-content]">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Award className="w-5 h-5 text-indigo-400" /> Historical Records
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-10">No weekly reviews locked yet.</p>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all flex items-center justify-between cursor-pointer"
                  onClick={() => setViewingReviewId(rev.id)}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Year {rev.year} - Week {rev.weekNumber}</p>
                    <p className="text-3xs text-gray-500">{rev.weekStartDate} to {rev.weekEndDate}</p>
                    <div className="flex gap-2 pt-1 text-4xs uppercase tracking-wider text-indigo-400">
                      <span>Tasks: {rev.tasksCompleted}</span>
                      <span>Study: {rev.studyHoursTotal.toFixed(1)}h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingReviewId(rev.id)}
                      className="text-2xs bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 px-2 py-1 rounded transition-all"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteWeeklyReview(rev.id)}
                      className="text-gray-500 hover:text-rose-500 p-1.5 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal View for past review logs */}
      <Modal
        isOpen={!!viewingReviewId}
        onClose={() => setViewingReviewId(null)}
        title={selectedPastReview ? `Weekly Record — Week ${selectedPastReview.weekNumber} (${selectedPastReview.year})` : ''}
        size="lg"
      >
        {selectedPastReview && (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-2xs text-gray-400 uppercase">Productivity</span>
                <p className="text-lg font-bold text-white">{selectedPastReview.tasksCompleted} done</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-2xs text-gray-400 uppercase">Study</span>
                <p className="text-lg font-bold text-white">{selectedPastReview.studyHoursTotal.toFixed(1)}h</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-2xs text-gray-400 uppercase">Sleep</span>
                <p className="text-lg font-bold text-white">{selectedPastReview.averageSleep.toFixed(1)}h</p>
              </div>
              <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                <span className="text-2xs text-gray-400 uppercase">Workouts</span>
                <p className="text-lg font-bold text-white">{selectedPastReview.workoutCount} sessions</p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Weekly Coaching Output</h4>
              <div className="p-4 rounded-xl bg-slate-950/75 border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                {selectedPastReview.aiInsights}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
