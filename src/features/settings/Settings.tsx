import { useState } from 'react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useGameStore } from '@/stores/useGameStore';
import { Save, Bell, Shield, User, Sliders, Trash2, Plus, Clock } from 'lucide-react';

export function Settings() {
  const profile = useSettingsStore((s) => s.profile);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const addXP = useGameStore((s) => s.addXP);

  const { alerts, addAlert, toggleAlert, deleteAlert } = useNotificationStore();

  // Form states
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

  // New alarm form state
  const [newAlarmTime, setNewAlarmTime] = useState('08:00');
  const [newAlarmType, setNewAlarmType] = useState<'habit' | 'water' | 'study' | 'sleep' | 'planner'>('habit');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      dailyFocus,
      targetWater: Number(targetWater),
      targetSleep: Number(targetSleep),
      targetStudyHours: Number(targetStudyHours),
      pomodoroWork: Number(pomodoroWork),
      pomodoroBreak: Number(pomodoroBreak),
      pomodoroLongBreak: Number(pomodoroLongBreak),
    });
    addXP(10, 'settings', 'Updated settings configuration');
    showToast('Profile and targets saved successfully!');
  };

  const handleSaveAPIKeys = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      geminiApiKey,
      openaiApiKey,
      useModel,
    });
    addXP(10, 'settings', 'Configured API keys');
    showToast('AI keys updated!');
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          updateProfile({ notificationsEnabled: true });
          new Notification('LifeOS', { body: 'Desktop notifications enabled!' });
        } else {
          showToast('Notification permission denied by browser.', 'error');
        }
      } else {
        showToast('Browser does not support notifications.', 'error');
      }
    } else {
      setNotificationsEnabled(false);
      updateProfile({ notificationsEnabled: false });
      showToast('Desktop notifications disabled.');
    }
  };

  const handleAddAlarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlarmLabel.trim()) return;
    addAlert({
      time: newAlarmTime,
      type: newAlarmType,
      label: newAlarmLabel,
      enabled: true,
    });
    setNewAlarmLabel('');
    showToast('Alarm reminder added!');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 z-50 border border-white/10 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-400'
              : 'bg-rose-955/95 text-rose-400'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings & Preferences</h1>
        <p className="text-gray-400 mt-1">Configure your personal daily targets, API access keys, and reminders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile & Targets */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Daily Growth Targets</h2>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Today's Focus Statement</label>
              <input
                type="text"
                value={dailyFocus}
                onChange={(e) => setDailyFocus(e.target.value)}
                className="input-field"
                placeholder="What is your ultimate driver today?"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Water (ml)</label>
                <input
                  type="number"
                  value={targetWater}
                  onChange={(e) => setTargetWater(Number(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Sleep (hrs)</label>
                <input
                  type="number"
                  value={targetSleep}
                  onChange={(e) => setTargetSleep(Number(e.target.value))}
                  className="input-field"
                  step="0.5"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Study (hrs)</label>
                <input
                  type="number"
                  value={targetStudyHours}
                  onChange={(e) => setTargetStudyHours(Number(e.target.value))}
                  className="input-field"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Focus Timer Customization (Minutes)</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Work Block</label>
                  <input
                    type="number"
                    value={pomodoroWork}
                    onChange={(e) => setPomodoroWork(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Short Break</label>
                  <input
                    type="number"
                    value={pomodoroBreak}
                    onChange={(e) => setPomodoroBreak(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Long Break</label>
                  <input
                    type="number"
                    value={pomodoroLongBreak}
                    onChange={(e) => setPomodoroLongBreak(Number(e.target.value))}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
              <Save className="w-4 h-4" /> Save Targets
            </button>
          </form>
        </div>

        {/* AI Access configurations */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">AI Engine Setup</h2>
          </div>

          <form onSubmit={handleSaveAPIKeys} className="space-y-4">
            <p className="text-xs text-gray-400 leading-relaxed">
              API keys are stored directly in your browser's local storage and are sent only to the official model servers.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Preferred AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseModel('gemini')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    useModel === 'gemini'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  Google Gemini (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setUseModel('openai')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    useModel === 'openai'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  OpenAI GPT-4o-Mini
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Gemini API Key</label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="AIzaSy..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                className="input-field font-mono text-sm"
                placeholder="sk-..."
              />
            </div>

            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
              <Save className="w-4 h-4" /> Save API Keys
            </button>
          </form>
        </div>
      </div>

      {/* Notifications Drawer & Custom Alerts */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Desktop Reminders & Alarms</h2>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              notificationsEnabled
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-white/[0.04] border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {notificationsEnabled ? 'System Notifications Active' : 'System Notifications Inactive'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* List existing alert times */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" /> Active Alert Schedule
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {alerts.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No reminders scheduled.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {alert.time}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-200">{alert.label}</p>
                        <p className="text-2xs text-gray-500 capitalize">{alert.type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`px-2 py-1 rounded text-2xs font-semibold ${
                          alert.enabled
                            ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/25'
                            : 'bg-white/5 text-gray-500 border border-white/5'
                        }`}
                      >
                        {alert.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="text-gray-500 hover:text-rose-500 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add alert form */}
          <div className="glass-card bg-white/[0.02] p-4 rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Custom Alarm
            </h3>

            <form onSubmit={handleAddAlarm} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Time</label>
                  <input
                    type="time"
                    value={newAlarmTime}
                    onChange={(e) => setNewAlarmTime(e.target.value)}
                    className="input-field py-1.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-2xs text-gray-500 mb-1">Type</label>
                  <select
                    value={newAlarmType}
                    onChange={(e) => setNewAlarmType(e.target.value as any)}
                    className="input-field py-1.5 text-sm"
                  >
                    <option value="habit">Habit reminder</option>
                    <option value="water">Water alert</option>
                    <option value="study">Study reminder</option>
                    <option value="sleep">Sleep check</option>
                    <option value="planner">Planner reminder</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-2xs text-gray-500 mb-1">Label / Message</label>
                <input
                  type="text"
                  value={newAlarmLabel}
                  onChange={(e) => setNewAlarmLabel(e.target.value)}
                  className="input-field py-1.5 text-sm"
                  placeholder="Drink water! / Check off habits"
                  required
                />
              </div>

              <button type="submit" className="btn-primary py-1.5 text-xs w-full mt-2">
                Schedule Reminder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
