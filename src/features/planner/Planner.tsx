import { useState, useMemo } from 'react';
import { usePlannerStore } from '@/stores/usePlannerStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { goalCategoryConfig } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { formatDuration, priorityConfig, getDateKey, cn } from '@/utils/helpers.ts';
import { format, addDays, subDays } from 'date-fns';
import { Calendar, Plus, ChevronLeft, ChevronRight, Trash2, ArrowRight, Clock, CheckCircle2, Circle, ListTodo } from 'lucide-react';
import type { GoalCategory, Priority } from '@/types/index.ts';

export function Planner() {
  const { tasks, addTask, toggleTask, deleteTask, moveToTomorrow } = usePlannerStore();
  const addXP = useGameStore((s) => s.addXP);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskCategory, setTaskCategory] = useState<GoalCategory>('personal');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [priority, setPriority] = useState<Priority>('medium');

  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = useMemo(() => tasks.filter((t) => t.dueDate === dateKey), [tasks, dateKey]);
  const completed = dayTasks.filter((t) => t.status === 'done').length;
  const totalMinutes = dayTasks.filter((t) => t.status !== 'done').reduce((s, t) => s + t.estimatedMinutes, 0);

  const handleAdd = () => {
    if (!title.trim()) return;
    addTask({ title, description, category: taskCategory, dueDate: dateKey, estimatedMinutes, priority });
    setTitle(''); setDescription(''); setEstimatedMinutes(30); setPriority('medium');
    setShowModal(false);
  };

  const handleToggle = (id: string, taskTitle: string, isDone: boolean) => {
    toggleTask(id);
    if (!isDone) addXP(15, 'task', `Completed: ${taskTitle}`);
  };

  const isToday = getDateKey() === dateKey;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" /> Daily Planner
          </h1>
          <p className="text-gray-400 mt-1">Plan your day, conquer your goals</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all hover:scale-105">
          <Plus className="w-5 h-5" /> Add Task
        </button>
      </div>

      {/* Date Navigation */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <button onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-lg font-semibold">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
          {!isToday && (
            <button onClick={() => setSelectedDate(new Date())}
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">Jump to Today</button>
          )}
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-gray-400">Completed</p>
              <p className="text-lg font-bold text-emerald-400">{completed} <span className="text-gray-500 text-sm font-normal">/ {dayTasks.length}</span></p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Time Remaining</p>
              <p className="text-lg font-bold text-amber-400">{formatDuration(totalMinutes)}</p>
            </div>
          </div>
          <div className="w-48">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full gradient-success progress-bar-fill transition-all"
                style={{ width: `${dayTasks.length > 0 ? (completed / dayTasks.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      {dayTasks.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ListTodo className="w-16 h-16 mx-auto text-indigo-400/50 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">No tasks for this day</h3>
          <p className="text-gray-500 mt-2">Add a task to start planning!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayTasks.sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            const pOrder = { high: 0, medium: 1, low: 2 };
            return pOrder[a.priority] - pOrder[b.priority];
          }).map((task, idx) => {
            const isDone = task.status === 'done';
            const config = goalCategoryConfig[task.category];
            return (
              <div key={task.id}
                className={cn('glass-card p-4 flex items-start gap-4 animate-slide-in-up', isDone && 'opacity-50')}
                style={{ animationDelay: `${idx * 60}ms`, borderLeft: `3px solid ${priorityConfig[task.priority].color}` }}>
                <button onClick={() => handleToggle(task.id, task.title, isDone)} className="mt-0.5 shrink-0">
                  {isDone
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    : <Circle className="w-5 h-5 text-gray-500 hover:text-indigo-400 transition-colors" />
                  }
                </button>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('font-medium', isDone && 'line-through text-gray-500')}>{task.title}</h4>
                  {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 rounded-full" style={{ background: `${config?.color}15`, color: config?.color }}>
                      {config?.icon} {config?.label}
                    </span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(task.estimatedMinutes)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!isDone && (
                    <button onClick={() => moveToTomorrow(task.id)} title="Move to tomorrow"
                      className="p-1.5 rounded-lg hover:bg-amber-500/20 text-gray-500 hover:text-amber-400 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Task Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500"
              placeholder="What needs to be done?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none"
              placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value as GoalCategory)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white">
                {Object.entries(goalCategoryConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white">
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Estimated Duration (minutes)</label>
            <input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" min={5} step={5} />
          </div>
          <button onClick={handleAdd}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all">
            Add Task
          </button>
        </div>
      </Modal>
    </div>
  );
}
