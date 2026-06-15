import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useStudyStore } from '@/stores/useStudyStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { getGreeting, getDateKey } from '@/utils/helpers.ts';
import { Circle, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const today = new Date();
  const todayKey = getDateKey(today);

  const profile = useSettingsStore((s) => s.profile);
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const addXP = useGameStore((s) => s.addXP);

  const subjects = useStudyStore((s) => s.subjects);
  const studySessions = useStudyStore((s) => s.sessions);

  const todayTasks = useMemo(() => tasks.filter((t) => t.dueDate === todayKey), [tasks, todayKey]);

  // Today's Mission (One sentence summary)
  const todayMissionText = useMemo(() => {
    const uncompleted = todayTasks.filter((t) => t.status !== 'done');
    if (uncompleted.length === 0) {
      return "All core priorities completed! Take time to reflect and rest.";
    }
    const mainTask = uncompleted.find((t) => t.priority === 'high') || uncompleted[0];
    const secondTask = uncompleted.find((t) => t.id !== mainTask.id) || null;

    if (secondTask) {
      return `Complete ${mainTask.title.toLowerCase()} and focus on ${secondTask.title.toLowerCase()} today.`;
    }
    return `Focus on completing ${mainTask.title.toLowerCase()} to secure your progress today.`;
  }, [todayTasks]);

  // Strict limit: 3 Things That Matter Today
  const top3Tasks = useMemo(() => {
    return [...todayTasks]
      .filter((t) => t.status !== 'done')
      .sort((a, b) => {
        const pOrder = { high: 0, medium: 1, low: 2 };
        return pOrder[a.priority] - pOrder[b.priority];
      })
      .slice(0, 3);
  }, [todayTasks]);

  // Continue Where You Left Off logic (last study session or subject)
  const lastStudyContext = useMemo(() => {
    if (studySessions.length > 0) {
      const sorted = [...studySessions].sort((a, b) => b.startTime.localeCompare(a.startTime));
      const lastSession = sorted[0];
      const subject = subjects.find((s) => s.id === lastSession.subjectId);
      if (subject) {
        return {
          title: subject.name,
          subtitle: lastSession.topic ? `Topic: ${lastSession.topic}` : 'Deep study session',
          desc: 'Continue learning block',
        };
      }
    }
    if (subjects.length > 0) {
      return {
        title: subjects[0].name,
        subtitle: 'Log your next study block',
        desc: 'Begin study sequence',
      };
    }
    return {
      title: 'Deep Work Session',
      subtitle: 'Activate Pomodoro timer',
      desc: 'Start new block',
    };
  }, [studySessions, subjects]);

  const greeting = getGreeting();

  const handleToggle = (id: string, title: string) => {
    toggleTask(id);
    addXP(15, 'task', `Completed task: ${title}`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-8 select-none max-w-md mx-auto pt-6">
      
      {/* 1. Greeting */}
      <div>
        <p className="text-label text-gray-500 uppercase tracking-widest">{format(today, 'EEEE, MMMM d')}</p>
        <h1 className="text-page-title text-white font-extrabold mt-1">{greeting}, {profile.name || 'Hemaprasad'}</h1>
      </div>

      {/* 2. Today's Mission (One sentence) */}
      <div className="py-2">
        <p className="text-label text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Today's Mission</p>
        <p className="text-section-title text-white font-bold leading-snug">{todayMissionText}</p>
      </div>

      {/* 3. Three Things That Matter Today */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <p className="text-label text-gray-500 uppercase tracking-widest font-bold">Daily Focus Priorities</p>
          <span className="text-label text-violet-400 font-bold">Only 3</span>
        </div>

        {top3Tasks.length === 0 ? (
          <div className="p-6 rounded-[20px] bg-[#121826] border border-white/5 text-center">
            <p className="text-body text-gray-400">Your core priorities are checked off. Enjoy the breathing room.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {top3Tasks.map((task) => (
              <button key={task.id} onClick={() => handleToggle(task.id, task.title)}
                className="w-full p-4 rounded-[20px] bg-[#121826] border border-white/5 flex items-start gap-4 text-left active:scale-[0.99] transition-all">
                <div className="shrink-0 mt-0.5">
                  <Circle className="w-5 h-5 text-gray-500 hover:text-violet-400 transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body font-bold text-white truncate">{task.title}</p>
                  {task.description && (
                    <p className="text-secondary-text text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Continue Where You Left Off */}
      <div className="space-y-3">
        <p className="text-label text-gray-500 uppercase tracking-widest font-bold px-1">Resume Routine</p>
        <button onClick={() => navigate('/focus')}
          className="w-full p-5 rounded-[20px] bg-[#121826] border border-white/5 flex items-center justify-between text-left active:scale-[0.99] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-card-title text-white font-extrabold">{lastStudyContext.title}</h4>
              <p className="text-secondary-text text-gray-400 mt-0.5">{lastStudyContext.subtitle}</p>
            </div>
          </div>
          <span className="text-label text-violet-400 font-bold">{lastStudyContext.desc} →</span>
        </button>
      </div>

      {/* 5. Jarvis AI Coach Message */}
      <div className="flex gap-3.5 items-start py-2">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-[#8B5CF6] flex items-center justify-center shrink-0 mt-1">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-label text-gray-500 uppercase tracking-widest font-bold">AI Companion</p>
          <p className="text-body text-gray-300 mt-1.5 leading-relaxed font-medium">
            {todayTasks.length > 0 
              ? "Yesterday you studied well after dinner. Focus on completing your daily priorities early today."
              : "Let's build momentum. Log a priority task to design your timeline for the day."}
          </p>
        </div>
      </div>

    </div>
  );
}
