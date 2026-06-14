import { useMemo } from 'react';
import {
  Trophy,
  Zap,
  Star,
  Lock,
  Flame,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';
import { useGameStore } from '@/stores/useGameStore.ts';
import { achievementsList } from '@/data/constants.ts';
import {
  getLevel,
  getLevelProgress,
  getLevelTitle,
  getXPToNextLevel,
  formatDateTime,
  cn,
  calculateStreak,
  XP_PER_LEVEL,
} from '@/utils/helpers.ts';

export function Gamification() {
  const totalXP = useGameStore((s) => s.totalXP);
  const xpHistory = useGameStore((s) => s.xpHistory);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);

  const level = getLevel(totalXP);
  const levelProgress = getLevelProgress(totalXP);
  const levelTitle = getLevelTitle(level);
  const xpToNext = getXPToNextLevel(totalXP);
  const currentLevelXP = totalXP % XP_PER_LEVEL;

  const isUnlocked = (id: string) => {
    return unlockedAchievements.includes(id);
  };

  const unlockedCount = unlockedAchievements.length;
  const totalAchievements = achievementsList.length;

  const appStreak = useMemo(() => {
    return xpHistory.length > 0 ? Math.min(xpHistory.length, 30) : 0;
  }, [xpHistory]);

  const recentXP = xpHistory.slice(0, 20);

  const stats = [
    {
      label: 'Total XP',
      value: totalXP.toLocaleString(),
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      glow: 'stat-glow-amber',
    },
    {
      label: 'Current Level',
      value: level,
      icon: Star,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15',
      glow: 'stat-glow-indigo',
    },
    {
      label: 'Achievements',
      value: `${unlockedCount} / ${totalAchievements}`,
      icon: Trophy,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      glow: 'stat-glow-emerald',
    },
    {
      label: 'App Streak',
      value: `${appStreak} days`,
      icon: Flame,
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
      glow: 'stat-glow-rose',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
          <Trophy size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-100 dark:text-gray-100 text-gray-900">
            Achievements
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-500">
            Your journey of growth
          </p>
        </div>
      </div>

      {/* ─── HERO: Level Display ─── */}
      <div className="glass-card relative overflow-hidden p-8 lg:p-10">
        {/* Decorative glow blobs */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Level number with mega glow */}
          <div className="relative mb-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-indigo-500/20 blur-2xl animate-pulse" />
            </div>
            <span className="relative text-8xl lg:text-9xl font-black gradient-text leading-none animate-float">
              {level}
            </span>
          </div>

          {/* Level title */}
          <h2 className="mb-1 text-2xl lg:text-3xl font-bold text-gray-100 dark:text-gray-100 text-gray-900">
            {levelTitle}
          </h2>
          <p className="mb-6 text-sm text-gray-400 dark:text-gray-400 text-gray-500">
            Level {level} · {totalXP.toLocaleString()} Total XP
          </p>

          {/* XP Progress Bar */}
          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-gray-400 dark:text-gray-400 text-gray-500">
                {currentLevelXP.toLocaleString()} / {XP_PER_LEVEL.toLocaleString()} XP
              </span>
              <span className="font-semibold text-indigo-400">{levelProgress}%</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-800/80 dark:bg-slate-800/80 bg-gray-200">
              <div
                className="xp-bar h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500 text-gray-400">
              <span className="font-semibold text-violet-400">{xpToNext.toLocaleString()}</span> XP to
              next level
            </p>
          </div>
        </div>
      </div>

      {/* ─── Stats Overview ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={cn(
              'glass-card p-5 animate-slide-in-up',
              stat.glow,
              `animation-delay-${(idx + 1) * 100}`
            )}
          >
            <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-100 dark:text-gray-100 text-gray-900">
              {stat.value}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-400 text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Achievements Grid ─── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Award size={20} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-100 text-gray-900">
            All Achievements
          </h2>
          <span className="ml-auto rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-400">
            {unlockedCount} / {totalAchievements} unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {achievementsList.map((achievement, idx) => {
            const unlocked = isUnlocked(achievement.id);
            return (
              <div
                key={achievement.id}
                className={cn(
                  'glass-card relative overflow-hidden p-5 transition-all duration-300',
                  unlocked
                    ? 'animate-badge-pop ring-1 ring-indigo-500/30'
                    : 'opacity-60 grayscale',
                  `animation-delay-${Math.min((idx % 8) * 100, 500).toString() as '100' | '200' | '300' | '400' | '500'}`
                )}
                style={{
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                {/* Glow effect for unlocked */}
                {unlocked && (
                  <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-indigo-500/20 blur-2xl" />
                )}

                {/* Lock overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30 dark:bg-slate-900/30 bg-white/30 backdrop-blur-[1px] rounded-2xl">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80 dark:bg-slate-800/80 bg-gray-200">
                      <Lock size={16} className="text-gray-500" />
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Icon */}
                  <div className="mb-3 text-4xl">{achievement.icon}</div>

                  {/* Title */}
                  <h3 className="mb-1 text-sm font-semibold text-gray-100 dark:text-gray-100 text-gray-900">
                    {achievement.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-3 text-xs text-gray-400 dark:text-gray-400 text-gray-500 leading-relaxed">
                    {achievement.description}
                  </p>

                  {/* XP Badge */}
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1">
                    <Zap size={12} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">
                      +{achievement.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Recent XP History ─── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-100 dark:text-gray-100 text-gray-900">
            Recent XP History
          </h2>
        </div>

        {recentXP.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Clock size={32} className="mx-auto mb-3 text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-400 text-gray-500">
              No XP events yet. Start completing tasks and building habits to earn XP!
            </p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden p-1">
            <div className="relative space-y-0">
              {recentXP.map((event, idx) => (
                <div
                  key={event.id}
                  className={cn(
                    'group relative flex items-center gap-4 px-5 py-3.5 transition-colors',
                    'hover:bg-white/5 dark:hover:bg-white/5 hover:bg-gray-50',
                    idx !== recentXP.length - 1 &&
                      'border-b border-white/5 dark:border-white/5 border-gray-100'
                  )}
                >
                  {/* Timeline dot */}
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15">
                      <Zap size={14} className="text-indigo-400" />
                    </div>
                    {idx !== recentXP.length - 1 && (
                      <div className="absolute top-8 h-full w-px bg-white/10 dark:bg-white/10 bg-gray-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 dark:text-gray-200 text-gray-800 truncate">
                      {event.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(event.timestamp)}
                    </p>
                  </div>

                  {/* XP amount */}
                  <div className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 shrink-0">
                    <Zap size={12} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">+{event.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
