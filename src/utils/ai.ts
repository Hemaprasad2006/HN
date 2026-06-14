interface AIConfig {
  apiKey: string;
  provider: 'gemini' | 'openai';
}

export async function generateAIContent(prompt: string, config: AIConfig): Promise<string> {
  const { apiKey, provider } = config;
  
  if (!apiKey) {
    throw new Error('API Key is missing');
  }

  if (provider === 'gemini') {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini API');
    }
    return text;
  } else {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI API returned status ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error('Empty response from OpenAI API');
    }
    return text;
  }
}

/**
 * Fallback generator for Weekly Reviews when no API key is provided
 */
export function generateMockWeeklyReviewInsights(stats: {
  tasksCompleted: number;
  tasksMissed: number;
  mostProductiveDay: string;
  habitSuccessRate: Record<string, number>;
  habitNames: Record<string, string>;
  studyHoursTotal: number;
  studySubjectMinutes: Record<string, number>;
  subjectNames: Record<string, string>;
  averageSleep: number;
  waterTotal: number;
  workoutCount: number;
}): string {
  const insights: string[] = [];

  insights.push(`### 🤖 HN AI Coach Heuristic Insights`);
  insights.push(`*Note: Configure a Gemini/OpenAI API key in Settings to receive real-time neural coaching analysis.*`);
  insights.push(``);

  // 1. Productivity Evaluation
  insights.push(`#### 📈 Productivity & Time Management`);
  const totalTasks = stats.tasksCompleted + stats.tasksMissed;
  const taskCompletionRate = totalTasks > 0 ? Math.round((stats.tasksCompleted / totalTasks) * 100) : 100;
  
  if (stats.tasksCompleted === 0 && stats.tasksMissed === 0) {
    insights.push(`- You didn't schedule or log any planner tasks this week. Keep your days structured by planning at least 2 key priorities every morning.`);
  } else {
    insights.push(`- Your task completion rate was **${taskCompletionRate}%** (completed ${stats.tasksCompleted} out of ${totalTasks}).`);
    if (stats.mostProductiveDay && stats.mostProductiveDay !== 'None') {
      insights.push(`- **${stats.mostProductiveDay}** was your peak productivity window. Study sessions and task completions clustered heavily around this day.`);
    }
    if (stats.tasksMissed > 3) {
      insights.push(`- **Warning**: Rollover tasks are accumulating (${stats.tasksMissed} missed). This indicates overestimating daily capacity. Try scheduling **only 3 Critical Tasks** per day and time-blocking them.`);
    } else {
      insights.push(`- Great job managing task rollover! Keeping your daily queue lean prevents fatigue.`);
    }
  }
  insights.push(``);

  // 2. Habits Analysis
  insights.push(`#### 🔁 Habit Streaks & Discipline`);
  const lowHabits: string[] = [];
  const highHabits: string[] = [];
  
  Object.entries(stats.habitSuccessRate).forEach(([habitId, rate]) => {
    const name = stats.habitNames[habitId] || 'Unnamed Habit';
    if (rate >= 80) highHabits.push(name);
    else if (rate < 50) lowHabits.push(name);
  });

  if (highHabits.length > 0) {
    insights.push(`- **Unshakeable Consistency**: You maintained solid discipline on **${highHabits.join(', ')}** (80%+ success). This reinforces positive neural patterns.`);
  }
  if (lowHabits.length > 0) {
    insights.push(`- **Needs Attention**: Consistency slipped on **${lowHabits.join(', ')}** (under 50% success). Try shifting these habits to a different "anchor" moment (e.g. read right after waking up, rather than before bed).`);
  }
  if (highHabits.length === 0 && lowHabits.length === 0) {
    insights.push(`- Start building habits! Commit to small daily targets (like drinking 2L of water) to kickstart your streak score.`);
  }
  insights.push(``);

  // 3. Study Analytics
  insights.push(`#### 🧠 Academic Progress & Focus`);
  if (stats.studyHoursTotal === 0) {
    insights.push(`- Zero study hours logged this week. If you are preparing for exams, establish a low barrier to entry: study for just 15 minutes a day to break procrastination.`);
  } else {
    insights.push(`- You spent a total of **${stats.studyHoursTotal.toFixed(1)} hours** in focused study.`);
    const subjects = Object.entries(stats.studySubjectMinutes).map(([id, mins]) => ({
      name: stats.subjectNames[id] || 'Other',
      hours: (mins / 60).toFixed(1),
    }));
    
    insights.push(`- Subjects studied: ${subjects.map(s => `**${s.name}** (${s.hours}h)`).join(', ')}.`);
    
    // Propose focus rating correlations
    if (stats.averageSleep < 6.5) {
      insights.push(`- **Analytics Correlation**: Your sleep averaged under 6.5 hours this week. Data suggests this correlates with lower focus ratings during study blocks. Prioritize sleep consistency to raise cognitive absorption.`);
    }
  }
  insights.push(``);

  // 4. Physical Health Review
  insights.push(`#### 🔋 Health & Energy Balance`);
  insights.push(`- **Sleep**: Your average sleep duration was **${stats.averageSleep.toFixed(1)} hours**. Aim for consistency; sleep is critical for neuroplasticity and memory consolidation.`);
  insights.push(`- **Hydration**: Total water intake logged: **${(stats.waterTotal / 1000).toFixed(1)} Liters**. Keep a bottle at your study desk to maintain steady focus.`);
  if (stats.workoutCount >= 3) {
    insights.push(`- **Active Lifestyle**: Logged **${stats.workoutCount} workouts** this week. Excellent physical load; this flushes cortisol and increases BDNF for learning.`);
  } else {
    insights.push(`- **Exercise recommendation**: You logged ${stats.workoutCount} workouts. Try to aim for at least 3 aerobic or resistance sessions next week to keep energy levels peak.`);
  }

  return insights.join('\n');
}

/**
 * Fallback generator for AI Coach Chat when no API key is provided
 */
export function generateMockAICoachResponse(
  userMessage: string,
  context: {
    userName: string;
    dailyFocus: string;
    tasksCompleted: number;
    tasksPending: number;
    habitStreak: number;
    studyHours: number;
    sleepHours: number;
    waterIntake: number;
  }
): string {
  const msg = userMessage.toLowerCase();

  const header = `🤖 **HN Heuristic Coach**:\n\n`;

  if (msg.includes('procrastinate') || msg.includes('procrastination') || msg.includes('lazy') || msg.includes('focus')) {
    return header + `Hi ${context.userName}. Procrastination is not a flaw in character; it is a mechanism for coping with stress or task-related anxiety.

Looking at your stats:
- **Pending Tasks**: You have **${context.tasksPending} tasks** in your planner queue.
- **Sleep Average**: **${context.sleepHours}h**. If sleep is low, your willpower and focus thresholds shrink.

**Actionable Advice**:
1. **The 5-Minute Rule**: Start a study timer for just 5 minutes. If you want to stop after 5 minutes, you have permission to do so. 90% of the time, the momentum carries you forward.
2. **Micro-Tasks**: Break down your biggest task into 3 trivial steps (e.g., instead of "Study Math", write: "Open book to page 45", "Read chapter introduction", "Do 1 problem").
3. **Use Focus Mode**: Start a 25-minute Pomodoro block in our **Focus** page right now. Turn off notifications.`;
  }

  if (msg.includes('study') || msg.includes('plan') || msg.includes('subject')) {
    return header + `Let's refine your academic approach, ${context.userName}. 

Currently, you've logged **${context.studyHours} hours** of study this week. To maximize retention:
1. **Spaced Repetition**: Don't cram one subject for 4 hours. Do 45-minute blocks split across subjects.
2. **Difficulty Mapping**: Study your hardest subject FIRST (eat the frog). Do this when cognitive energy is highest (typically 2-4 hours after waking).
3. **Active Recall**: After reading a chapter, close the notes and write down everything you remember in your **Journal**, then review what you missed.

Try starting a Focus session for your primary subject today!`;
  }

  if (msg.includes('motivation') || msg.includes('quote') || msg.includes('inspire')) {
    return header + `Here is a reminder for you, ${context.userName}:
    
> *"We are what we repeatedly do. Excellence, then, is not an act, but a habit."* — Aristotle

Motivation is temporary; **systems and discipline** are permanent. Don't wait until you "feel like it" to study or workout. Do it because your system commands it. You will level up and earn XP today! Let's get to work.`;
  }

  // Default response
  return header + `Greetings ${context.userName}! I am your HN AI Coach. 

Currently, I'm running in **Local Heuristic Mode** because no Gemini or OpenAI API Key has been configured in **Settings**. 

Here is my quick analysis of your active session:
- **Planner**: ${context.tasksCompleted} completed tasks, ${context.tasksPending} pending tasks.
- **Academic**: ${context.studyHours} study hours logged.
- **Health**: Sleep is at ${context.sleepHours}h; water logged is ${context.waterIntake}ml.

How can I help you today? You can ask me to:
- *"Give me a study plan"*
- *"How do I beat procrastination?"*
- *"Give me some motivation"*

*(Tip: Input your API Key in Settings to enable actual neural-network discussions with custom memory models!)*`;
}
