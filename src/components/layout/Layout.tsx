import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LayoutDashboard, Calendar, Timer, BarChart3, User, Plus, BookOpen, Repeat, PenLine, Dumbbell, Bell } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { to: '/planner',   label: 'Planner', icon: Calendar },
  { to: '/focus',     label: 'Focus',   icon: Timer },
  { to: '/analytics', label: 'Insights',icon: BarChart3 },
  { to: '/life',      label: 'Life',    icon: User },
];

const FAB_ACTIONS = [
  { label: 'Add Task', icon: Calendar, color: '#6366f1', to: '/planner' },
  { label: 'Start Focus', icon: Timer, color: '#8b5cf6', to: '/focus' },
  { label: 'Log Habit', icon: Repeat, color: '#10b981', to: '/habits' },
  { label: 'Journal Entry', icon: PenLine, color: '#f59e0b', to: '/journal' },
  { label: 'Log Workout', icon: Dumbbell, color: '#ef4444', to: '/health' },
  { label: 'Study Session', icon: BookOpen, color: '#06b6d4', to: '/study' },
];

export function Layout() {
  const theme = useSettingsStore((s) => s.theme);
  const profile = useSettingsStore((s) => s.profile);
  const { alerts, addNotification } = useNotificationStore();
  const [activeToasts, setActiveToasts] = useState<{ id: string; title: string; message: string }[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => { setFabOpen(false); }, [location.pathname]);

  useEffect(() => {
    let lastCheckedTimeStr = '';
    const checkAlarms = () => {
      const now = new Date();
      const currentTimeStr = format(now, 'HH:mm');
      if (currentTimeStr === lastCheckedTimeStr) return;
      lastCheckedTimeStr = currentTimeStr;
      const matchingAlerts = alerts.filter((a) => a.enabled && a.time === currentTimeStr);
      matchingAlerts.forEach((alert) => {
        const title = `HN: ${alert.label}`;
        const message = `Time for your ${alert.type} — ${alert.time}`;
        addNotification(title, message);
        const toastId = Math.random().toString(36).substring(2, 9);
        setActiveToasts((prev) => [...prev, { id: toastId, title, message }]);
        setTimeout(() => { setActiveToasts((prev) => prev.filter((t) => t.id !== toastId)); }, 5000);
        if (profile.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification(title, { body: message }); } catch (err) { console.error(err); }
        }
      });
    };
    checkAlarms();
    const interval = setInterval(checkAlarms, 15000);
    return () => clearInterval(interval);
  }, [alerts, profile.notificationsEnabled, addNotification]);

  const isFocusPage = location.pathname === '/focus';

  return (
    <div className={`app-shell gradient-mesh ${theme}`} style={{ minHeight: '100dvh' }}>
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {activeToasts.map((toast) => (
          <div key={toast.id} className="w-72 pointer-events-auto bg-slate-900/95 border border-white/10 p-3 rounded-2xl shadow-2xl flex gap-3 text-slate-100 backdrop-blur-xl animate-slide-in-right">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0"><Bell className="w-4 h-4" /></div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{toast.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {fabOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setFabOpen(false)} />
          <div className="fab-menu animate-slide-in-up">
            {FAB_ACTIONS.map((action, i) => (
              <button key={action.label} className="fab-menu-item" style={{ animationDelay: `${i * 40}ms` }} onClick={() => { setFabOpen(false); navigate(action.to); }}>
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: action.color }}>
                  <action.icon className="w-4 h-4" />
                </span>
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}

      <main className="overflow-y-auto" style={{ paddingBottom: isFocusPage ? 0 : 80 }}>
        <div className="page-root"><Outlet /></div>
      </main>

      {!isFocusPage && (
        <nav className="bottom-nav">
          {NAV_ITEMS.slice(0, 2).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <div className="nav-item-icon"><item.icon size={20} /></div>
              <span className="nav-item-label">{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-fab-wrapper">
            <button className="nav-fab" onClick={() => setFabOpen(!fabOpen)} aria-label="Quick add">
              <Plus size={22} className={`text-white transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>
          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <div className="nav-item-icon"><item.icon size={20} /></div>
              <span className="nav-item-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
