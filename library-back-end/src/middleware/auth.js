import { prisma } from '../config/db.js';
import { verifyToken } from '../utils/jwt.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    const admin = await prisma.admin.findUnique({ where: { id: decoded.id } });

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
