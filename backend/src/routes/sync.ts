import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/push-offline-data', authMiddleware, async (req: any, res) => {
  const userId = req.userId;
  const {
    goals,
    tasks,
    habits,
    habitLogs,
    subjects,
    studySessions,
    focusSessions,
    healthLogs,
    exerciseLogs,
    journalEntries,
    weeklyReviews,
    achievements,
    xpEvents,
  } = req.body;

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete in correct order of dependency constraints
      await tx.milestone.deleteMany({ where: { goal: { userId } } });
      await tx.goal.deleteMany({ where: { userId } });
      await tx.task.deleteMany({ where: { userId } });
      
      // Delete habit logs and parent habits
      await tx.habitLog.deleteMany({ where: { habit: { userId } } });
      await tx.habit.deleteMany({ where: { userId } });
      
      // Delete sessions and parent subjects
      await tx.studySession.deleteMany({ where: { userId } });
      await tx.subject.deleteMany({ where: { userId } });
      
      await tx.focusSession.deleteMany({ where: { userId } });
      await tx.healthLog.deleteMany({ where: { userId } });
      await tx.exerciseLog.deleteMany({ where: { userId } });
      await tx.journalEntry.deleteMany({ where: { userId } });
      await tx.weeklyReview.deleteMany({ where: { userId } });
      await tx.unlockedAchievement.deleteMany({ where: { userId } });
      await tx.xPEvent.deleteMany({ where: { userId } });

      // 2. Re-insert arrays
      if (goals && goals.length > 0) {
        for (const goal of goals) {
          const { milestones, ...goalData } = goal;
          await tx.goal.create({
            data: {
              ...goalData,
              userId,
              createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date(),
            },
          });
          if (milestones && milestones.length > 0) {
            await tx.milestone.createMany({
              data: milestones.map((m: any) => ({
                id: m.id,
                title: m.title,
                completed: m.completed,
                goalId: goal.id,
              })),
            });
          }
        }
      }

      if (tasks && tasks.length > 0) {
        await tx.task.createMany({
          data: tasks.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category,
            dueDate: t.dueDate,
            estimatedMinutes: t.estimatedMinutes,
            priority: t.priority,
            status: t.status,
            completedAt: t.completedAt,
            userId,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
          })),
        });
      }

      if (habits && habits.length > 0) {
        await tx.habit.createMany({
          data: habits.map((h: any) => ({
            id: h.id,
            name: h.name,
            icon: h.icon,
            color: h.color,
            frequency: h.frequency,
            targetCount: h.targetCount,
            archived: h.archived || false,
            userId,
            createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
          })),
        });
      }

      if (habitLogs && habitLogs.length > 0) {
        await tx.habitLog.createMany({
          data: habitLogs.map((l: any) => ({
            id: l.id,
            habitId: l.habitId,
            date: l.date,
            completed: l.completed,
            count: l.count,
          })),
        });
      }

      if (subjects && subjects.length > 0) {
        await tx.subject.createMany({
          data: subjects.map((s: any) => ({
            id: s.id,
            name: s.name,
            totalChapters: s.totalChapters,
            completedChapters: s.completedChapters,
            difficulty: s.difficulty,
            notes: s.notes,
            color: s.color,
            userId,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          })),
        });
      }

      if (studySessions && studySessions.length > 0) {
        await tx.studySession.createMany({
          data: studySessions.map((s: any) => ({
            id: s.id,
            subjectId: s.subjectId,
            topic: s.topic,
            startTime: s.startTime,
            endTime: s.endTime,
            durationMinutes: s.durationMinutes,
            focusRating: s.focusRating,
            productivityRating: s.productivityRating,
            notes: s.notes,
            userId,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          })),
        });
      }

      if (focusSessions && focusSessions.length > 0) {
        await tx.focusSession.createMany({
          data: focusSessions.map((s: any) => ({
            id: s.id,
            type: s.type,
            durationMinutes: s.durationMinutes,
            breakMinutes: s.breakMinutes,
            subjectId: s.subjectId,
            topic: s.topic,
            startTime: s.startTime,
            endTime: s.endTime,
            completed: s.completed,
            userId,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          })),
        });
      }

      if (healthLogs && healthLogs.length > 0) {
        await tx.healthLog.createMany({
          data: healthLogs.map((l: any) => ({
            id: l.id,
            date: l.date,
            weight: l.weight,
            height: l.height,
            waterIntake: l.waterIntake,
            sleepHours: l.sleepHours,
            steps: l.steps,
            caloriesBurned: l.caloriesBurned,
            userId,
            createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          })),
        });
      }

      if (exerciseLogs && exerciseLogs.length > 0) {
        await tx.exerciseLog.createMany({
          data: exerciseLogs.map((l: any) => ({
            id: l.id,
            date: l.date,
            type: l.type,
            durationMinutes: l.durationMinutes,
            intensity: l.intensity,
            caloriesBurned: l.caloriesBurned,
            notes: l.notes,
            userId,
            createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          })),
        });
      }

      if (journalEntries && journalEntries.length > 0) {
        await tx.journalEntry.createMany({
          data: journalEntries.map((l: any) => ({
            id: l.id,
            date: l.date,
            wentWell: l.wentWell,
            toImprove: l.toImprove,
            learned: l.learned,
            gratefulFor: l.gratefulFor,
            distractions: l.distractions,
            tomorrowPriority: l.tomorrowPriority,
            mood: l.mood,
            tags: l.tags || [],
            userId,
            createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
          })),
        });
      }

      if (weeklyReviews && weeklyReviews.length > 0) {
        await tx.weeklyReview.createMany({
          data: weeklyReviews.map((r: any) => ({
            id: r.id,
            weekStartDate: r.weekStartDate,
            weekEndDate: r.weekEndDate,
            year: r.year,
            weekNumber: r.weekNumber,
            tasksCompleted: r.tasksCompleted,
            tasksMissed: r.tasksMissed,
            mostProductiveDay: r.mostProductiveDay,
            habitSuccessRate: r.habitSuccessRate,
            studyHoursTotal: r.studyHoursTotal,
            studySubjectMinutes: r.studySubjectMinutes,
            averageSleep: r.averageSleep,
            waterTotal: r.waterTotal,
            workoutCount: r.workoutCount,
            aiInsights: r.aiInsights,
            userId,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          })),
        });
      }

      if (achievements && achievements.length > 0) {
        await tx.unlockedAchievement.createMany({
          data: achievements.map((a: any) => ({
            id: a.id,
            achievementId: a.achievementId || a.id, // Handle potential shape mappings
            unlockedAt: a.unlockedAt || new Date().toISOString(),
            userId,
          })),
        });
      }

      if (xpEvents && xpEvents.length > 0) {
        await tx.xPEvent.createMany({
          data: xpEvents.map((x: any) => ({
            id: x.id,
            type: x.type,
            amount: x.amount,
            description: x.description,
            timestamp: x.timestamp,
            userId,
          })),
        });
      }
    });

    res.json({ success: true, message: 'All local metrics synchronized to PostgreSQL.' });
  } catch (err: any) {
    console.error('Sync migration transaction failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/pull-all-data', authMiddleware, async (req: any, res) => {
  const userId = req.userId;
  try {
    const goals = await prisma.goal.findMany({ where: { userId }, include: { milestones: true } });
    const tasks = await prisma.task.findMany({ where: { userId } });
    const habits = await prisma.habit.findMany({ where: { userId } });
    const habitLogs = await prisma.habitLog.findMany({ where: { habit: { userId } } });
    const subjects = await prisma.subject.findMany({ where: { userId } });
    const studySessions = await prisma.studySession.findMany({ where: { userId } });
    const focusSessions = await prisma.focusSession.findMany({ where: { userId } });
    const healthLogs = await prisma.healthLog.findMany({ where: { userId } });
    const exerciseLogs = await prisma.exerciseLog.findMany({ where: { userId } });
    const journalEntries = await prisma.journalEntry.findMany({ where: { userId } });
    const weeklyReviews = await prisma.weeklyReview.findMany({ where: { userId } });
    const achievements = await prisma.unlockedAchievement.findMany({ where: { userId } });
    const xpEvents = await prisma.xPEvent.findMany({ where: { userId } });

    res.json({
      goals,
      tasks,
      habits,
      habitLogs,
      subjects,
      studySessions,
      focusSessions,
      healthLogs,
      exerciseLogs,
      journalEntries,
      weeklyReviews,
      achievements,
      xpEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
