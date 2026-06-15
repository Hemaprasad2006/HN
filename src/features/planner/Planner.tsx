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
  const completed = dayTasks.filter((t) => t.status === 'done').length;
  const totalRemMin = dayTasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedMinutes, 0);
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
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title gradient-text">Planner</h1>
          <p className="text-2xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Your day, your rules</p>
        </div>
        <button onClick={() => setShowModal(true)} className="w-10 h-10 rounded-2xl flex items-center justify-center gradient-primary shadow-lg transition-all active:scale-90">
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
        {dateStrip.map(({ date, key, day, num }) => {
          const isSelected = key === dateKey;
          const isT = key === todayKey;
          const count = tasks.filter((t) => t.dueDate === key).length;
          return (
            <button key={key} onClick={() => setSelectedDate(date)}
              className={cn('shrink-0 flex flex-col items-center gap-1 py-2.5 px-3.5 rounded-2xl transition-all', isSelected ? 'gradient-primary text-white shadow-lg scale-105' : 'glass-card')}
              style={!isSelected ? { color: 'var(--text-secondary)' } : {}}>
              <span className={cn('text-[9px] font-bold uppercase tracking-wider', !isSelected && isT ? '' : '')} style={!isSelected && isT ? { color: '#818cf8' } : {}}>
                {isT ? 'TODAY' : day}
              </span>
              <span className={cn('text-lg font-extrabold leading-none')} style={{ fontFamily: 'JetBrains Mono,monospace' }}>{num}</span>
              {count > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'rgba(255,255,255,0.8)' : '#6366f1' }} />}
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>{format(selectedDate, 'EEEE, MMMM d')}</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{completed}/{dayTasks.length} done{totalRemMin > 0 ? ` · ${formatDuration(totalRemMin)} left` : ''}</p>
          </div>
          {dayTasks.length > 0 && (
            <div className="relative w-10 h-10">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="20" cy="20" r="15" fill="none" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={2*Math.PI*15} strokeDashoffset={2*Math.PI*15*(1-completed/dayTasks.length)}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[9px] font-extrabold" style={{ color: '#818cf8' }}>{dayTasks.length > 0 ? Math.round(completed/dayTasks.length*100) : 0}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {dayTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Calendar className="w-6 h-6" style={{ color: 'var(--text-muted)' }} /></div>
          <p className="empty-state-title">No tasks for this day</p>
          <p className="empty-state-sub">Tap + to add your first task</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayTasks.sort((a,b) => { if (a.status==='done' && b.status!=='done') return 1; if (a.status!=='done' && b.status==='done') return -1; const o={high:0,medium:1,low:2}; return o[a.priority]-o[b.priority]; }).map((task, i) => {
            const done = task.status === 'done';
            const cfg = goalCategoryConfig[task.category];
            return (
              <div key={task.id} className={cn('glass-card p-3.5 flex items-start gap-3 animate-slide-in-up', task.priority==='high'?'priority-high':task.priority==='medium'?'priority-medium':'priority-low')} style={{ animationDelay: `${i*40}ms` }}>
                <button onClick={() => handleToggle(task.id, task.title, done)} className="shrink-0 mt-0.5 transition-all active:scale-90">
                  {done ? <CheckCircle2 className="w-5 h-5" style={{ color: '#10b981' }} /> : <Circle className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-semibold', done && 'line-through opacity-40')} style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                  {task.description && !done && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {task.estimatedMinutes > 0 && !done && <span className="badge badge-indigo"><Clock className="w-2.5 h-2.5" />{formatDuration(task.estimatedMinutes)}</span>}
                    <span className="badge" style={{ background: `${cfg?.color||'#6366f1'}15`, color: cfg?.color||'#818cf8' }}>{cfg?.icon} {task.category}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!done && <button onClick={() => moveToTomorrow(task.id)} className="text-[9px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>→tmr</button>}
                  <button onClick={() => { if (confirm('Delete?')) deleteTask(task.id); }} className="p-1 rounded-lg" style={{ color: 'var(--text-muted)' }}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Task">
        <div className="space-y-4">
          <div><label className="modal-label">Task Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="modal-input" placeholder="What do you need to do?" /></div>
          <div><label className="modal-label">Description (optional)</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="modal-input resize-none" placeholder="Add details..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="modal-label">Category</label>
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value as GoalCategory)} className="modal-input">
                {Object.entries(goalCategoryConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
            <div><label className="modal-label">Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className="modal-input"><option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option></select></div>
          </div>
          <div><label className="modal-label">Est. Time (min)</label><input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))} className="modal-input" min={5} step={5} /></div>
          <button onClick={handleAdd} className="w-full py-3 rounded-xl gradient-primary text-white text-sm font-bold hover:opacity-90 transition-all">Add Task</button>
        </div>
      </Modal>
    </div>
  );
}
