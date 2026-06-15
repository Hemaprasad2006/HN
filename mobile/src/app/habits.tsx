import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabitStore, Habit } from '@/stores/useHabitStore';
import { useGameStore } from '@/stores/useGameStore';
import { PlantCard } from '@/components/PlantCard';
import { format, subDays } from 'date-fns';
import { Plus, Repeat, Flame, TrendingUp, Award, CheckCircle } from 'lucide-react-native';

const emojiOptions = ['🌅', '🏋️', '💧', '🧘', '📖', '💻', '📵', '📝', '🏃', '🍎', '💪', '🎯', '🧠', '✍️', '😴', '🚀'];
const subjectColors = ['#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function HabitsScreen() {
  const { habits, logs, addHabit, toggleHabitLog, getCompletionRate } = useHabitStore();
  const addXP = useGameStore((s: any) => s.addXP);
  
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState(subjectColors[0]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const activeHabits = habits.filter((h) => !h.archived);
  const todayLogs = logs.filter((l) => l.date === today);
  const completedToday = todayLogs.filter((l) => l.completed).length;

  // Calculate streaks
  const habitStreaks = useMemo(() => {
    const map: Record<string, { current: number; longest: number }> = {};
    activeHabits.forEach((h) => {
      const dates = logs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date);
      
      if (dates.length === 0) {
        map[h.id] = { current: 0, longest: 0 };
        return;
      }
      
      const sorted = [...dates].sort().reverse();
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      
      let current = 0;
      let longest = 0;
      let temp = 0;

      if (sorted[0] === todayKey || sorted[0] === yesterdayKey) {
        for (let i = 0; i < sorted.length; i++) {
          const offset = sorted[0] === yesterdayKey ? 1 : 0;
          const expected = format(subDays(new Date(), i + offset), 'yyyy-MM-dd');
          if (sorted[i] === expected) {
            current++;
          } else {
            break;
          }
        }
      }

      temp = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000));
        if (diff === 1) {
          temp++;
        } else if (diff > 1) {
          longest = Math.max(longest, temp);
          temp = 1;
        }
      }
      longest = Math.max(longest, temp);

      map[h.id] = { current, longest };
    });
    return map;
  }, [activeHabits, logs]);

  const bestStreak = useMemo(() => {
    return Math.max(0, ...Object.values(habitStreaks).map((s) => s.longest));
  }, [habitStreaks]);

  const avgRate = useMemo(() => {
    if (activeHabits.length === 0) return 0;
    const total = activeHabits.reduce((sum, h) => sum + getCompletionRate(h.id, 30), 0);
    return Math.round(total / activeHabits.length);
  }, [activeHabits, getCompletionRate]);

  const handleToggle = (habitId: string, habitName: string) => {
    const existing = todayLogs.find((l) => l.habitId === habitId);
    const wasCompleted = existing?.completed || false;
    
    toggleHabitLog(habitId, today);
    
    if (!wasCompleted) {
      addXP(10, 'habit', `Completed habit: ${habitName}`);
    }
  };

  const handleCreateHabit = () => {
    if (!name.trim()) return;
    addHabit({
      name: name.trim(),
      icon,
      color,
      frequency: 'daily',
      targetCount: 1,
    });
    setName('');
    setIcon('🎯');
    setColor(subjectColors[0]);
    setShowModal(false);
  };

  // 84-Day Grid Data
  const heatmapData = useMemo(() => {
    const days: { pct: number }[] = [];
    for (let i = 83; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const dayLogs = logs.filter((l) => l.date === d);
      const completed = dayLogs.filter((l) => l.completed).length;
      const total = activeHabits.length;
      days.push({ pct: total > 0 ? (completed / total) * 100 : 0 });
    }
    return days;
  }, [logs, activeHabits]);

  const getHeatColor = (pct: number) => {
    if (pct === 0) return 'rgba(255,255,255,0.03)';
    if (pct <= 25) return 'rgba(139, 92, 246, 0.15)';
    if (pct <= 50) return 'rgba(139, 92, 246, 0.35)';
    if (pct <= 75) return 'rgba(139, 92, 246, 0.6)';
    return '#8B5CF6';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Habits</Text>
          <Text style={styles.headerSubtitle}>Nurture consistency and grow your garden</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.9} 
          onPress={() => setShowModal(true)}
          style={styles.headerAddBtn}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.headerAddText}>New Plant</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Stats summary banner */}
        <View style={styles.statsRow}>
          {[
            { label: 'Active Plants', value: activeHabits.length, icon: <Repeat size={14} color="#8B5CF6" /> },
            { label: 'Nurtured Today', value: `${completedToday}/${activeHabits.length}`, icon: <CheckCircle size={14} color="#22C55E" /> },
            { label: 'Max Streak', value: `${bestStreak}d`, icon: <Award size={14} color="#F59E0B" /> },
            { label: 'Consistency', value: `${avgRate}%`, icon: <TrendingUp size={14} color="#3B82F6" /> },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statIconWrapper}>{stat.icon}</View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Garden view */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Garden</Text>
          {activeHabits.length === 0 ? (
            <View style={styles.emptyGarden}>
              <Text style={styles.emptyGardenEmoji}>🍂</Text>
              <Text style={styles.emptyGardenTitle}>Your garden is empty</Text>
              <Text style={styles.emptyGardenSub}>Plant a daily ritual above and start nurturing your consistency.</Text>
            </View>
          ) : (
            <View style={styles.gardenGrid}>
              {activeHabits.map((habit) => {
                const isCompleted = todayLogs.find((l) => l.habitId === habit.id)?.completed || false;
                const streak = habitStreaks[habit.id] || { current: 0, longest: 0 };
                return (
                  <PlantCard 
                    key={habit.id}
                    id={habit.id}
                    name={habit.name}
                    streak={streak.current}
                    isCompleted={isCompleted}
                    onToggle={handleToggle}
                  />
                );
              })}
            </View>
          )}
        </View>

        {/* Grid Heatmap */}
        {activeHabits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Consistent Efforts (84-Day Grid)</Text>
            <View style={styles.heatmapCard}>
              <View style={styles.heatmapGrid}>
                {heatmapData.map((day, i) => (
                  <View 
                    key={i} 
                    style={[styles.heatmapCell, { backgroundColor: getHeatColor(day.pct) }]} 
                  />
                ))}
              </View>
              <View style={styles.heatmapFooter}>
                <Text style={styles.heatmapLegendText}>Less</Text>
                <View style={styles.heatmapLegend}>
                  {['rgba(255,255,255,0.03)', 'rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.35)', 'rgba(139, 92, 246, 0.6)', '#8B5CF6'].map((c, idx) => (
                    <View key={idx} style={[styles.heatmapLegendCell, { backgroundColor: c }]} />
                  ))}
                </View>
                <Text style={styles.heatmapLegendText}>More</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Add Habit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nurture Habit</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Habit Name</Text>
              <TextInput 
                value={name}
                onChangeText={setName}
                placeholder="e.g., Meditation, Hydrate, Read..."
                placeholderTextColor="#64748B"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ritual Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.iconScroll}>
                {emojiOptions.map((e) => (
                  <TouchableOpacity 
                    key={e} 
                    onPress={() => setIcon(e)}
                    style={[styles.iconBtn, icon === e && styles.iconBtnSelected]}>
                    <Text style={styles.iconText}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Theme Color</Text>
              <View style={styles.colorRow}>
                {subjectColors.map((c) => (
                  <TouchableOpacity 
                    key={c} 
                    onPress={() => setColor(c)}
                    style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnSelected]} 
                  />
                ))}
              </View>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleCreateHabit}
              style={styles.submitBtn}>
              <Text style={styles.submitBtnText}>Plant Seedling</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  headerAddText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#121826',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  statIconWrapper: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  emptyGarden: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  emptyGardenEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyGardenTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  emptyGardenSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  gardenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heatmapCard: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3.5,
    justifyContent: 'flex-start',
  },
  heatmapCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  heatmapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  heatmapLegend: {
    flexDirection: 'row',
    gap: 2,
  },
  heatmapLegendCell: {
    width: 8,
    height: 8,
    borderRadius: 1.5,
  },
  heatmapLegendText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  iconScroll: {
    gap: 6,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  iconBtnSelected: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: '#8B5CF6',
  },
  iconText: {
    fontSize: 18,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorBtnSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.1 }],
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
