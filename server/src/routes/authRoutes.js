// src/routes/authRoutes.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { generateToken } from '../utils/jwt.js';
import { validateUsername, validatePassword } from '../utils/validators.js';

const router = express.Router();

// -------------------- REGISTER --------------------
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    const trimmedUsername = username.trim();

    const usernameError = validateUsername(trimmedUsername);
    if (usernameError) return res.status(400).json({ message: usernameError });

    const passwordError = validatePassword(password, { username: trimmedUsername });
    if (passwordError) return res.status(400).json({ message: passwordError });

    // Case-insensitive so "Bob" and "bob" can't both be registered.
    const existingUser = await prisma.user.findFirst({
      where: { username: { equals: trimmedUsername, mode: 'insensitive' } },
    });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: trimmedUsername, password: hashedPassword },
    });

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------------------- LOGIN --------------------
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username and password required" });

    // Case-insensitive to match registration's case-insensitive uniqueness check —
    // someone who registered as "Bob" must be able to log in typing "bob".
    const user = await prisma.user.findFirst({
      where: { username: { equals: username.trim(), mode: 'insensitive' } },
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;