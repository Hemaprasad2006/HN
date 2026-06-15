import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoalStore } from '@/stores/useGoalStore';
import { useGameStore } from '@/stores/useGameStore';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { getLevel, getLevelProgress, getLevelTitle } from '@/utils/helpers';
import { Star, Flame, Zap, CheckSquare, Award, LogOut, ChevronRight, Target, Shield, Heart } from 'lucide-react-native';

export default function LifeScreen() {
  const totalXP = useGameStore((s: any) => s.totalXP);
  const unlockedAchievements = useGameStore((s: any) => s.unlockedAchievements);
  const tasks = usePlannerStore((s: any) => s.tasks);
  const { habits, logs: habitLogs } = useHabitStore();
  const { sessions: focusSessions } = useFocusStore();

  const level = getLevel(totalXP);
  const levelPct = getLevelProgress(totalXP);
  const levelTitle = getLevelTitle(level);
  const unlockedCount = unlockedAchievements.length;

  const completedTasksCount = useMemo(() => {
    return tasks.filter((t: any) => t.status === 'done').length;
  }, [tasks]);

  // Compute best habit streak
  const bestStreak = useMemo(() => {
    let max = 0;
    habits.forEach((h) => {
      const dates = habitLogs.filter((l) => l.habitId === h.id && l.completed).map((l) => l.date);
      if (dates.length === 0) return;
      const sorted = [...dates].sort().reverse();
      
      let temp = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / (24 * 60 * 60 * 1000));
        if (diff === 1) {
          temp++;
        } else if (diff > 1) {
          max = Math.max(max, temp);
          temp = 1;
        }
      }
      max = Math.max(max, temp);
    });
    return max;
  }, [habits, habitLogs]);

  // Focus time stats
  const totalFocusMinutes = useMemo(() => {
    return focusSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [focusSessions]);

  const totalFocusSessions = useMemo(() => {
    return focusSessions.filter((s) => s.completed).length;
  }, [focusSessions]);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your growth profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Life</Text>
          <Text style={styles.headerSubtitle}>Identity progression, values, and journey logs</Text>
        </View>

        {/* Identity Quote: Who you are becoming */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteLabel}>Who You Are Becoming</Text>
          <Text style={styles.quoteText}>
            "I am designing a life of absolute clarity, relentless focus, and deep physical vitality."
          </Text>
          <Text style={styles.quoteAuthor}>Hemaprasad · Personal Growth Profile</Text>
        </View>

        {/* Identity Rank & Level Status */}
        <View style={styles.card}>
          <View style={styles.levelHeader}>
            <View>
              <Text style={styles.cardLabel}>Identity Rank</Text>
              <Text style={styles.levelTitle}>Level {level} · {levelTitle}</Text>
            </View>
            <View style={styles.starIconWrapper}>
              <Star color="#8B5CF6" size={20} fill="#8B5CF6" />
            </View>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${levelPct}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{levelPct}%</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValText}>{totalXP.toLocaleString()}</Text>
              <Text style={styles.statLabelText}>Accumulated XP</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValText}>{unlockedCount}</Text>
              <Text style={styles.statLabelText}>Achievements</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statValText}>{completedTasksCount}</Text>
              <Text style={styles.statLabelText}>Missions Done</Text>
            </View>
          </View>
        </View>

        {/* Guiding Values */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guiding Values</Text>
          <View style={styles.valuesGrid}>
            {[
              { title: 'Focus First', desc: 'Protect attention. Keep work deep and single-minded, rejecting distractions.', emoji: '🧠' },
              { title: 'Daily Consistency', desc: 'Nurture habits. Keep plants hydrated daily and sustain streaks.', emoji: '🌿' },
              { title: 'Full Vitality', desc: 'Stay energized. Sleep consistently, hydrate well, and exercise.', emoji: '⚡' },
              { title: 'Continuous Progress', desc: 'Step by step. Master new skills, complete missions, and level up.', emoji: '📈' },
            ].map((val, idx) => (
              <View key={idx} style={styles.valueCard}>
                <Text style={styles.valueEmoji}>{val.emoji}</Text>
                <View style={styles.valueInfo}>
                  <Text style={styles.valueTitle}>{val.title}</Text>
                  <Text style={styles.valueDesc}>{val.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Journey Logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Logs</Text>
          <View style={styles.logsCard}>
            <View style={styles.logItem}>
              <Flame color="#F59E0B" size={18} />
              <Text style={styles.logText}>
                Longest consistency streak: <Text style={styles.logHighlight}>{bestStreak} days</Text>
              </Text>
            </View>
            <View style={styles.logItem}>
              <Zap color="#8B5CF6" size={18} />
              <Text style={styles.logText}>
                Deep Focus sessions: <Text style={styles.logHighlight}>{totalFocusSessions} logged</Text> ({totalFocusMinutes}m)
              </Text>
            </View>
            <View style={styles.logItem}>
              <CheckSquare color="#22C55E" size={18} />
              <Text style={styles.logText}>
                Missions executed: <Text style={styles.logHighlight}>{completedTasksCount} planner tasks</Text>
              </Text>
            </View>
            <View style={styles.logItem}>
              <Award color="#3B82F6" size={18} />
              <Text style={styles.logText}>
                Rank status: <Text style={styles.logHighlight}>{levelTitle} (Level {level})</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={handleSignOut}
          style={styles.signOutBtn}>
          <Text style={styles.signOutBtnText}>Sign Out</Text>
          <LogOut color="#EF4444" size={16} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090B14',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 12,
    marginBottom: 20,
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
  quoteCard: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
  },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  starIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8B5CF6',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.03)',
    paddingTop: 16,
  },
  statCol: {
    flex: 1,
  },
  statValText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  statLabelText: {
    fontSize: 10,
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
  valuesGrid: {
    gap: 12,
  },
  valueCard: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  valueEmoji: {
    fontSize: 28,
    marginTop: 2,
  },
  valueInfo: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  valueDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 18,
    fontWeight: '500',
  },
  logsCard: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    gap: 14,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '700',
    flex: 1,
  },
  logHighlight: {
    color: '#F8FAFC',
    fontWeight: '800',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginTop: 12,
  },
  signOutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },
});
