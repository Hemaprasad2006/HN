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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title text-white font-extrabold">Timeline</h1>
          <p className="text-secondary-text text-gray-400 mt-1">Design your day, check off your agenda</p>
        </div>
      </div>

      {/* Date Horizontal Strip Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {dateStrip.map(({ date, key, day, num }) => {
          const isSelected = key === dateKey;
          const isT = key === todayKey;
          const count = tasks.filter((t) => t.dueDate === key).length;
          return (
            <button key={key} onClick={() => setSelectedDate(date)}
              className={cn(
                'shrink-0 flex flex-col items-center gap-1.5 py-3 px-4 rounded-[16px] transition-all duration-150 active:scale-95',
                isSelected ? 'bg-[#8B5CF6] text-white shadow-lg shadow-violet-500/20' : 'bg-[#141B2D] border border-white/5'
              )}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider', isSelected ? 'text-white' : isT ? 'text-[#8B5CF6]' : 'text-gray-500')}>
                {isT ? 'TODAY' : day}
              </span>
              <span className="text-body font-black leading-none">{num}</span>
              {count > 0 && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? '#fff' : '#8B5CF6' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary Label */}
      <div className="px-1">
        <p className="text-label text-gray-400 uppercase tracking-wider">Agenda For</p>
        <h3 className="text-card-title text-white font-bold mt-0.5">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h3>
      </div>

      {/* Task List / Agenda */}
      {dayTasks.length === 0 ? (
        <div className="glass-card p-8 text-center bg-[#141B2D]">
          <Calendar className="w-8 h-8 mx-auto text-gray-500 mb-3" />
          <h3 className="text-card-title text-white font-bold">No items scheduled</h3>
          <p className="text-secondary-text text-gray-400 mt-1">Tap the plus button below to log agenda tasks.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dayTasks.sort((a,b) => { 
            if (a.status==='done' && b.status!=='done') return 1; 
            if (a.status!=='done' && b.status==='done') return -1; 
            const o={high:0,medium:1,low:2}; 
            return o[a.priority]-o[b.priority]; 
          }).map((task, i) => {
            const done = task.status === 'done';
            const cfg = goalCategoryConfig[task.category];
            return (
              <div key={task.id} 
                className={cn(
                  'glass-card p-4 flex items-start gap-3 transition-all', 
                  task.priority==='high' ? 'border-l-2 border-l-[#EF4444]' : 
                  task.priority==='medium' ? 'border-l-2 border-l-[#F59E0B]' : 'border-l-2 border-l-[#22C55E]'
                )}>
                <button onClick={() => handleToggle(task.id, task.title, done)} className="shrink-0 mt-0.5 transition-all active:scale-90">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 hover:text-[#8B5CF6] transition-colors" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-body font-bold', done && 'line-through text-gray-500')}>{task.title}</p>
                  {task.description && !done && (
                    <p className="text-secondary-text text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.estimatedMinutes > 0 && !done && (
                      <span className="text-label text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{formatDuration(task.estimatedMinutes)}
                      </span>
                    )}
                    <span className="text-label font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', color: cfg?.color||'#8B5CF6' }}>
                      {cfg?.icon} {task.category}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {!done && (
                    <button onClick={() => moveToTomorrow(task.id)} 
                      className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300">
                      Tomorrow
                    </button>
                  )}
                  <button onClick={() => { if (confirm('Delete task?')) deleteTask(task.id); }} 
                    className="p-1 self-end text-gray-500 hover:text-[#EF4444] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Add Button */}
      <button onClick={() => setShowModal(true)} 
        className="fixed bottom-24 right-4 w-12 h-12 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center shadow-lg shadow-violet-500/30 active:scale-95 transition-all z-40">
        <Plus size={24} />
      </button>

      {/* Add Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="text-label text-gray-400 block mb-1">Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="modal-input" placeholder="What do you need to accomplish?" />
          </div>
          <div>
            <label className="text-label text-gray-400 block mb-1">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="modal-input resize-none" placeholder="Provide extra context..." />
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
              <label className="text-label text-gray-400 block mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="modal-input">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-label text-gray-400 block mb-1">Estimated Duration (minutes)</label>
            <input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="modal-input" min={5} step={5} />
          </div>
          <button onClick={handleAdd} className="w-full btn-primary">Add Task</button>
        </div>
      </Modal>
    </div>
  );
}
