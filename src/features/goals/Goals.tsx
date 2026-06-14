import { useState, useMemo } from 'react';
import { useGoalStore } from '@/stores/useGoalStore.ts';
import { useGameStore } from '@/stores/useGameStore.ts';
import { goalCategoryConfig } from '@/data/constants.ts';
import { Modal } from '@/components/ui/Modal.tsx';
import { daysUntil, priorityConfig, cn } from '@/utils/helpers.ts';
import { nanoid } from 'nanoid';
import { Target, Plus, Edit3, Trash2, ChevronDown, ChevronUp, CheckCircle2, Circle, Trophy } from 'lucide-react';
import type { GoalCategory, Priority, Milestone, Goal } from '@/types/index.ts';

const categories = ['all', ...Object.keys(goalCategoryConfig)] as const;

export function Goals() {
  const { goals, addGoal, updateGoal, deleteGoal, toggleMilestone, archiveGoal } = useGoalStore();
  const addXP = useGameStore((s) => s.addXP);
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [why, setWhy] = useState('');
  const [category, setCategory] = useState<GoalCategory>('personal');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [milestones, setMilestones] = useState<{ id: string; title: string }[]>([]);
  const [newMilestone, setNewMilestone] = useState('');

  const filtered = useMemo(() => {
    const active = goals.filter((g) => !g.archived);
    if (filter === 'all') return active;
    return active.filter((g) => g.category === filter);
  }, [goals, filter]);

  const resetForm = () => {
    setTitle(''); setDescription(''); setWhy('');
    setCategory('personal'); setDeadline(''); setPriority('medium');
    setMilestones([]); setNewMilestone(''); setEditingGoal(null);
  };

  const openEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setTitle(goal.title); setDescription(goal.description); setWhy(goal.why);
    setCategory(goal.category); setDeadline(goal.deadline); setPriority(goal.priority);
    setMilestones(goal.milestones.map((m) => ({ id: m.id, title: m.title })));
    setShowModal(true);
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const ms: Milestone[] = milestones.map((m) => ({ id: m.id, title: m.title, completed: false }));

    if (editingGoal) {
      const existingMilestones = editingGoal.milestones;
      const updatedMs: Milestone[] = milestones.map((m) => {
        const existing = existingMilestones.find((em) => em.id === m.id);
        return { id: m.id, title: m.title, completed: existing?.completed || false };
      });
      updateGoal(editingGoal.id, { title, description, why, category, deadline, priority, milestones: updatedMs });
    } else {
      addGoal({ title, description, why, category, deadline, priority, milestones: ms });
      addXP(25, 'goal', 'Created a new goal');
    }
    setShowModal(false);
    resetForm();
  };

  const addMilestoneItem = () => {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { id: nanoid(), title: newMilestone }]);
    setNewMilestone('');
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-3">
            <Target className="w-8 h-8 text-indigo-400" /> Goals
          </h1>
          <p className="text-gray-400 mt-1">Track your ambitions and achieve greatness</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all hover:scale-105">
          <Plus className="w-5 h-5" /> Add Goal
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const config = cat === 'all' ? null : goalCategoryConfig[cat];
          return (
            <button key={cat} onClick={() => setFilter(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                filter === cat
                  ? 'gradient-primary text-white shadow-lg'
                  : 'glass-card hover:bg-white/10 text-gray-300'
              )}>
              {cat === 'all' ? '🎯 All' : `${config?.icon} ${config?.label}`}
            </button>
          );
        })}
      </div>

      {/* Goals Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Trophy className="w-16 h-16 mx-auto text-indigo-400/50 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300">No goals yet</h3>
          <p className="text-gray-500 mt-2">Set your first goal and start your journey!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((goal, idx) => {
            const config = goalCategoryConfig[goal.category];
            const days = daysUntil(goal.deadline);
            const isExpanded = expandedGoal === goal.id;
            const completedMs = goal.milestones.filter((m) => m.completed).length;
            return (
              <div key={goal.id} className="glass-card p-5 animate-slide-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config?.icon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: `${config?.color}20`, color: config?.color }}>
                      {config?.label}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', priorityConfig[goal.priority].bgClass)}>
                      {priorityConfig[goal.priority].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & description */}
                <h3 className="text-lg font-semibold text-white mb-1">{goal.title}</h3>
                <p className="text-sm text-gray-400 line-clamp-2 mb-3">{goal.description}</p>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-indigo-400">{goal.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full gradient-primary progress-bar-fill" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{goal.milestones.length > 0 ? `${completedMs}/${goal.milestones.length} milestones` : 'No milestones'}</span>
                  <span className={days < 0 ? 'text-rose-400' : days <= 7 ? 'text-amber-400' : ''}>
                    {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                  </span>
                </div>

                {/* Expand toggle */}
                {goal.milestones.length > 0 && (
                  <button onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    className="mt-3 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide' : 'Show'} milestones
                  </button>
                )}

                {/* Expanded milestones */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    {goal.why && (
                      <p className="text-xs text-gray-400 italic mb-2">💡 {goal.why}</p>
                    )}
                    {goal.milestones.map((ms) => (
                      <button key={ms.id} onClick={() => toggleMilestone(goal.id, ms.id)}
                        className="flex items-center gap-2 w-full text-left text-sm hover:bg-white/5 rounded-lg p-1.5 transition-colors">
                        {ms.completed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          : <Circle className="w-4 h-4 text-gray-500 shrink-0" />
                        }
                        <span className={ms.completed ? 'line-through text-gray-500' : 'text-gray-300'}>{ms.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }}
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Goal Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 focus:border-indigo-500"
              placeholder="What do you want to achieve?" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)}
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
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none"
              placeholder="Describe your goal..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Why This Matters</label>
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder-gray-500 resize-none"
              placeholder="Why is this important to you?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-white" />
          </div>
          {/* Milestones */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Milestones</label>
            <div className="space-y-2 mb-2">
              {milestones.map((m, i) => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                  <input value={m.title} onChange={(e) => setMilestones(milestones.map((ms) => ms.id === m.id ? { ...ms, title: e.target.value } : ms))}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm" />
                  <button onClick={() => setMilestones(milestones.filter((ms) => ms.id !== m.id))}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-500 hover:text-rose-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addMilestoneItem()}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm placeholder-gray-500"
                placeholder="Add a milestone..." />
              <button onClick={addMilestoneItem}
                className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm hover:bg-indigo-500/30 transition-colors">
                Add
              </button>
            </div>
          </div>
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all">
            {editingGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
