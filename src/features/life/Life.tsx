import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useGoalStore } from '@/stores/useGoalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { useAuthStore } from '@/stores/useAuthStore.ts';
import { useSettingsStore } from '@/stores/useSettingsStore.ts';
import { useJournalStore } from '@/stores/useJournalStore.ts';
import { getLevel, getLevelProgress, getLevelTitle } from '@/utils/helpers.ts';
import { Target, Trophy, PenLine, Settings, LogOut, Star, BookOpen, Zap, Moon, Sun } from 'lucide-react';
import { goalCategoryConfig } from '@/data/constants.ts';
import { format } from 'date-fns';

export function Life() {
  const navigate = useNavigate();
  const goals = useGoalStore((s) => s.goals);
  const totalXP = useGameStore((s) => s.totalXP);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const { profile, theme, toggleTheme } = useSettingsStore();
  const { addEntry } = useJournalStore();
  const { logout } = useAuthStore();
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  const level = getLevel(totalXP);
  const levelPct = getLevelProgress(totalXP);
  const title = getLevelTitle(level);
  const activeGoals = goals.filter((g) => !g.archived).slice(0, 4);
  const unlockedCount = unlockedAchievements.length;

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    addEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      wentWell: journalText,
      toImprove: '',
      learned: '',
      gratefulFor: '',
      distractions: '',
      tomorrowPriority: '',
      mood: 7,
      tags: [],
    });
    setJournalText('');
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 2000);
  };

  const quickLinks = [
    { label: 'All Goals', icon: Target, to: '/goals', color: '#6366f1' },
    { label: 'Achievements', icon: Trophy, to: '/achievements', color: '#f59e0b' },
    { label: 'Full Journal', icon: PenLine, to: '/journal', color: '#10b981' },
    { label: 'Health', icon: BookOpen, to: '/health', color: '#ef4444' },
    { label: 'AI Coach', icon: Zap, to: '/coach', color: '#8b5cf6' },
    { label: 'Settings', icon: Settings, to: '/settings', color: '#64748b' },
  ];

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">My Life</h1>
          <p className="text-2xs mt-1" style={{ color: 'var(--text-muted)' }}>Growth · Achievements · Reflection</p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleTheme} className="w-9 h-9 rounded-xl flex items-center justify-center glass-card">
            {theme === 'dark' ? <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} /> : <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />}
          </button>
        </div>
      </div>

      <div className="glass-card p-4 stat-glow-indigo">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Level {level} · {title}</p>
            <p className="text-xl font-black mt-0.5" style={{ color: 'var(--text-primary)' }}>{profile.name || 'Hemaprasad'}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
            <Star className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full gradient-primary transition-all duration-700" style={{ width: `${levelPct}%` }} />
          </div>
          <span className="text-2xs font-bold" style={{ color: '#818cf8' }}>{levelPct}%</span>
        </div>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>{totalXP.toLocaleString()}</p>
            <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Total XP</p>
          </div>
          <div>
            <p className="text-base font-extrabold" style={{ color: '#f59e0b' }}>{unlockedCount}</p>
            <p className="text-2xs" style={{ color: 'var(--text-muted)' }}>Badges</p>
          </div>
        </div>
      </div>

      {activeGoals.length > 0 && (
        <div>
          <div className="section-title"><span>Active Goals</span><button onClick={() => navigate('/goals')} className="text-[10px] font-semibold" style={{ color: '#818cf8' }}>See all →</button></div>
          <div className="space-y-2">
            {activeGoals.map((g, i) => {
              const cfg = goalCategoryConfig[g.category];
              const pct = g.progress;
              return (
                <button key={g.id} onClick={() => navigate('/goals')} className="w-full glass-card p-3 flex items-center gap-3 animate-slide-in-up text-left" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${cfg?.color || '#6366f1'}20` }}>{cfg?.icon || '🎯'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{g.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg?.color || '#6366f1' }} />
                      </div>
                      <span className="text-[10px] font-bold shrink-0" style={{ color: cfg?.color || '#6366f1' }}>{pct}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="section-title">Quick Journal</div>
        <div className="glass-card p-4">
          <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="How's your day going..." rows={3} className="modal-input resize-none w-full" />
          <button onClick={handleSaveJournal} className="mt-3 w-full py-2.5 rounded-xl gradient-primary text-white text-xs font-bold transition-all hover:opacity-90">
            {journalSaved ? '✓ Saved!' : 'Save Entry'}
          </button>
        </div>
      </div>

      <div>
        <div className="section-title">Navigate</div>
        <div className="grid grid-cols-3 gap-2.5">
          {quickLinks.map((link) => (
            <button key={link.label} onClick={() => navigate(link.to)} className="glass-card p-3 flex flex-col items-center gap-2 text-center hover:scale-[1.02] transition-transform">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${link.color}18` }}>
                <link.icon className="w-4 h-4" style={{ color: link.color }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { if (confirm('Sign out?')) logout(); }} className="w-full glass-card p-4 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>Sign Out</span>
        <LogOut className="w-4 h-4" style={{ color: '#ef4444' }} />
      </button>
    </div>
  );
}
