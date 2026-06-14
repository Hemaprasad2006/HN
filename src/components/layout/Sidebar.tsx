import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Target,
  Calendar,
  Repeat,
  BookOpen,
  Timer,
  Heart,
  PenLine,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Bot,
  BarChart3,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { useGameStore } from '@/stores/useGameStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { getLevel, getLevelProgress, getLevelTitle } from '@/utils/helpers';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/planner', label: 'Planner', icon: Calendar },
  { to: '/habits', label: 'Habits', icon: Repeat },
  { to: '/study', label: 'Study', icon: BookOpen },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/journal', label: 'Journal', icon: PenLine },
  { to: '/achievements', label: 'Achievements', icon: Trophy },
  { to: '/reviews', label: 'Reviews', icon: FileText },
  { to: '/coach', label: 'AI Coach', icon: Bot },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const totalXP = useGameStore((s) => s.totalXP);
  const profile = useSettingsStore((s) => s.profile);
  const location = useLocation();

  const level = getLevel(totalXP);
  const progress = getLevelProgress(totalXP);
  const title = getLevelTitle(level);

  // Close mobile drawer on route change
  useEffect(() => {
    onMobileClose?.();
  }, [location.pathname]);

  const SidebarContent = (
    <aside
      className={`flex flex-col h-full bg-slate-950 border-r border-white/10 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo / Title */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <h1 className="text-xl font-bold gradient-text tracking-tight select-none">
            HN
          </h1>
        )}
        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto flex items-center justify-center w-8 h-8 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'sidebar-active bg-white/[0.08] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 shrink-0 transition-colors duration-200" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* XP Level Display */}
      <div className={`px-3 pb-2 ${collapsed ? 'px-2' : ''}`}>
        <div
          className={`rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 ${
            collapsed ? 'p-2' : ''
          }`}
        >
          {!collapsed ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-indigo-400">
                    Lv. {level}
                  </span>
                  <span className="text-xs text-gray-500">{title}</span>
                </div>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="xp-bar h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">
                {totalXP.toLocaleString()} XP total
              </p>
              {profile.name && (
                <p className="text-[11px] text-gray-500 mt-0.5 truncate">{profile.name}</p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-indigo-400">
                {level}
              </span>
              <div className="w-full h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="xp-bar h-full rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button — Desktop only */}
      <div className="px-3 pb-4 pt-1 hidden lg:block">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full py-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-medium">Collapse</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen">
        {SidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="relative z-10 flex h-full">
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
