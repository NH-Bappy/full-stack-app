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
      data: { name, studentId, email, rfidUid, profileImage: "" },
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
            borrowDate: 'desc',
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
  const { name, studentId, email } = req.body;

  try {
    const updatedData = { name, studentId, email };

    const existingStudent = await prisma.student.findUnique({
      where: { id: Number(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = await prisma.student.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update student', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  const { id } = req.params;

  try {
    const studentIdNum = Number(id);

    const student = await prisma.student.findUnique({
      where: { id: studentIdNum }
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // 1. Delete associated transactions first to prevent foreign key errors
    await prisma.transaction.deleteMany({
      where: { studentId: studentIdNum },
    });

    // 2. Hard delete the student
    await prisma.student.delete({
      where: { id: studentIdNum },
    });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student', error: error.message });
  }
};

export const getBorrowingStudents = async (_req, res) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        active: true,
        transactions: {
          some: {},
        },
      },
      include: {
        transactions: {
          include: {
            book: true,
          },
          orderBy: {
            borrowDate: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch borrowing students', error: error.message });
  }
};
