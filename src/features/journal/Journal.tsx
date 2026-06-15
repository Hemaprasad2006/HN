import { useState, useMemo } from 'react';
import { useJournalStore } from '@/stores/useJournalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { getDateKey, cn } from '@/utils/helpers.ts';
import { format } from 'date-fns';
import { PenLine, ChevronLeft, ChevronRight, Save, Calendar, Search } from 'lucide-react';

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

  // Reflective states
  const [wentWell, setWentWell] = useState(existingEntry?.wentWell || '');
  const [toImprove, setToImprove] = useState(existingEntry?.toImprove || '');
  const [learned, setLearned] = useState(existingEntry?.learned || '');
  const [gratefulFor, setGratefulFor] = useState(existingEntry?.gratefulFor || '');
  const [distractions, setDistractions] = useState(existingEntry?.distractions || '');
  const [tomorrowPriority, setTomorrowPriority] = useState(existingEntry?.tomorrowPriority || '');
  const [mood, setMood] = useState(existingEntry?.mood || 5);
  const [tagsInput, setTagsInput] = useState(existingEntry?.tags?.join(', ') || '');

  // Conversational step indicator: 0 = Mood, 1 = wentWell, 2 = toImprove, 3 = learned, 4 = gratefulFor, 5 = distractions, 6 = tomorrowPriority, 7 = tags
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleSave = () => {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const data = { 
      date: today, wentWell, toImprove, learned, gratefulFor, distractions, tomorrowPriority, mood, tags 
    };
    if (existingEntry) {
      updateEntry(existingEntry.id, data);
    } else {
      addEntry(data);
      addXP(20, 'journal', 'Completed daily reflection journal');
    }
    setCurrentStep(0);
  };

  const stepsList = [
    {
      title: "Daily Mood",
      question: "How are you feeling today?",
      render: () => (
        <div className="flex flex-wrap gap-2.5 justify-center py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
            <button key={m} onClick={() => setMood(m)}
              className={cn(
                'w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-150 active:scale-90',
                mood === m ? 'bg-[#8B5CF6]/20 border border-[#8B5CF6] scale-110' : 'bg-[#141B2D]/55 border border-white/5 hover:bg-[#1E293B]'
              )}>
              {getMoodEmoji(m)}
            </button>
          ))}
        </div>
      )
    },
    {
      title: "Reflection: Wins",
      question: "What went well today?",
      placeholder: "Celebrate small or big wins...",
      render: () => (
        <textarea value={wentWell} onChange={(e) => setWentWell(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="I finished my core goals, had a good conversation..." />
      )
    },
    {
      title: "Reflection: Improvements",
      question: "What could you have done better?",
      placeholder: "Identify adjustments for tomorrow...",
      render: () => (
        <textarea value={toImprove} onChange={(e) => setToImprove(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="I could have stayed off social media during study sessions..." />
      )
    },
    {
      title: "Reflection: Learnings",
      question: "What did you learn today?",
      placeholder: "Write down new concepts or insights...",
      render: () => (
        <textarea value={learned} onChange={(e) => setLearned(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="I learned how to optimize hooks, studied database indexes..." />
      )
    },
    {
      title: "Reflection: Gratitude",
      question: "What are you grateful for?",
      placeholder: "Name 1-3 things that made you happy...",
      render: () => (
        <textarea value={gratefulFor} onChange={(e) => setGratefulFor(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="Good weather, family health, progress on my projects..." />
      )
    },
    {
      title: "Reflection: Focus",
      question: "What distracted you?",
      placeholder: "Identify attention leaks...",
      render: () => (
        <textarea value={distractions} onChange={(e) => setDistractions(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="Phone notifications, multitasking, noise..." />
      )
    },
    {
      title: "Reflection: Tomorrow",
      question: "What is tomorrow's absolute priority?",
      placeholder: "Choose one single high priority...",
      render: () => (
        <textarea value={tomorrowPriority} onChange={(e) => setTomorrowPriority(e.target.value)} rows={4}
          className="modal-input resize-none" placeholder="Complete the chemistry review questions..." />
      )
    },
    {
      title: "Reflection: Meta tags",
      question: "Add tag keywords",
      placeholder: "e.g. productive, calm, learning",
      render: () => (
        <div className="space-y-4">
          <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
            className="modal-input" placeholder="comma-separated tags..." />
          <button onClick={handleSave} className="w-full btn-primary flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {existingEntry ? 'Update Reflections' : 'Complete Log'}
          </button>
        </div>
      )
    }
  ];

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

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white font-extrabold flex items-center gap-2">
            <PenLine className="w-6 h-6 text-violet-400" /> Journal
          </h1>
          <p className="text-secondary-text text-gray-400 mt-1">Converse with yourself, capture day logs</p>
        </div>
        <button onClick={() => setShowHistory(!showHistory)} 
          className="text-label text-[#8B5CF6] font-bold border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 px-3 py-1.5 rounded-xl">
          {showHistory ? 'Diary Log' : 'History'}
        </button>
      </div>

      {!showHistory ? (
        /* Conversational step container */
        <div className="flex flex-col gap-5">
          {/* Header indicator bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-label text-gray-500 font-bold uppercase tracking-wider">
              {stepsList[currentStep].title}
            </span>
            <span className="text-label text-[#8B5CF6] font-bold">
              Step {currentStep + 1} of {stepsList.length}
            </span>
          </div>

          {/* Staggered progress dot list */}
          <div className="flex gap-1">
            {stepsList.map((_, idx) => (
              <div key={idx} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                style={{ background: idx === currentStep ? '#8B5CF6' : idx < currentStep ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>

          {/* Immersive question card */}
          <div key={currentStep} className="glass-card p-6 bg-[#141B2D] min-h-[300px] flex flex-col justify-between border border-white/5 animate-slide-in-right">
            <div>
              <div className="flex items-center gap-2 text-gray-400 mb-3">
                <Calendar className="w-4 h-4" />
                <span className="text-label font-bold">{format(new Date(), 'EEEE, MMMM d')}</span>
              </div>
              <h3 className="text-card-title text-white font-bold mb-4">{stepsList[currentStep].question}</h3>
              {stepsList[currentStep].render()}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
              <button disabled={currentStep === 0} 
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                className="flex items-center gap-1 text-label text-gray-400 disabled:opacity-20 active:scale-95 transition-transform font-bold">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              
              {currentStep < stepsList.length - 1 && (
                <button onClick={() => setCurrentStep((s) => Math.min(stepsList.length - 1, s + 1))}
                  className="flex items-center gap-1 text-label text-[#8B5CF6] active:scale-95 transition-transform font-bold">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* History lists */
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="relative">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="modal-input pl-10" placeholder="Search reflection archives..." />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
          </div>

          {pastEntries.length === 0 ? (
            <div className="glass-card p-6 text-center bg-[#141B2D]">
              <p className="text-secondary-text text-gray-400">No reflections match your search parameters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pastEntries.map((e) => (
                <div key={e.id} className="glass-card p-4 bg-[#141B2D] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-bold">{format(parseISO(e.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}</span>
                    <span className="text-xl">{getMoodEmoji(e.mood)}</span>
                  </div>
                  {e.wentWell && (
                    <div>
                      <p className="text-label text-gray-500">Wins</p>
                      <p className="text-secondary-text text-white mt-0.5">{e.wentWell}</p>
                    </div>
                  )}
                  {e.tomorrowPriority && (
                    <div>
                      <p className="text-label text-gray-500">Absolute Priority</p>
                      <p className="text-secondary-text text-white mt-0.5">{e.tomorrowPriority}</p>
                    </div>
                  )}
                  {e.tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {e.tags.map((t) => (
                        <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
function parseISO(s: string): Date {
  return new Date(s);
}
