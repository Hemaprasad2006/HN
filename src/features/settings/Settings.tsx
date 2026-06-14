import { useState } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useGameStore } from '@/stores/useGameStore';
import { Save, Bell, Shield, User, Trash2, Plus, Clock } from 'lucide-react';

export function Settings() {
  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const addXP = useGameStore((s) => s.addXP);
  const { alerts, addAlert, toggleAlert, deleteAlert } = useNotificationStore();

  const [name, setName] = useState(profile.name);
  const [dailyFocus, setDailyFocus] = useState(profile.dailyFocus || '');
  const [targetWater, setTargetWater] = useState(profile.targetWater);
  const [targetSleep, setTargetSleep] = useState(profile.targetSleep);
  const [targetStudyHours, setTargetStudyHours] = useState(profile.targetStudyHours);
  const [pomodoroWork, setPomodoroWork] = useState(profile.pomodoroWork);
  const [pomodoroBreak, setPomodoroBreak] = useState(profile.pomodoroBreak);
  const [pomodoroLongBreak, setPomodoroLongBreak] = useState(profile.pomodoroLongBreak);
  const [geminiApiKey, setGeminiApiKey] = useState(profile.geminiApiKey || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(profile.openaiApiKey || '');
  const [useModel, setUseModel] = useState<Required<typeof profile>['useModel']>(profile.useModel || 'gemini');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled || false);
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmType, setNewAlarmType] = useState<'habit' | 'water' | 'study' | 'sleep' | 'planner'>('habit');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, dailyFocus, targetWater: Number(targetWater), targetSleep: Number(targetSleep), targetStudyHours: Number(targetStudyHours), pomodoroWork: Number(pomodoroWork), pomodoroBreak: Number(pomodoroBreak), pomodoroLongBreak: Number(pomodoroLongBreak) });
    addXP(10, 'settings', 'Updated settings configuration');
    showToast('Profile and targets saved!');
  };

  const handleSaveAPIKeys = (e: React.FormEvent) => {
    e.preventDefault(); updateProfile({ geminiApiKey, openaiApiKey, useModel }); addXP(10, 'settings', 'Configured API keys'); showToast('AI keys updated!');
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') { setNotificationsEnabled(true); updateProfile({ notificationsEnabled: true }); new Notification('HN', { body: 'Desktop notifications enabled!' }); }
        else showToast('Notification permission denied by browser.', 'error');
      } else showToast('Browser does not support notifications.', 'error');
    } else { setNotificationsEnabled(false); updateProfile({ notificationsEnabled: false }); showToast('Desktop notifications disabled.'); }
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlarmLabel.trim()) return;
    addAlert({ time: newAlarmTime, type: newAlarmType, label: newAlarmLabel, enabled: true });
    setNewAlarmLabel(''); showToast('Alarm reminder added!');
  };

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3 mb-4">
      {icon}
      <h2 className="text-sm md:text-base font-semibold text-white">{title}</h2>
    </div>
  );

  const inputClass = 'input-field text-sm';
  const labelClass = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1';

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl pb-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 right-4 md:bottom-5 md:right-5 px-4 py-3 rounded-xl shadow-2xl z-50 border border-white/10 text-sm ${
          toast.type === 'success' ? 'bg-emerald-950/95 text-emerald-400' : 'bg-rose-950/95 text-rose-400'
        }`}>{toast.message}</div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-white">Settings</h1>
        <p className="text-xs text-gray-400 mt-0.5">Configure targets, AI access, and reminders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile & Targets */}
        <div className="glass-card p-4 md:p-5 space-y-4">
          {sectionHeader(<User className="w-4 h-4 text-indigo-400" />, 'Daily Growth Targets')}
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className={labelClass}>Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>Today's Focus Statement</label>
              <input type="text" value={dailyFocus} onChange={(e) => setDailyFocus(e.target.value)} className={inputClass} placeholder="What is your ultimate driver today?" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelClass}>Water (ml)</label>
                <input type="number" value={targetWater} onChange={(e) => setTargetWater(Number(e.target.value))} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Sleep (h)</label>
                <input type="number" value={targetSleep} onChange={(e) => setTargetSleep(Number(e.target.value))} className={inputClass} step="0.5" required />
              </div>
              <div>
                <label className={labelClass}>Study (h)</label>
                <input type="number" value={targetStudyHours} onChange={(e) => setTargetStudyHours(Number(e.target.value))} className={inputClass} step="0.5" required />
              </div>
            </div>
            <div className="border-t border-white/[0.06] pt-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pomodoro Timer (minutes)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-2xs text-gray-500 mb-1">Work</label><input type="number" value={pomodoroWork} onChange={(e) => setPomodoroWork(Number(e.target.value))} className={inputClass} required /></div>
                <div><label className="block text-2xs text-gray-500 mb-1">Short Break</label><input type="number" value={pomodoroBreak} onChange={(e) => setPomodoroBreak(Number(e.target.value))} className={inputClass} required /></div>
                <div><label className="block text-2xs text-gray-500 mb-1">Long Break</label><input type="number" value={pomodoroLongBreak} onChange={(e) => setPomodoroLongBreak(Number(e.target.value))} className={inputClass} required /></div>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2 text-sm py-2.5">
              <Save className="w-4 h-4" /> Save Targets
            </button>
          </form>
        </div>

        {/* AI Engine */}
        <div className="glass-card p-4 md:p-5 space-y-4">
          {sectionHeader(<Shield className="w-4 h-4 text-indigo-400" />, 'AI Engine Setup')}
          <form onSubmit={handleSaveAPIKeys} className="space-y-3">
            <p className="text-xs text-gray-400 leading-relaxed">API keys are stored in your browser only and sent solely to official model servers.</p>
            <div>
              <label className={labelClass}>Preferred AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {(['gemini', 'openai'] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setUseModel(m)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      useModel === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                    }`}>
                    {m === 'gemini' ? '✨ Gemini (Default)' : '🤖 OpenAI GPT-4o'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Gemini API Key</label>
              <input type="password" value={geminiApiKey} onChange={(e) => setGeminiApiKey(e.target.value)} className={`${inputClass} font-mono`} placeholder="AIzaSy..." />
            </div>
            <div>
              <label className={labelClass}>OpenAI API Key</label>
              <input type="password" value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)} className={`${inputClass} font-mono`} placeholder="sk-..." />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-2 text-sm py-2.5">
              <Save className="w-4 h-4" /> Save API Keys
            </button>
          </form>
        </div>
      </div>

      {/* Notifications & Alarms */}
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm md:text-base font-semibold text-white">Reminders & Alarms</h2>
          </div>
          <button onClick={handleToggleNotifications}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              notificationsEnabled ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'
            }`}>
            {notificationsEnabled ? '🔔 Active' : '🔕 Inactive'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Existing alerts */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" /> Active Schedule
            </h3>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No reminders scheduled.</p>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">{alert.time}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">{alert.label}</p>
                        <p className="text-2xs text-gray-500 capitalize">{alert.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => toggleAlert(alert.id)}
                        className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                          alert.enabled ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25' : 'bg-white/5 text-gray-500 border border-white/5'
                        }`}>
                        {alert.enabled ? 'On' : 'Off'}
                      </button>
                      <button onClick={() => deleteAlert(alert.id)} className="text-gray-500 hover:text-rose-500 p-1 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Add alarm */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl space-y-3">
            <h3 className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Custom Alarm
            </h3>
            <form onSubmit={handleAddAlarm} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Time</label>
                  <input type="time" value={newAlarmTime} onChange={(e) => setNewAlarmTime(e.target.value)} className="input-field py-1.5 text-sm" required />
                </div>
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Type</label>
                  <select value={newAlarmType} onChange={(e) => setNewAlarmType(e.target.value as any)} className="input-field py-1.5 text-sm">
                    <option value="habit">Habit</option>
                    <option value="water">Water</option>
                    <option value="study">Study</option>
                    <option value="sleep">Sleep</option>
                    <option value="planner">Planner</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-2xs text-gray-500 mb-1">Label / Message</label>
                <input type="text" value={newAlarmLabel} onChange={(e) => setNewAlarmLabel(e.target.value)} className="input-field py-1.5 text-sm" placeholder="Drink water! / Check off habits" required />
              </div>
              <button type="submit" className="btn-primary py-2 text-xs w-full">Schedule Reminder</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
