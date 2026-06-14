import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Apply auth middleware to all feature routes
router.use(authMiddleware);

// --- GOALS & MILESTONES ---
router.post('/goals', async (req: any, res) => {
  const userId = req.userId;
  const { id, title, description, why, category, deadline, priority, milestones } = req.body;
  try {
    const goal = await prisma.goal.create({
      data: {
        id,
        userId,
        title,
        description,
        why,
        category,
        deadline,
        priority,
        progress: 0,
        archived: false,
      },
    });

    if (milestones && milestones.length > 0) {
      await prisma.milestone.createMany({
        data: milestones.map((m: any) => ({
          id: m.id,
          goalId: id,
          title: m.title,
          completed: m.completed || false,
        })),
      });
    }

    const fullGoal = await prisma.goal.findUnique({
      where: { id },
      include: { milestones: true },
    });
    res.status(201).json(fullGoal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/goals/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const milestones = updates.milestones;
  delete updates.milestones;
  delete updates.id;
  delete updates.userId;

  try {
    await prisma.goal.update({
      where: { id },
      data: updates,
    });

    if (milestones) {
      // Re-sync milestones: simple way is delete and recreate
      await prisma.milestone.deleteMany({ where: { goalId: id } });
      if (milestones.length > 0) {
        await prisma.milestone.createMany({
          data: milestones.map((m: any) => ({
            id: m.id,
            goalId: id,
            title: m.title,
            completed: m.completed,
          })),
        });
      }
    }

    const fullGoal = await prisma.goal.findUnique({
      where: { id },
      include: { milestones: true },
    });
    res.json(fullGoal);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/goals/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.goal.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/goals/:id/milestones/:mId', async (req: any, res) => {
  const { mId } = req.params;
  const { completed } = req.body;
  try {
    const updated = await prisma.milestone.update({
      where: { id: mId },
      data: { completed },
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- TASKS ---
router.post('/tasks', async (req: any, res) => {
  const userId = req.userId;
  const { id, title, description, category, dueDate, estimatedMinutes, priority, status } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        id,
        userId,
        title,
        description,
        category,
        dueDate,
        estimatedMinutes,
        priority,
        status,
      },
    });
    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tasks/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  delete updates.id;
  delete updates.userId;
  try {
    const task = await prisma.task.update({
      where: { id },
      data: updates,
    });
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tasks/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.task.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- HABITS ---
router.post('/habits', async (req: any, res) => {
  const userId = req.userId;
  const { id, name, icon, color, frequency, targetCount } = req.body;
  try {
    const habit = await prisma.habit.create({
      data: {
        id,
        userId,
        name,
        icon,
        color,
        frequency,
        targetCount,
      },
    });
    res.status(201).json(habit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/habits/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  delete updates.id;
  delete updates.userId;
  try {
    const habit = await prisma.habit.update({
      where: { id },
      data: updates,
    });
    res.json(habit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/habits/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.habit.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/habits/logs', async (req: any, res) => {
  const { id, habitId, date, completed, count } = req.body;
  try {
    const log = await prisma.habitLog.upsert({
      where: { id },
      update: { completed, count },
      create: { id, habitId, date, completed, count },
    });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- STUDY ---
router.post('/subjects', async (req: any, res) => {
  const userId = req.userId;
  const { id, name, totalChapters, completedChapters, difficulty, notes, color } = req.body;
  try {
    const subject = await prisma.subject.create({
      data: {
        id,
        userId,
        name,
        totalChapters,
        completedChapters,
        difficulty,
        notes,
        color,
      },
    });
    res.status(201).json(subject);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/subjects/:id', async (req: any, res) => {
  const { id } = req.params;
  const updates = req.body;
  delete updates.id;
  delete updates.userId;
  try {
    const subject = await prisma.subject.update({
      where: { id },
      data: updates,
    });
    res.json(subject);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/subjects/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.subject.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/study-sessions', async (req: any, res) => {
  const userId = req.userId;
  const { id, subjectId, topic, startTime, endTime, durationMinutes, focusRating, productivityRating, notes } = req.body;
  try {
    const session = await prisma.studySession.create({
      data: {
        id,
        userId,
        subjectId,
        topic,
        startTime,
        endTime,
        durationMinutes,
        focusRating,
        productivityRating,
        notes,
      },
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/study-sessions/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.studySession.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- FOCUS SESSIONS ---
router.post('/focus-sessions', async (req: any, res) => {
  const userId = req.userId;
  const { id, type, durationMinutes, breakMinutes, subjectId, topic, startTime, endTime, completed } = req.body;
  try {
    const session = await prisma.focusSession.create({
      data: {
        id,
        userId,
        type,
        durationMinutes,
        breakMinutes,
        subjectId,
        topic,
        startTime,
        endTime,
        completed,
      },
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- HEALTH & EXERCISE ---
router.post('/health-logs', async (req: any, res) => {
  const userId = req.userId;
  const { id, date, weight, height, waterIntake, sleepHours, steps, caloriesBurned } = req.body;
  try {
    const log = await prisma.healthLog.upsert({
      where: { id },
      update: { weight, height, waterIntake, sleepHours, steps, caloriesBurned },
      create: { id, userId, date, weight, height, waterIntake, sleepHours, steps, caloriesBurned },
    });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/exercise-logs', async (req: any, res) => {
  const userId = req.userId;
  const { id, date, type, durationMinutes, intensity, caloriesBurned, notes } = req.body;
  try {
    const exercise = await prisma.exerciseLog.create({
      data: {
        id,
        userId,
        date,
        type,
        durationMinutes,
        intensity,
        caloriesBurned,
        notes,
      },
    });
    res.status(201).json(exercise);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/exercise-logs/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.exerciseLog.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- JOURNAL ---
router.post('/journal', async (req: any, res) => {
  const userId = req.userId;
  const { id, date, wentWell, toImprove, learned, gratefulFor, distractions, tomorrowPriority, mood, tags } = req.body;
  try {
    const entry = await prisma.journalEntry.upsert({
      where: { id },
      update: { wentWell, toImprove, learned, gratefulFor, distractions, tomorrowPriority, mood, tags },
      create: { id, userId, date, wentWell, toImprove, learned, gratefulFor, distractions, tomorrowPriority, mood, tags },
    });
    res.json(entry);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- WEEKLY REVIEWS ---
router.post('/reviews', async (req: any, res) => {
  const userId = req.userId;
  const {
    id,
    weekStartDate,
    weekEndDate,
    year,
    weekNumber,
    tasksCompleted,
    tasksMissed,
    mostProductiveDay,
    habitSuccessRate,
    studyHoursTotal,
    studySubjectMinutes,
    averageSleep,
    waterTotal,
    workoutCount,
    aiInsights,
  } = req.body;

  try {
    const review = await prisma.weeklyReview.create({
      data: {
        id,
        userId,
        weekStartDate,
        weekEndDate,
        year,
        weekNumber,
        tasksCompleted,
        tasksMissed,
        mostProductiveDay,
        habitSuccessRate,
        studyHoursTotal,
        studySubjectMinutes,
        averageSleep,
        waterTotal,
        workoutCount,
        aiInsights,
      },
    });
    res.status(201).json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/reviews/:id', async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.weeklyReview.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- GAMIFICATION (XP & ACHIEVEMENTS) ---
router.post('/xp', async (req: any, res) => {
  const userId = req.userId;
  const { id, type, amount, description, timestamp } = req.body;
  try {
    const xpEvent = await prisma.xPEvent.create({
      data: {
        id,
        userId,
        type,
        amount,
        description,
        timestamp,
      },
    });
    res.status(201).json(xpEvent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/achievements', async (req: any, res) => {
  const userId = req.userId;
  const { id, achievementId, unlockedAt } = req.body;
  try {
    const achievement = await prisma.unlockedAchievement.create({
      data: {
        id,
        userId,
        achievementId,
        unlockedAt,
      },
    });
    res.status(201).json(achievement);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
