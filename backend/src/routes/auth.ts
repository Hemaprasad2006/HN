import { Router } from 'express';
import { prisma } from '../prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hn_super_secret_jwt_sign_key_123!';

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ error: 'User already exists with this email.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || 'User',
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...profile } = user;
    res.status(201).json({ token, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    const matched = await bcrypt.compare(password, user.passwordHash);
    if (!matched) {
      res.status(400).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const { passwordHash: _, ...profile } = user;
    res.json({ token, profile });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const { passwordHash: _, ...profile } = user;
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  const userId = (req as any).userId;
  const updates = req.body;

  delete updates.id;
  delete updates.email;
  delete updates.passwordHash;
  delete updates.createdAt;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });
    const { passwordHash: _, ...profile } = updated;
    res.json(profile);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
