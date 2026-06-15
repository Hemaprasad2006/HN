import { Outlet, NavLink, useLocation, useNavigate } from 'react-router';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import { LayoutDashboard, Calendar, Timer, BarChart3, User, Plus, Repeat, PenLine, Dumbbell, Bell, Mic, X, Check } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard },
  { to: '/planner',   label: 'Planner',  icon: Calendar },
  { to: '/focus',     label: 'Focus',    icon: Timer },
  { to: '/analytics', label: 'Insights', icon: BarChart3 },
  { to: '/life',      label: 'Life',     icon: User },
];

export function Layout() {
  const theme = useSettingsStore((s) => s.theme);
  const profile = useSettingsStore((s) => s.profile);
  const { alerts, addNotification } = useNotificationStore();
  const addTask = usePlannerStore((s) => s.addTask);
  const isFocusRunning = useFocusStore((s) => s.isFocusRunning);
  
  const [activeToasts, setActiveToasts] = useState<{ id: string; title: string; message: string }[]>([]);
  const [fabOpen, setFabOpen] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('Listening...');
  const location = useLocation();
  const navigate = useNavigate();
  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => { setFabOpen(false); }, [location.pathname]);

  // Alarms check
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

  const startVoiceRecording = () => {
    setShowVoiceOverlay(true);
    setIsRecording(true);
    setTranscription('Listening...');
    setFabOpen(false);

    recordTimeoutRef.current = setTimeout(() => {
      setTranscription('Transcribing: "Complete physics chapter 6 and drink water"');
      setIsRecording(false);
    }, 2200);
  };

  const cancelVoiceRecording = () => {
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    setShowVoiceOverlay(false);
    setIsRecording(false);
  };

  const saveVoiceTask = () => {
    addTask({
      title: 'Complete physics chapter 6',
      description: 'Logged via voice capture.',
      category: 'studies',
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      estimatedMinutes: 45,
      priority: 'high',
    });
    setShowVoiceOverlay(false);
    navigate('/planner');
  };

  const isFocusPage = location.pathname === '/focus';
  const hideNav = isFocusPage && isFocusRunning;

  return (
    <div className="app-shell" style={{ minHeight: '100dvh', backgroundColor: '#090B14' }}>
      
      {/* Toast Banner notifications */}
      <div className="fixed top-4 left-4 right-4 z-[9999] space-y-2 pointer-events-none max-w-sm mx-auto">
        {activeToasts.map((toast) => (
          <div key={toast.id} className="w-full pointer-events-auto bg-[#121826] border border-white/5 p-4 rounded-[20px] shadow-2xl flex gap-3 text-slate-100 backdrop-blur-xl animate-pop-in">
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

      {/* Voice Assistant simulated overlay */}
      {showVoiceOverlay && (
        <div className="fixed inset-0 z-[999] bg-[#090B14]/95 backdrop-blur-md flex flex-col items-center justify-between p-8 text-center animate-fade-in">
          <button onClick={cancelVoiceRecording} className="self-end p-2 text-gray-400 hover:text-white bg-white/5 rounded-xl">
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-6 my-auto">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${isRecording ? 'bg-violet-600/20 text-[#8B5CF6] animate-breathe scale-105' : 'bg-white/5 text-gray-400'}`}>
              <Mic className="w-10 h-10" />
            </div>
            
            <div className="space-y-2 max-w-xs mx-auto">
              <h2 className="text-page-title text-white font-extrabold">{isRecording ? 'Recording...' : 'Voice Captured'}</h2>
              <p className="text-body text-gray-300 italic leading-relaxed">"{transcription}"</p>
            </div>

            {isRecording && (
              <div className="voice-wave">
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
                <div className="voice-bar"></div>
              </div>
            )}
          </div>

          {!isRecording && (
            <button onClick={saveVoiceTask} 
              className="w-14 h-14 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <Check className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Quick Capture bottom-sheet */}
      {fabOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200" onClick={() => setFabOpen(false)} />
          <div className="fixed bottom-24 left-4 right-4 z-50 bg-[#121826] border border-white/5 rounded-[20px] p-5 shadow-2xl animate-pop-in">
            <p className="text-label text-gray-500 font-bold uppercase tracking-wider mb-4 px-1">Capture Action</p>
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: 'Task',      icon: Calendar,  color: '#8B5CF6', to: '/planner' },
                { label: 'Habit',     icon: Repeat,    color: '#22C55E', to: '/habits' },
                { label: 'Journal',   icon: PenLine,   color: '#F59E0B', to: '/journal' },
                { label: 'Health',    icon: Dumbbell,  color: '#EF4444', to: '/health' },
              ].map((action) => (
                <button key={action.label} 
                  className="flex flex-col items-center gap-1.5 p-1 rounded-xl active:bg-white/5 transition-all text-center" 
                  onClick={() => { setFabOpen(false); navigate(action.to); }}>
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: action.color, boxShadow: `0 4px 12px ${action.color}25` }}>
                    <action.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 leading-tight truncate w-full">{action.label}</span>
                </button>
              ))}
              <button className="flex flex-col items-center gap-1.5 p-1 rounded-xl active:bg-white/5 transition-all text-center" 
                onClick={startVoiceRecording}>
                <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-indigo-600" style={{ boxShadow: `0 4px 12px rgba(99,102,241,0.25)` }}>
                  <Mic className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold text-gray-300 leading-tight truncate w-full">Voice Note</span>
              </button>
            </div>
          </div>
        </>
      )}

      <main className="overflow-y-auto" style={{ paddingBottom: hideNav ? 0 : 80 }}>
        <div className="page-root"><Outlet /></div>
      </main>

      {!hideNav && (
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
