import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, differenceInDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid } from 'date-fns';

// Date helpers
export const formatDate = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy') : '';
};

export const formatDateTime = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'MMM d, yyyy h:mm a') : '';
};

export const formatTime = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, 'h:mm a') : '';
};

export const formatRelative = (date: string | Date) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const getDateKey = (date?: Date) => {
  return format(date || new Date(), 'yyyy-MM-dd');
};

export const getWeekDays = (date?: Date) => {
  const start = startOfWeek(date || new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(date || new Date(), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
};

export const daysUntil = (date: string) => {
  const d = parseISO(date);
  return isValid(d) ? differenceInDays(d, new Date()) : 0;
};

// Time formatting
export const formatDuration = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export const formatTimerDisplay = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Math helpers
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

export const percentage = (value: number, total: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100);

export const calculateBMI = (weightKg: number, heightCm: number) => {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
};

export const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#f59e0b' };
  if (bmi < 25) return { label: 'Normal', color: '#10b981' };
  if (bmi < 30) return { label: 'Overweight', color: '#f97316' };
  return { label: 'Obese', color: '#ef4444' };
};

// Level system
export const XP_PER_LEVEL = 1000;

export const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const getLevelProgress = (xp: number) => {
  const currentLevelXP = xp % XP_PER_LEVEL;
  return percentage(currentLevelXP, XP_PER_LEVEL);
};

export const getXPToNextLevel = (xp: number) => {
  return XP_PER_LEVEL - (xp % XP_PER_LEVEL);
};

export const getLevelTitle = (level: number) => {
  if (level < 5) return 'Beginner';
  if (level < 10) return 'Apprentice';
  if (level < 15) return 'Dedicated';
  if (level < 20) return 'Expert';
  if (level < 25) return 'Master';
  if (level < 30) return 'Grandmaster';
  return 'Legend';
};

// Streak calculation
export const calculateStreak = (dates: string[]): { current: number; longest: number } => {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort().reverse();
  const today = getDateKey();
  const yesterday = getDateKey(new Date(Date.now() - 86400000));

  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Check if streak is still active (completed today or yesterday)
  if (sorted[0] === today || sorted[0] === yesterday) {
    for (let i = 0; i < sorted.length; i++) {
      const expected = getDateKey(new Date(Date.now() - i * 86400000));
      // Adjust: if first day is yesterday, offset by 1
      const offset = sorted[0] === yesterday ? 1 : 0;
      const expectedDate = getDateKey(new Date(Date.now() - (i + offset) * 86400000));
      if (sorted[i] === expectedDate) {
        current++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = differenceInDays(prev, curr);
    if (diff === 1) {
      tempStreak++;
    } else {
      longest = Math.max(longest, tempStreak);
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, tempStreak);

  return { current, longest };
};

// Color helpers
export const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Priority helpers
export const priorityConfig = {
  high: { label: 'High', color: '#ef4444', bgClass: 'bg-rose-500/20 text-rose-400' },
  medium: { label: 'Medium', color: '#f59e0b', bgClass: 'bg-amber-500/20 text-amber-400' },
  low: { label: 'Low', color: '#10b981', bgClass: 'bg-emerald-500/20 text-emerald-400' },
};

// Generate greeting based on time of day
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
};

// cn - simple class name merger
export const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');
