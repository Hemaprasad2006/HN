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
  const activeGoals = goals.filter((g) => !g.archived).slice(0, 3);
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
    { label: 'All Goals', icon: Target, to: '/goals', color: '#8B5CF6' },
    { label: 'Achievements', icon: Trophy, to: '/achievements', color: '#F59E0B' },
    { label: 'Full Journal', icon: PenLine, to: '/journal', color: '#22C55E' },
    { label: 'Health', icon: BookOpen, to: '/health', color: '#EF4444' },
    { label: 'AI Coach', icon: Zap, to: '/coach', color: '#8B5CF6' },
    { label: 'Settings', icon: Settings, to: '/settings', color: '#64748B' },
  ];

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white font-extrabold">My Life</h1>
          <p className="text-secondary-text text-gray-400 mt-1">XP Progression, Goals, and Tools</p>
        </div>
        <button onClick={toggleTheme} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#141B2D] border border-white/5 active:scale-90 transition-transform">
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#F59E0B]" /> : <Moon className="w-4 h-4 text-[#8B5CF6]" />}
        </button>
      </div>

      {/* Gamification Level Status Card */}
      <div className="glass-card p-4 bg-[#141B2D] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label text-gray-400 font-bold uppercase tracking-wider">Level {level} · {title}</p>
            <p className="text-card-title text-white font-black mt-0.5">{profile.name || 'Hemaprasad'}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 text-[#8B5CF6] flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] transition-all duration-500" style={{ width: `${levelPct}%` }} />
          </div>
          <span className="text-label font-bold text-[#8B5CF6]">{levelPct}%</span>
        </div>

        <div className="flex gap-6 mt-1 text-left">
          <div>
            <p className="text-body font-extrabold text-white">{totalXP.toLocaleString()}</p>
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider">Total XP</p>
          </div>
          <div>
            <p className="text-body font-extrabold text-[#F59E0B]">{unlockedCount}</p>
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider">Achievements</p>
          </div>
        </div>
      </div>

      {/* Active Goal Checklist */}
      {activeGoals.length > 0 && (
        <div>
          <div className="text-label text-gray-400 uppercase tracking-wider mb-3 px-1 flex justify-between items-center">
            <span>Core Goals</span>
            <button onClick={() => navigate('/goals')} className="text-[#8B5CF6] font-bold">See all</button>
          </div>
          <div className="flex flex-col gap-3">
            {activeGoals.map((g) => {
              const cfg = goalCategoryConfig[g.category];
              return (
                <button key={g.id} onClick={() => navigate('/goals')} 
                  className="w-full glass-card p-4 flex items-center gap-3 text-left bg-[#141B2D] border border-white/5 active:scale-[0.99] transition-transform">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cfg?.color || '#8B5CF6'}15` }}>
                    <span className="text-lg">{cfg?.icon || '🎯'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-bold text-white truncate">{g.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
                        <div className="h-full rounded-full" style={{ width: `${g.progress}%`, background: cfg?.color || '#8B5CF6' }} />
                      </div>
                      <span className="text-label font-bold shrink-0" style={{ color: cfg?.color || '#8B5CF6' }}>{g.progress}%</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Quick Links Grid */}
      <div>
        <div className="text-label text-gray-400 uppercase tracking-wider mb-3 px-1">Growth Shortcuts</div>
        <div className="grid grid-cols-3 gap-3">
          {quickLinks.map((link) => (
            <button key={link.label} onClick={() => navigate(link.to)} 
              className="glass-card p-4 flex flex-col items-center justify-center gap-2 text-center bg-[#141B2D] hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${link.color}10` }}>
                <link.icon className="w-5 h-5" style={{ color: link.color }} />
              </div>
              <span className="text-label text-gray-300 font-bold leading-tight truncate w-full">{link.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sign Out Button */}
      <button onClick={() => { if (confirm('Are you sure you want to sign out?')) logout(); }} 
        className="w-full glass-card p-4 flex items-center justify-between bg-[#141B2D] border border-white/5 hover:border-[#EF4444]/20 active:scale-[0.99] transition-all text-left">
        <span className="text-body font-bold text-[#EF4444]">Sign Out</span>
        <LogOut className="w-4.5 h-4.5 text-[#EF4444]" />
      </button>

    </div>
  );
}
