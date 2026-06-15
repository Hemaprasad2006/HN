import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { LayoutDashboard, Calendar, Timer, BarChart3, User, Plus, Repeat, PenLine, Dumbbell, Bell, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { to: '/planner',   label: 'Planner',  icon: Calendar },
  { to: '/focus',     label: 'Focus',    icon: Timer },
  { to: '/analytics', label: 'Insights', icon: BarChart3 },
  { to: '/life',      label: 'Life',     icon: User },
];

const FAB_ACTIONS = [
  { label: 'Add Task',      icon: Calendar,  color: '#8B5CF6', to: '/planner' },
  { label: 'Start Focus',   icon: Timer,     color: '#8B5CF6', to: '/focus' },
  { label: 'Add Habit',     icon: Repeat,    color: '#22C55E', to: '/habits' },
  { label: 'Journal',       icon: PenLine,   color: '#F59E0B', to: '/journal' },
  { label: 'Record Health', icon: Dumbbell,  color: '#EF4444', to: '/health' },
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
    document.documentElement.classList.add('dark'); // Always dark for startup quality futuristic feel
  }, []);

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
        setTimeout(() => { setActiveToasts((prev) => prev.filter((t) => t.id !== toastId)); }, 4000);
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
    <div className="app-shell" style={{ minHeight: '100dvh', backgroundColor: '#0B1020' }}>
      {/* Toast Alert Banner */}
      <div className="fixed top-4 left-4 right-4 z-[9999] space-y-2 pointer-events-none max-w-sm mx-auto">
        {activeToasts.map((toast) => (
          <div key={toast.id} className="w-full pointer-events-auto bg-[#141B2D]/95 border border-white/5 p-4 rounded-[20px] shadow-2xl flex gap-3 text-slate-100 backdrop-blur-xl animate-pop-in">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-label font-bold text-white truncate">{toast.title}</p>
              <p className="text-secondary-text text-gray-400 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Capture Sheets */}
      {fabOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200" onClick={() => setFabOpen(false)} />
          <div className="fixed bottom-24 left-4 right-4 z-50 bg-[#141B2D] border border-white/5 rounded-[20px] p-4 shadow-2xl animate-slide-in-up">
            <p className="text-label text-gray-400 font-bold uppercase tracking-wider mb-3 px-2">Quick Capture</p>
            <div className="grid grid-cols-5 gap-2">
              {FAB_ACTIONS.map((action, i) => (
                <button key={action.label} 
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl active:bg-white/5 transition-all text-center" 
                  onClick={() => { setFabOpen(false); navigate(action.to); }}>
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: action.color, boxShadow: `0 4px 12px ${action.color}33` }}>
                    <action.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 leading-tight truncate w-full">{action.label}</span>
                </button>
              ))}
            </div>
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
              <item.icon size={20} className="transition-transform active:scale-95" />
              <span className="text-label font-semibold">{item.label}</span>
            </NavLink>
          ))}
          <div className="nav-fab-wrapper">
            <button className="nav-fab" onClick={() => setFabOpen(!fabOpen)} aria-label="Quick Capture">
              <Plus size={24} className={`text-white transition-transform duration-200 ${fabOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>
          {NAV_ITEMS.slice(2).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <item.icon size={20} className="transition-transform active:scale-95" />
              <span className="text-label font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
