import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sun, Moon, LogOut, CloudLightning } from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { getGreeting } from '@/utils/helpers';

export default function Header() {
  const [now, setNow] = useState(new Date());
  const theme = useSettingsStore((s) => s.theme);
  const toggleTheme = useSettingsStore((s) => s.toggleTheme);
  const profile = useSettingsStore((s) => s.profile);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = format(now, 'EEEE, MMMM d, yyyy');
  const timeStr = format(now, 'h:mm a');
  const greeting = getGreeting();

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-white/[0.06] dark:border-white/[0.06] bg-slate-950/50 dark:bg-slate-950/50 backdrop-blur-xl shrink-0">
      {/* Left: Greeting + Date */}
      <div className="flex flex-col">
        <h2 className="text-sm font-semibold text-gray-100 dark:text-gray-100">
          {greeting}, <span className="gradient-text">{profile.name}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-500">{dateStr}</p>
      </div>

      {/* Right: Time + Sync Actions + Theme Toggle */}
      <div className="flex items-center gap-3">
        {!isAuthenticated && (
          <button
            onClick={() => setGuestMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all duration-200"
            title="Click to sign in and save your data permanently"
          >
            <CloudLightning className="w-3.5 h-3.5 animate-pulse" /> Offline Mode (Sync)
          </button>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <span className="text-sm font-mono font-medium text-gray-300 tabular-nums">
            {timeStr}
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {isAuthenticated && (
          <button
            onClick={logout}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
