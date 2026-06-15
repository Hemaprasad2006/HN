import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlannerStore, Task } from '@/stores/usePlannerStore';
import { format, addDays } from 'date-fns';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Calendar } from 'lucide-react-native';

export default function PlannerScreen() {
  const tasks = usePlannerStore((s) => s.tasks);
  const addTask = usePlannerStore((s) => s.addTask);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const deleteTask = usePlannerStore((s) => s.deleteTask);
  const moveToTomorrow = usePlannerStore((s) => s.moveToTomorrow);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [category, setCategory] = useState<Task['category']>('studies');
  const [estMinutes, setEstMinutes] = useState('30');

  // Simple day strip: today and next 4 days
  const dayStrip = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = addDays(new Date(), i);
      return {
        key: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEE'),
        dayNum: format(d, 'd'),
      };
    });
  }, []);

  const currentDateTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === selectedDate);
  }, [tasks, selectedDate]);

  // Circadian Buckets
  const morningTasks = useMemo(() => currentDateTasks.filter((t) => t.priority === 'high'), [currentDateTasks]);
  const afternoonTasks = useMemo(() => currentDateTasks.filter((t) => t.priority === 'medium'), [currentDateTasks]);
  const eveningTasks = useMemo(() => currentDateTasks.filter((t) => t.priority === 'low'), [currentDateTasks]);

  const handleCreateTask = () => {
    if (!title.trim()) return;
    addTask({
      title: title.trim(),
      description: 'Logged via mobile planner.',
      category,
      dueDate: selectedDate,
      estimatedMinutes: parseInt(estMinutes, 10) || 30,
      priority,
    });
    setTitle('');
    setPriority('high');
    setCategory('studies');
    setEstMinutes('30');
    setModalOpen(false);
  };

  const renderBucket = (title: string, taskList: Task[], subtitle: string, accentColor: string) => {
    return (
      <View style={styles.bucketContainer}>
        <View style={styles.bucketHeader}>
          <Text style={[styles.bucketTitle, { color: accentColor }]}>{title}</Text>
          <Text style={styles.bucketSubtitle}>{subtitle}</Text>
        </View>

        {taskList.length === 0 ? (
          <View style={styles.emptyBucket}>
            <Text style={styles.emptyBucketText}>Let's build a meaningful day.</Text>
            <Text style={styles.emptyBucketSub}>No priorities scheduled for this slot.</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {taskList.map((task) => {
              const isCompleted = task.status === 'done';
              return (
                <View key={task.id} style={[styles.taskItem, isCompleted && styles.taskItemCompleted]}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    onPress={() => toggleTask(task.id)}
                    style={styles.taskLabelWrapper}>
                    {isCompleted ? (
                      <CheckCircle2 color="#22C55E" size={20} />
                    ) : (
                      <Circle color="#64748B" size={20} />
                    )}
                    <View style={styles.taskTextWrapper}>
                      <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <Clock size={11} color="#64748B" />
                        <Text style={styles.taskMetaText}>{task.estimatedMinutes}m</Text>
                        <Text style={styles.taskMetaDot}>·</Text>
                        <Text style={[styles.taskMetaText, { color: accentColor }]}>{task.category}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.taskActions}>
                    {!isCompleted && (
                      <TouchableOpacity 
                        onPress={() => moveToTomorrow(task.id)}
                        style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>+1d</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => deleteTask(task.id)}
                      style={styles.deleteButton}>
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Date selector strip */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planner</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {dayStrip.map((day) => {
            const isSelected = day.key === selectedDate;
            return (
              <TouchableOpacity
                key={day.key}
                activeOpacity={0.8}
                onPress={() => setSelectedDate(day.key)}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}>
                <Text style={[styles.dayNameText, isSelected && styles.dayNameTextSelected]}>{day.dayName}</Text>
                <Text style={[styles.dayNumText, isSelected && styles.dayNumTextSelected]}>{day.dayNum}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderBucket('Morning', morningTasks, 'High Energy · Critical Missions', '#8B5CF6')}
        {renderBucket('Afternoon', afternoonTasks, 'Medium Focus · General Work', '#3B82F6')}
        {renderBucket('Evening', eveningTasks, 'Low Focus · Rituals & Rest', '#10B981')}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setModalOpen(true)}
        style={styles.fab}
        accessibilityLabel="Add task">
        <Plus color="#FFFFFF" size={24} />
      </TouchableOpacity>

      {/* Add Task Modal overlay */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Priority</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priority Name</Text>
              <TextInput 
                value={title}
                onChangeText={setTitle}
                placeholder="What are you scheduling?"
                placeholderTextColor="#64748B"
                style={styles.input}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Focus Block</Text>
                <View style={styles.selectorRow}>
                  {(['high', 'medium', 'low'] as const).map((p) => {
                    const isSelected = priority === p;
                    const labelMap = { high: 'Morning', medium: 'Afternoon', low: 'Evening' };
                    return (
                      <TouchableOpacity 
                        key={p} 
                        onPress={() => setPriority(p)}
                        style={[styles.selectorBtn, isSelected && styles.selectorBtnSelected]}>
                        <Text style={[styles.selectorBtnText, isSelected && styles.selectorBtnTextSelected]}>
                          {labelMap[p]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {(['studies', 'work', 'health', 'personal'] as const).map((cat) => {
                    const isSelected = category === cat;
                    return (
                      <TouchableOpacity 
                        key={cat} 
                        onPress={() => setCategory(cat)}
                        style={[styles.catBtn, isSelected && styles.catBtnSelected]}>
                        <Text style={[styles.catBtnText, isSelected && styles.catBtnTextSelected]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Estimated Duration (minutes)</Text>
              <TextInput 
                value={estMinutes}
                onChangeText={setEstMinutes}
                keyboardType="number-pad"
                style={styles.input}
              />
            </View>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleCreateTask}
              style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Schedule Priority</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090B14',
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dayStrip: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayCard: {
    width: 54,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dayNameTextSelected: {
    color: '#8B5CF6',
  },
  dayNumText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  dayNumTextSelected: {
    color: '#8B5CF6',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  bucketContainer: {
    marginBottom: 24,
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  bucketTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  bucketSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  emptyBucket: {
    backgroundColor: '#121826',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyBucketText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBucketSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121826',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  taskItemCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.08)',
    opacity: 0.75,
  },
  taskLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  taskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  taskMetaText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskMetaDot: {
    fontSize: 10,
    color: '#64748B',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
  },
  deleteButton: {
    padding: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121826',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  selectorBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  selectorBtnSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  selectorBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '800',
  },
  selectorBtnTextSelected: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    gap: 6,
  },
  catBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  catBtnSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  catBtnText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  catBtnTextSelected: {
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
