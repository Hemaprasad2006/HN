import { format, subDays } from 'date-fns';

export const XP_PER_LEVEL = 1000;

export const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const percentage = (value: number, total: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100);

export const getLevelProgress = (xp: number) => {
  const currentLevelXP = xp % XP_PER_LEVEL;
  return percentage(currentLevelXP, XP_PER_LEVEL);
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

export const getDateKey = (date: Date = new Date()) => {
  return format(date, 'yyyy-MM-dd');
};

// Streak calculation
export const calculateStreak = (dates: string[]): { current: number; longest: number } => {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...dates].sort().reverse();
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let current = 0;
  let longest = 0;
  let tempStreak = 0;

  // Check if streak is still active
  if (sorted[0] === today || sorted[0] === yesterday) {
    for (let i = 0; i < sorted.length; i++) {
      const offset = sorted[0] === yesterday ? 1 : 0;
      const expectedDate = format(subDays(new Date(), i + offset), 'yyyy-MM-dd');
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
    const diff = Math.round((prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 1) {
      tempStreak++;
    } else if (diff > 1) {
      longest = Math.max(longest, tempStreak);
      tempStreak = 1;
    }
  }
  longest = Math.max(longest, tempStreak);

  return { current, longest };
};
export default {
  getLevel,
  getLevelProgress,
  getLevelTitle,
  formatDuration,
  formatTimerDisplay,
  getDateKey,
  calculateStreak,
};
