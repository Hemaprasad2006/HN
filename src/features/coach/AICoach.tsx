import { useState, useEffect, useRef, useMemo } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { useHealthStore } from '@/stores/useHealthStore';
import { useGameStore } from '@/stores/useGameStore';
import { generateAIContent, generateMockAICoachResponse } from '@/utils/ai';
import { Send, Bot, Sparkles, RefreshCw, Trash2, Calendar, HelpCircle } from 'lucide-react';
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
  text: `Hello! I am your LifeOS AI Growth Coach. 🧠

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

  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lifeos-coach-chat-history');
    if (saved) {
      try {
        setChatHistory(JSON.parse(saved));
      } catch (e) {
        setChatHistory([welcomeMessage]);
      }
    } else {
      setChatHistory([welcomeMessage]);
    }
  }, []);

  // Save chat history
  const saveChat = (history: Message[]) => {
    setChatHistory(history);
    localStorage.setItem('lifeos-coach-chat-history', JSON.stringify(history));
  };

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Compile today's context for the AI
  const todayContext = useMemo(() => {
    const todayStr = getDateKey();
    
    // Planner
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
    const tasksCompleted = todayTasks.filter((t) => t.status === 'done').length;
    const tasksPending = todayTasks.filter((t) => t.status !== 'done').length;

    // Habits
    const todayLogs = habitLogs.filter((l) => l.date === todayStr && l.completed);
    const habitStreak = todayLogs.length;

    // Study
    const todaySessions = sessions.filter(
      (s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === todayStr
    );
    const studyHours = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0) / 60;

    // Health
    const todayHealth = healthLogs.find((l) => l.date === todayStr);
    const sleepHours = todayHealth?.sleepHours || 0;
    const waterIntake = todayHealth?.waterIntake || 0;

    function parseISO(s: string): Date {
      return new Date(s);
    }

    return {
      userName: profile.name,
      dailyFocus: profile.dailyFocus || 'None',
      tasksCompleted,
      tasksPending,
      habitStreak,
      studyHours,
      sleepHours,
      waterIntake,
    };
  }, [profile, tasks, habitLogs, sessions, healthLogs]);

  // Handle message submission
  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory = [...chatHistory, userMsg];
    saveChat(updatedHistory);
    setInputText('');
    setLoading(true);

    // Build the instruction prompt
    const prompt = `You are a supportive but honest personal growth and productivity coach in a LifeOS application.
Currently chatting with user: ${profile.name} (Daily Focus: "${profile.dailyFocus || 'None'}").
Today's metrics for ${format(new Date(), 'yyyy-MM-dd')}:
- Tasks: Completed ${todayContext.tasksCompleted}, Pending ${todayContext.tasksPending}.
- Habits checked off today: ${todayContext.habitStreak}.
- Studies logged today: ${todayContext.studyHours.toFixed(1)} hours.
- Sleep: ${todayContext.sleepHours} hours.
- Water Intake: ${todayContext.waterIntake} ml.

Keep your response supportive, concise, and highly actionable. Direct the user to change concrete routines if their targets are being missed.

Chat history:
${updatedHistory
  .slice(-8)
  .map((m) => `${m.sender === 'user' ? 'User' : 'Coach'}: ${m.text}`)
  .join('\n')}

Coach:`;

    try {
      const apiKey = profile.useModel === 'openai' ? profile.openaiApiKey : profile.geminiApiKey;
      let coachReplyText = '';

      if (apiKey) {
        coachReplyText = await generateAIContent(prompt, {
          apiKey,
          provider: profile.useModel || 'gemini',
        });
      } else {
        // Fallback Heuristic response
        coachReplyText = generateMockAICoachResponse(messageText, todayContext);
      }

      const coachMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'coach',
        text: coachReplyText,
        timestamp: new Date().toISOString(),
      };
      
      saveChat([...updatedHistory, coachMsg]);
      addXP(15, 'coach', 'Consulted AI Life Coach');
    } catch (e: any) {
      console.error(e);
      const coachMsg: Message = {
        id: crypto.randomUUID(),
        sender: 'coach',
        text: `I ran into an issue connecting to the AI models: "${e.message}".\n\nHere is a local suggestion: try focusing on your core targets today, drink some water, and run a study block!`,
        timestamp: new Date().toISOString(),
      };
      saveChat([...updatedHistory, coachMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all coach discussion logs?')) {
      saveChat([welcomeMessage]);
    }
  };

  const templates = [
    { label: 'Beat Procrastination', prompt: 'How do I beat procrastination and tackle my pending planner tasks?' },
    { label: 'Custom Study Plan', prompt: 'Recommend a study plan to help me reach my study targets today.' },
    { label: 'Motivation Pep Talk', prompt: 'Give me a motivation boost. I need a supportive pep talk.' },
    { label: 'Log Analysis', prompt: 'Review my logged sleep, water, and planner tasks today. Give me an evaluation.' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-8 h-8 text-indigo-400" /> AI Coach Chat
          </h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Discuss routines, habits, and study focus logs with your growth companion.
          </p>
        </div>
        
        <button
          onClick={handleClearHistory}
          className="p-2 text-gray-500 hover:text-rose-500 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main chat window split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden">
        {/* Left: Quick Templates (1 Col) */}
        <div className="md:col-span-1 glass-card p-4 space-y-3 flex flex-col justify-start h-fit">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Coaching Presets
          </h3>
          <div className="flex flex-wrap md:flex-col gap-2">
            {templates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => handleSend(tpl.prompt)}
                disabled={loading}
                className="text-left text-xs p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/30 text-gray-300 hover:text-white transition-all disabled:opacity-50"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Messages window (3 Cols) */}
        <div className="md:col-span-3 glass-card flex flex-col h-full overflow-hidden">
          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {/* Icon bubble */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-indigo-400'
                      : 'bg-violet-600/10 border-violet-500/25 text-violet-400'
                  }`}
                >
                  {msg.sender === 'user' ? 'ME' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white/[0.03] border border-white/[0.05] text-gray-200 rounded-tl-none font-sans'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-violet-600/10 border border-violet-500/25 text-violet-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.05] text-gray-500 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Form input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className="p-3 bg-slate-950/40 border-t border-white/[0.06] flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask coach anything..."
              disabled={loading}
              className="flex-1 input-field border-0 bg-white/[0.02] focus:bg-white/[0.04] placeholder-gray-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-30 flex items-center justify-center shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
