import { useState, useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { formatDuration, getDateKey, cn } from '@/utils/helpers.ts';
import { format, addDays } from 'date-fns';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, Circle } from 'lucide-react';
import type { GoalCategory, Priority } from '@/types/index.ts';
import { goalCategoryConfig } from '@/data/constants.ts';

export function Planner() {
  const { tasks, addTask, toggleTask, deleteTask, moveToTomorrow } = usePlannerStore();
  const addXP = useGameStore((s) => s.addXP);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<GoalCategory>('personal');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<Priority>('medium');

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = useMemo(() => tasks.filter((t) => t.dueDate === dateKey), [tasks, dateKey]);
  const todayKey = getDateKey();

  const dateStrip = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 2);
    return { date: d, key: format(d, 'yyyy-MM-dd'), day: format(d, 'EEE'), num: format(d, 'd') };
  }), []);

  // Natural grouping: Morning (High), Afternoon (Medium), Evening (Low)
  const groupedTasks = useMemo(() => {
    const morning = dayTasks.filter((t) => t.priority === 'high');
    const afternoon = dayTasks.filter((t) => t.priority === 'medium');
    const evening = dayTasks.filter((t) => t.priority === 'low');
    return { morning, afternoon, evening };
  }, [dayTasks]);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({ title, description, category: taskCategory, dueDate: dateKey, estimatedMinutes, priority });
    setTitle(''); setDescription(''); setEstimatedMinutes(30); setPriority('medium'); setShowModal(false);
  };

  const handleToggle = (id: string, taskTitle: string, isDone: boolean) => {
    toggleTask(id);
    if (!isDone) addXP(15, 'task', `Completed: ${taskTitle}`);
  };

  return (
    <div className="animate-fade-in flex flex-col gap-6" style={{ paddingBottom: '88px' }}>
      
      {/* Header */}
      <div>
        <h1 className="text-page-title text-white font-extrabold">Planner</h1>
        <p className="text-secondary-text text-gray-400 mt-1">Design your daily routine chronologically</p>
      </div>

      {/* Date Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {dateStrip.map(({ date, key, day, num }) => {
          const isSelected = key === dateKey;
          const isT = key === todayKey;
          return (
            <button key={key} onClick={() => setSelectedDate(date)}
              className={cn(
                'shrink-0 flex flex-col items-center gap-1.5 py-3 px-4 rounded-[16px] transition-all duration-150 active:scale-95',
                isSelected ? 'bg-[#8B5CF6] text-white shadow-lg shadow-violet-500/20' : 'bg-[#121826] border border-white/5'
              )}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider', isSelected ? 'text-white' : isT ? 'text-[#8B5CF6]' : 'text-gray-500')}>
                {isT ? 'TODAY' : day}
              </span>
              <span className="text-body font-black leading-none">{num}</span>
            </button>
          );
        })}
      </div>

      {dayTasks.length === 0 ? (
        <div className="p-8 text-center bg-[#121826] rounded-[20px] border border-white/5 my-4">
          <Calendar className="w-8 h-8 mx-auto text-gray-500 mb-3" />
          <h3 className="text-card-title text-white font-bold">Let's build a meaningful day</h3>
          <p className="text-secondary-text text-gray-400 mt-1">Tap the plus button below to create your first priority.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Morning Section */}
          {groupedTasks.morning.length > 0 && (
            <div className="space-y-3">
              <p className="text-label text-gray-500 uppercase tracking-widest font-bold px-1">☀️ Morning (High Priority)</p>
              <div className="flex flex-col gap-3">
                {groupedTasks.morning.map((task) => (
                  <div key={task.id} className="p-4 rounded-[20px] bg-[#121826] border border-white/5 flex items-start gap-4">
                    <button onClick={() => handleToggle(task.id, task.title, task.status === 'done')} className="shrink-0 mt-0.5">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500 hover:text-violet-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-body font-bold text-white', task.status === 'done' && 'line-through text-gray-500')}>{task.title}</p>
                      {task.description && task.status !== 'done' && (
                        <p className="text-secondary-text text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.estimatedMinutes > 0 && task.status !== 'done' && (
                          <span className="text-label text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(task.estimatedMinutes)}</span>
                        )}
                        <span className="text-label font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {goalCategoryConfig[task.category]?.icon} {task.category}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('Delete task?')) deleteTask(task.id); }} className="text-gray-500 hover:text-[#EF4444] transition-colors p-1 align-self-start">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Afternoon Section */}
          {groupedTasks.afternoon.length > 0 && (
            <div className="space-y-3">
              <p className="text-label text-gray-500 uppercase tracking-widest font-bold px-1">🌤️ Afternoon (Medium Priority)</p>
              <div className="flex flex-col gap-3">
                {groupedTasks.afternoon.map((task) => (
                  <div key={task.id} className="p-4 rounded-[20px] bg-[#121826] border border-white/5 flex items-start gap-4">
                    <button onClick={() => handleToggle(task.id, task.title, task.status === 'done')} className="shrink-0 mt-0.5">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500 hover:text-violet-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-body font-bold text-white', task.status === 'done' && 'line-through text-gray-500')}>{task.title}</p>
                      {task.description && task.status !== 'done' && (
                        <p className="text-secondary-text text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.estimatedMinutes > 0 && task.status !== 'done' && (
                          <span className="text-label text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(task.estimatedMinutes)}</span>
                        )}
                        <span className="text-label font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {goalCategoryConfig[task.category]?.icon} {task.category}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('Delete task?')) deleteTask(task.id); }} className="text-gray-500 hover:text-[#EF4444] transition-colors p-1 align-self-start">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evening Section */}
          {groupedTasks.evening.length > 0 && (
            <div className="space-y-3">
              <p className="text-label text-gray-500 uppercase tracking-widest font-bold px-1">🌙 Evening (Low Priority)</p>
              <div className="flex flex-col gap-3">
                {groupedTasks.evening.map((task) => (
                  <div key={task.id} className="p-4 rounded-[20px] bg-[#121826] border border-white/5 flex items-start gap-4">
                    <button onClick={() => handleToggle(task.id, task.title, task.status === 'done')} className="shrink-0 mt-0.5">
                      {task.status === 'done' ? (
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500 hover:text-violet-400" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-body font-bold text-white', task.status === 'done' && 'line-through text-gray-500')}>{task.title}</p>
                      {task.description && task.status !== 'done' && (
                        <p className="text-secondary-text text-gray-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        {task.estimatedMinutes > 0 && task.status !== 'done' && (
                          <span className="text-label text-gray-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDuration(task.estimatedMinutes)}</span>
                        )}
                        <span className="text-label font-bold px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                          {goalCategoryConfig[task.category]?.icon} {task.category}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('Delete task?')) deleteTask(task.id); }} className="text-gray-500 hover:text-[#EF4444] transition-colors p-1 align-self-start">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Add Task Button */}
      <button onClick={() => setShowModal(true)} 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform z-40">
        <Plus size={24} />
      </button>

      {/* Add Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="text-label text-gray-400 block mb-1">Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="modal-input" placeholder="What is your focus priority?" />
          </div>
          <div>
            <label className="text-label text-gray-400 block mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="modal-input resize-none" placeholder="Provide extra details..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label text-gray-400 block mb-1">Category</label>
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value as GoalCategory)} className="modal-input">
                {Object.entries(goalCategoryConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-label text-gray-400 block mb-1">Priority (Time bucket)</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="modal-input">
                <option value="high">☀️ Morning (High)</option>
                <option value="medium">🌤️ Afternoon (Medium)</option>
                <option value="low">🌙 Evening (Low)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-label text-gray-400 block mb-1">Estimated Duration (minutes)</label>
            <input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="modal-input" min={5} step={5} />
          </div>
          <button onClick={handleAdd} className="w-full btn-primary">Add Priority</button>
        </div>
      </Modal>

    </div>
  );
}
