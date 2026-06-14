import { Outlet } from 'react-router';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Bell } from 'lucide-react';

export function Layout() {
  const theme = useSettingsStore((s) => s.theme);
  const profile = useSettingsStore((s) => s.profile);
  const { alerts, addNotification } = useNotificationStore();
  const [activeToasts, setActiveToasts] = useState<{ id: string; title: string; message: string }[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

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
            className="w-80 pointer-events-auto bg-slate-900/95 border border-white/10 p-4 rounded-2xl shadow-2xl flex gap-3 text-slate-100 backdrop-blur-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">{toast.title}</h4>
              <p className="text-2xs text-gray-400 leading-relaxed">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="gradient-mesh min-h-full">
            <div className="mx-auto max-w-7xl p-6">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
