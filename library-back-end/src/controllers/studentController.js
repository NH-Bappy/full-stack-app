import { prisma } from '../config/db.js';

export const getStudents = async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch students', error: error.message });
  }
};

export const createStudent = async (req, res) => {
  const { name, studentId, email, rfidUid } = req.body;

  if (!name || !studentId || !rfidUid) {
    return res.status(400).json({ message: 'Name, studentId, and rfidUid are required' });
  }

  try {
    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId },
          { rfidUid }
        ]
      }
    });

    if (existingStudent) {
      const field = existingStudent.studentId === studentId ? 'Student ID' : 'RFID UID';
      return res.status(409).json({ message: `${field} is already registered` });
    }

    const student = await prisma.student.create({
      data: { name, studentId, email, rfidUid },
    });

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create student', error: error.message });
  }
};

export const getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.student.findFirst({
      where: { id: Number(id), active: true },
      include: {
        transactions: {
          include: {
            book: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch student', error: error.message });
  }
};

export const updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, studentId, email, rfidUid } = req.body;

  try {
    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: { name, studentId, email, rfidUid },
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.student.update({
      where: { id: Number(id) },
      data: { active: false },
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student', error: error.message });
  }
};
