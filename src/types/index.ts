// ============================================
// HN — Type Definitions
// ============================================

// --- Common Types ---
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type GoalCategory = 'health' | 'studies' | 'career' | 'financial' | 'personal' | 'relationships' | 'spiritual';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';
export type ThemeMode = 'dark' | 'light';

// --- Goals ---
export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  why: string;
  category: GoalCategory;
  deadline: string; // ISO date
  priority: Priority;
  milestones: Milestone[];
  progress: number; // 0-100
  createdAt: string;
  archived: boolean;
}

// --- Tasks / Planner ---
export interface Task {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  dueDate: string; // ISO date
  estimatedMinutes: number;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

// --- Habits ---
export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  targetCount: number;
  createdAt: string;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  count: number;
}

// --- Study ---
export interface Subject {
  id: string;
  name: string;
  totalChapters: number;
  completedChapters: number;
  difficulty: number; // 1-5
  notes: string;
  color: string;
  createdAt: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topic: string;
  startTime: string; // ISO datetime
  endTime: string;
  durationMinutes: number;
  focusRating: number; // 1-10
  productivityRating: number; // 1-10
  notes: string;
  createdAt: string;
}

// --- Focus ---
export interface FocusSession {
  id: string;
  type: 'pomodoro' | 'custom';
  durationMinutes: number;
  breakMinutes: number;
  subjectId?: string;
  topic?: string;
  startTime: string;
  endTime?: string;
  completed: boolean;
  createdAt: string;
}

// --- Health ---
export interface HealthLog {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number; // kg
  height?: number; // cm
  waterIntake: number; // ml
  sleepHours: number;
  steps?: number;
  caloriesBurned?: number;
  createdAt: string;
}

export interface ExerciseLog {
  id: string;
  date: string;
  type: string;
  durationMinutes: number;
  intensity: 'light' | 'moderate' | 'intense';
  caloriesBurned?: number;
  notes: string;
  createdAt: string;
}

// --- Journal ---
export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  wentWell: string;
  toImprove: string;
  learned: string;
  gratefulFor: string;
  distractions: string;
  tomorrowPriority: string;
  mood: number; // 1-10
  tags: string[];
  createdAt: string;
}

// --- Gamification ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: string; // machine-readable condition key
  unlockedAt?: string;
}

export interface XPEvent {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}

// --- Settings ---
export interface UserProfile {
  name: string;
  dailyFocus: string;
  height?: number; // cm
  targetWeight?: number; // kg
  targetWater: number; // ml
  targetSleep: number; // hours
  targetStudyHours: number;
  pomodoroWork: number; // minutes
  pomodoroBreak: number;
  pomodoroLongBreak: number;
  geminiApiKey?: string;
  openaiApiKey?: string;
  useModel?: 'gemini' | 'openai';
  notificationsEnabled: boolean;
  reminderIntervalMinutes: number;
  lastReviewPromptedDate?: string;
}

// --- Weekly Reviews ---
export interface WeeklyReview {
  id: string;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string;   // YYYY-MM-DD
  year: number;
  weekNumber: number;
  tasksCompleted: number;
  tasksMissed: number;
  mostProductiveDay: string;
  habitSuccessRate: Record<string, number>; // habitId -> percentage
  studyHoursTotal: number;
  studySubjectMinutes: Record<string, number>; // subjectId -> minutes
  averageSleep: number;
  waterTotal: number;
  workoutCount: number;
  aiInsights: string;
  createdAt: string;
}

// --- Alerts / Notifications ---
export interface ReminderAlert {
  id: string;
  time: string; // HH:MM
  type: 'habit' | 'water' | 'study' | 'sleep' | 'planner';
  label: string;
  enabled: boolean;
}
