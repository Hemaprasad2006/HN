import { useState, useMemo } from 'react';
import { useJournalStore } from '@/stores/useJournalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { getDateKey, formatDate, cn } from '@/utils/helpers.ts';
import { format, subDays } from 'date-fns';
import { PenLine, Search, Save, Calendar, Tag, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const moodEmojis: Record<number, string> = {
  1: '😢', 2: '😞', 3: '😟', 4: '😐', 5: '🙂',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🥳',
};

const getMoodEmoji = (mood: number) => moodEmojis[mood] || '😐';

export function Journal() {
  const { entries, addEntry, updateEntry, getEntryForDate } = useJournalStore();
  const addXP = useGameStore((s) => s.addXP);
  const today = getDateKey();
  const existingEntry = getEntryForDate(today);

  const [wentWell, setWentWell] = useState(existingEntry?.wentWell || '');
  const [toImprove, setToImprove] = useState(existingEntry?.toImprove || '');
  const [learned, setLearned] = useState(existingEntry?.learned || '');
  const [gratefulFor, setGratefulFor] = useState(existingEntry?.gratefulFor || '');
  const [distractions, setDistractions] = useState(existingEntry?.distractions || '');
  const [tomorrowPriority, setTomorrowPriority] = useState(existingEntry?.tomorrowPriority || '');
  const [mood, setMood] = useState(existingEntry?.mood || 5);
  const [tagsInput, setTagsInput] = useState(existingEntry?.tags?.join(', ') || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [viewingEntry, setViewingEntry] = useState<string | null>(null);

  const handleSave = () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const data = { date: today, wentWell, toImprove, learned, gratefulFor, distractions, tomorrowPriority, mood, tags };
    if (existingEntry) {
      updateEntry(existingEntry.id, data);
    } else {
      addEntry(data);
      addXP(20, 'journal', 'Wrote journal entry');
    }
  };

  const pastEntries = useMemo(() => {
    let filtered = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) =>
        e.wentWell.toLowerCase().includes(q) || e.learned.toLowerCase().includes(q) ||
        e.gratefulFor.toLowerCase().includes(q) || e.toImprove.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [entries, searchQuery]);

  const viewEntry = entries.find((e) => e.id === viewingEntry);

  // Mood trend data
  const moodData = useMemo(() => {
    const data: { date: string; mood: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const entry = entries.find((e) => e.date === d);
      if (entry) data.push({ date: format(new Date(d), 'MMM d'), mood: entry.mood });
    }
    return data;
  }, [entries]);

  const avgMood = useMemo(() => {
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((s, e) => s + e.mood, 0) / entries.length * 10) / 10;
  }, [entries]);

  const questionStyle = "w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none text-sm focus:border-indigo-500";

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
          <PenLine className="w-8 h-8 text-indigo-400" /> Journal & Reflection
        </h1>
        <p className="text-gray-400 mt-1">Reflect, learn, and grow every day</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Entry */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </h3>
              {existingEntry && <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">Saved</span>}
            </div>

            {/* Mood selector */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">How are you feeling?</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
                  <button key={m} onClick={() => setMood(m)}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all',
                      mood === m ? 'bg-indigo-500/30 ring-2 ring-indigo-500 scale-110' : 'bg-slate-800 hover:bg-slate-700'
                    )}>
                    {getMoodEmoji(m)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: '✨ What went well today?', value: wentWell, setter: setWentWell, placeholder: 'Celebrate your wins...' },
                { label: '🔄 What could I improve?', value: toImprove, setter: setToImprove, placeholder: 'Areas for growth...' },
                { label: '💡 What did I learn today?', value: learned, setter: setLearned, placeholder: 'New insights...' },
                { label: '🙏 What am I grateful for?', value: gratefulFor, setter: setGratefulFor, placeholder: 'Express gratitude...' },
                { label: '🔕 What distracted me?', value: distractions, setter: setDistractions, placeholder: 'Identify distractions...' },
                { label: '🎯 Tomorrow\'s priority?', value: tomorrowPriority, setter: setTomorrowPriority, placeholder: 'One main focus for tomorrow...' },
              ].map((q, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{q.label}</label>
                  <textarea value={q.value} onChange={(e) => q.setter(e.target.value)}
                    className={questionStyle} rows={2} placeholder={q.placeholder} />
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Tags (comma-separated)
              </label>
              <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 text-sm"
                placeholder="e.g., productive, focused, tired..." />
            </div>

            <button onClick={handleSave}
              className="w-full mt-5 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> {existingEntry ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>

          {/* Mood Trend */}
          {moodData.length > 1 && (
            <div className="glass-card p-5 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-300">Mood Trend (30 days)</h3>
                <span className="text-sm text-indigo-400 font-medium">Avg: {avgMood} {getMoodEmoji(Math.round(avgMood))}</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={moodData}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e2e8f0' }}
                    formatter={(value: any) => [`${value}/10 ${getMoodEmoji(Number(value))}`, 'Mood']} />
                  <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Past Entries Sidebar */}
        <div>
          <div className="glass-card p-4 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 text-sm"
                placeholder="Search entries..." />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {pastEntries.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <PenLine className="w-10 h-10 mx-auto text-indigo-400/50 mb-2" />
                <p className="text-gray-500 text-sm">No entries yet</p>
              </div>
            ) : (
              pastEntries.map((entry) => (
                <button key={entry.id} onClick={() => setViewingEntry(entry.id)}
                  className="glass-card p-3 w-full text-left hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{formatDate(entry.date)}</span>
                    <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                  </div>
                  <p className="text-sm text-gray-300 line-clamp-2">{entry.wentWell || entry.gratefulFor || 'No entry text'}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {entry.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">{tag}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* View Entry Modal */}
      <Modal isOpen={!!viewEntry} onClose={() => setViewingEntry(null)} title={viewEntry ? formatDate(viewEntry.date) : ''} size="lg">
        {viewEntry && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <span className="text-4xl">{getMoodEmoji(viewEntry.mood)}</span>
              <p className="text-sm text-gray-400 mt-1">Mood: {viewEntry.mood}/10</p>
            </div>
            {[
              { label: '✨ What went well', text: viewEntry.wentWell },
              { label: '🔄 To improve', text: viewEntry.toImprove },
              { label: '💡 Learned', text: viewEntry.learned },
              { label: '🙏 Grateful for', text: viewEntry.gratefulFor },
              { label: '🔕 Distractions', text: viewEntry.distractions },
              { label: '🎯 Tomorrow', text: viewEntry.tomorrowPriority },
            ].filter((q) => q.text).map((q, i) => (
              <div key={i}>
                <p className="text-xs font-medium text-gray-400 mb-1">{q.label}</p>
                <p className="text-sm text-gray-200 bg-slate-800/50 rounded-lg p-3">{q.text}</p>
              </div>
            ))}
            {viewEntry.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {viewEntry.tags.map((tag) => (
                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
