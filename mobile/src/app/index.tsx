import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlannerStore } from '@/stores/usePlannerStore';
import { useFocusStore } from '@/stores/useFocusStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { format } from 'date-fns';
import { Sparkles, Play, CheckCircle2, Circle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const tasks = usePlannerStore((s) => s.tasks);
  const toggleTask = usePlannerStore((s) => s.toggleTask);
  const focusTaskName = useFocusStore((s) => s.focusTaskName);
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const dateFormatted = format(new Date(), 'EEEE, MMMM dd');

  // Filter top 3 tasks for today
  const topThreeTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate === todayStr)
      .slice(0, 3);
  }, [tasks, todayStr]);

  // Construct Today's Mission sentence
  const todayMission = useMemo(() => {
    const activeTasks = topThreeTasks.filter((t) => t.status !== 'done');
    if (activeTasks.length === 0) {
      return "Let's build a productive day. Pick or add a new goal in the planner.";
    }
    const taskTitles = activeTasks.map((t) => t.title.toLowerCase());
    if (taskTitles.length === 1) {
      return `Focus on completing your priority: ${taskTitles[0]}.`;
    }
    if (taskTitles.length === 2) {
      return `Strive to finish ${taskTitles[0]} and complete ${taskTitles[1]} today.`;
    }
    return `Master your day by executing: ${taskTitles[0]}, ${taskTitles[1]}, and ${taskTitles[2]}.`;
  }, [topThreeTasks]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header greeting */}
        <View style={styles.header}>
          <Text style={styles.greetingTitle}>Good morning,</Text>
          <Text style={styles.greetingName}>Hemaprasad.</Text>
          <Text style={styles.dateText}>{dateFormatted}</Text>
        </View>

        {/* Today's Mission statement */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Today's Mission</Text>
          <Text style={styles.missionText}>"{todayMission}"</Text>
        </View>

        {/* 3 Things That Matter Today */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Things That Matter Today</Text>
          {topThreeTasks.length === 0 ? (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => router.push('/planner')}
              style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No priorities scheduled for today.</Text>
              <Text style={styles.emptyStateLink}>Tap here to build your timeline</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.taskList}>
              {topThreeTasks.map((task) => {
                const isCompleted = task.status === 'done';
                return (
                  <TouchableOpacity 
                    key={task.id} 
                    activeOpacity={0.8}
                    onPress={() => toggleTask(task.id)}
                    style={[styles.taskItem, isCompleted && styles.taskItemCompleted]}>
                    <View style={styles.taskLabelWrapper}>
                      {isCompleted ? (
                        <CheckCircle2 color="#22C55E" size={20} />
                      ) : (
                        <Circle color="#64748B" size={20} />
                      )}
                      <Text style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}>
                        {task.title}
                      </Text>
                    </View>
                    <Text style={styles.priorityBadge}>{task.priority}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Continue Where You Left Off */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Where You Left Off</Text>
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => router.push('/focus')}
            style={styles.continueCard}>
            <View style={styles.continueLeft}>
              <Text style={styles.continueHeader}>⏱️ Focus Session</Text>
              <Text style={styles.continueSubject}>{focusTaskName}</Text>
            </View>
            <View style={styles.continuePlayButton}>
              <Play color="#FFFFFF" size={14} fill="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* AI Coach Suggestion */}
        <View style={styles.coachCard}>
          <View style={styles.coachTitleWrapper}>
            <Sparkles color="#8B5CF6" size={16} fill="#8B5CF6" />
            <Text style={styles.coachLabel}>AI Coach Recommendation</Text>
          </View>
          <Text style={styles.coachText}>
            "You focus 28% better after getting a workout in. Consider planning a physical activity in your Afternoon bucket."
          </Text>
        </View>

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
    marginBottom: 24,
    paddingTop: 8,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  dateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  missionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
    paddingHorizontal: 2,
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
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  taskLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
    flex: 1,
  },
  taskTitleCompleted: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  priorityBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emptyState: {
    backgroundColor: '#121826',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyStateLink: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '700',
    marginTop: 6,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121826',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  continueLeft: {
    flex: 1,
  },
  continueHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  continueSubject: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 4,
  },
  continuePlayButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  coachTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  coachLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B5CF6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coachText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A78BFA',
    lineHeight: 18,
  },
});
