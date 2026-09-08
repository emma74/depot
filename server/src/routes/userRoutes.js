import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prismaClient.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { validatePassword } from '../utils/validators.js';

const router = express.Router();

router.get('/me', (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    role: req.user.role
  });
});

// Admin-only: list every registered user, with what they're linked to (if anything) —
// so an admin can find a user's ID instead of having to already know it.
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        employee: { select: { id: true, firstName: true, lastName: true } },
        customer: { select: { id: true, businessName: true, contactPerson: true } },
      },
      orderBy: { id: 'asc' },
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only: promote/demote another user's role
router.patch('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: "role must be 'admin' or 'user'" });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role }
    });

    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin-only: reset another user's password (they forgot it and have no self-service recovery path)
router.patch('/:id/password', requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'newPassword is required' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordError = validatePassword(newPassword, { username: targetUser.username });
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hashedPassword }
    });

    res.json({ id: user.id, username: user.username, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;