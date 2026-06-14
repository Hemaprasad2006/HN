import { useState, useEffect, useRef, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useGameStore } from '@/stores/useGameStore';
import { generateAIContent, generateMockAICoachResponse } from '@/utils/ai';
import { Send, Bot, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { getDateKey } from '@/utils/helpers';

interface Message {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

const welcomeMessage: Message = {
  id: 'welcome',
  sender: 'coach',
  text: `Hello! I am your HN AI Growth Coach. 🧠

I have real-time visibility into your Daily Planner, Habit logs, Study sessions, and physical Health metrics.

I'm here to analyze your trends, support your routines, and offer direct recommendations. How can I help you level up today?`,
  timestamp: new Date().toISOString(),
};

export function AICoach() {
  const profile = useSettingsStore((s) => s.profile);
  const addXP = useGameStore((s) => s.addXP);
  const tasks = usePlannerStore((s) => s.tasks);
  const habits = useHabitStore((s) => s.habits);
  const habitLogs = useHabitStore((s) => s.logs);
  const subjects = useStudyStore((s) => s.subjects);
  const sessions = useStudyStore((s) => s.sessions);
  const healthLogs = useHealthStore((s) => s.healthLogs);

  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hn-coach-chat-history');
    if (saved) {
      try { setChatHistory(JSON.parse(saved)); } catch (e) { setChatHistory([welcomeMessage]); }
    } else {
      setChatHistory([welcomeMessage]);
    }
  }, []);

  const saveChat = (history: Message[]) => {
    setChatHistory(history);
    localStorage.setItem('hn-coach-chat-history', JSON.stringify(history));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const todayContext = useMemo(() => {
    const todayStr = getDateKey();
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
    const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;
    const tasksPending = todayTasks.filter((t) => t.status !== 'done').length;
    const todayLogs = habitLogs.filter((l) => l.date === todayStr && l.completed);
    const habitStreak = todayLogs.length;
    function parseISO(s: string): Date { return new Date(s); }
    const todaySessions = sessions.filter((s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === todayStr);
    const studyHours = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;
    const todayHealth = healthLogs.find((l) => l.date === todayStr);
    return {
      userName: profile.name, dailyFocus: profile.dailyFocus || 'None',
      tasksCompleted, tasksPending, habitStreak, studyHours,
      sleepHours: todayHealth?.sleepHours || 0, waterIntake: todayHealth?.waterIntake || 0,
    };
  }, [profile, tasks, habitLogs, sessions, healthLogs]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), sender: 'user', text: messageText, timestamp: new Date().toISOString() };
    const updatedHistory = [...chatHistory, userMsg];
    saveChat(updatedHistory);
    setInputText('');
    setLoading(true);
    const prompt = `You are a supportive but honest personal growth and productivity coach in a HN application.
Currently chatting with user: ${profile.name} (Daily Focus: "${profile.dailyFocus || 'None'}").
Today's metrics for ${format(new Date(), 'yyyy-MM-dd')}:
- Tasks: Completed ${todayContext.tasksCompleted}, Pending ${todayContext.tasksPending}.
- Habits checked off today: ${todayContext.habitStreak}.
- Studies logged today: ${todayContext.studyHours.toFixed(1)} hours.
- Sleep: ${todayContext.sleepHours} hours.
- Water Intake: ${todayContext.waterIntake} ml.
Keep your response supportive, concise, and highly actionable.
Chat history:
${updatedHistory.slice(-8).map((m) => `${m.sender === 'user' ? 'User' : 'Coach'}: ${m.text}`).join('\n')}
Coach:`;
    try {
      const apiKey = profile.useModel === 'openai' ? profile.openaiApiKey : profile.geminiApiKey;
      let coachReplyText = '';
      if (apiKey) {
        coachReplyText = await generateAIContent(prompt, { apiKey, provider: profile.useModel || 'gemini' });
      } else {
        coachReplyText = generateMockAICoachResponse(messageText, todayContext);
      }
      const coachMsg: Message = { id: crypto.randomUUID(), sender: 'coach', text: coachReplyText, timestamp: new Date().toISOString() };
      saveChat([...updatedHistory, coachMsg]);
      addXP(15, 'coach', 'Consulted AI Life Coach');
    } catch (e: any) {
      const coachMsg: Message = { id: crypto.randomUUID(), sender: 'coach', text: `I ran into an issue: "${e.message}".\n\nHere is a local suggestion: focus on your core targets today, drink some water, and run a study block!`, timestamp: new Date().toISOString() };
      saveChat([...updatedHistory, coachMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all coach discussion logs?')) saveChat([welcomeMessage]);
  };

  const templates = [
    { label: '🚀 Beat Procrastination', prompt: 'How do I beat procrastination and tackle my pending planner tasks?' },
    { label: '📚 Study Plan', prompt: 'Recommend a study plan to help me reach my study targets today.' },
    { label: '💪 Pep Talk', prompt: 'Give me a motivation boost. I need a supportive pep talk.' },
    { label: '📊 Log Analysis', prompt: 'Review my logged sleep, water, and planner tasks today. Give me an evaluation.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] max-w-4xl mx-auto gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" /> AI Coach
          </h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Your personal growth companion</p>
        </div>
        <button onClick={handleClearHistory}
          className="p-2 text-gray-500 hover:text-rose-500 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          title="Clear chat history">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Preset chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {templates.map((tpl, i) => (
          <button key={i} onClick={() => handleSend(tpl.prompt)} disabled={loading}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-indigo-500/20 hover:border-indigo-500/40 text-gray-300 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap">
            {tpl.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex gap-2.5 max-w-[88%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-xl shrink-0 flex items-center justify-center border text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400'
                  : 'bg-violet-600/10 border-violet-500/25 text-violet-400'
              }`}>
                {msg.sender === 'user' ? 'ME' : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`px-3 py-2.5 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white/[0.04] border border-white/[0.06] text-gray-200 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5 max-w-[88%]">
              <div className="w-7 h-7 rounded-xl shrink-0 flex items-center justify-center bg-violet-600/10 border border-violet-500/25 text-violet-400">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="px-3 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-gray-500 flex items-center gap-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> Thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(inputText); }}
          className="p-3 bg-slate-950/40 border-t border-white/[0.06] flex gap-2">
          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask coach anything..." disabled={loading}
            className="flex-1 input-field border-0 bg-white/[0.02] focus:bg-white/[0.04] placeholder-gray-500 text-sm" />
          <button type="submit" disabled={!inputText.trim() || loading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 flex items-center justify-center shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
