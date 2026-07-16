import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { signToken } from '../utils/jwt.js';

export const registerAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { username } });

    if (existing) {
      return res.status(409).json({ message: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { username, password: hashedPassword },
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { username } });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: admin.id, username: admin.username });

    res.json({
      message: 'Login successful',
      token,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};
