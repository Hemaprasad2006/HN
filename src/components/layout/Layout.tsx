import { Outlet, NavLink, useLocation } from 'react-router';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bell, LayoutDashboard, Calendar, Repeat, Timer, Bot, MoreHorizontal } from 'lucide-react';

// Bottom nav items (the most frequently used ones for mobile)
const bottomNavItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/planner', label: 'Planner', icon: Calendar },
  { to: '/habits', label: 'Habits', icon: Repeat },
  { to: '/focus', label: 'Focus', icon: Timer },
  { to: '/coach', label: 'Coach', icon: Bot },
];

export function Layout() {
  const theme = useSettingsStore((s) => s.theme);
  const profile = useSettingsStore((s) => s.profile);
  const { alerts, addNotification } = useNotificationStore();
  const [activeToasts, setActiveToasts] = useState<{ id: string; title: string; message: string }[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Alarm daemon
  useEffect(() => {
    let lastCheckedTimeStr = '';

    const checkAlarms = () => {
      const now = new Date();
      const currentTimeStr = format(now, 'HH:mm');

      if (currentTimeStr === lastCheckedTimeStr) return;
      lastCheckedTimeStr = currentTimeStr;

      const matchingAlerts = alerts.filter(
        (a) => a.enabled && a.time === currentTimeStr
      );

      matchingAlerts.forEach((alert) => {
        const title = `HN Reminder: ${alert.label}`;
        const message = `It is now ${alert.time}. Time to check on your: ${alert.type}!`;

        addNotification(title, message);

        const toastId = Math.random().toString(36).substring(2, 9);
        setActiveToasts((prev) => [...prev, { id: toastId, title, message }]);
        setTimeout(() => {
          setActiveToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 6000);

        if (profile.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(title, { body: message });
          } catch (err) {
            console.error('Failed to trigger push notification:', err);
          }
        }
      });
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 15000);
    return () => clearInterval(interval);
  }, [alerts, profile.notificationsEnabled, addNotification]);

  return (
    <div
      className={`${theme} h-screen flex overflow-hidden ${
        theme === 'dark'
          ? 'bg-slate-950 text-gray-100'
          : 'bg-gray-50 text-gray-900'
      }`}
    >
      {/* Toast Overlay Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="w-72 sm:w-80 pointer-events-auto bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl flex gap-3 text-slate-100 backdrop-blur-xl transition-all duration-300 animate-slide-in-right"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="space-y-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{toast.title}</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar — desktop visible, mobile as drawer */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="gradient-mesh min-h-full">
            <div className="mx-auto max-w-7xl p-4 md:p-6">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/[0.08] flex items-stretch safe-area-bottom">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-200 ${isActive ? 'text-indigo-400' : ''}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-indigo-400' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* "More" button to open full menu */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-1 text-gray-500 hover:text-gray-300 transition-all duration-200"
          >
            <div className="flex items-center justify-center w-6 h-6">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
