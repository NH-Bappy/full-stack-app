import { prisma } from '../config/db.js';
import { getIO } from '../utils/socket.js';

const FINE_PER_DAY = 10;

export const issueBook = async (req, res) => {
  const { studentId, studentRfidUid, bookRfidUid } = req.body;

  if ((!studentId && !studentRfidUid) || !bookRfidUid) {
    return res.status(400).json({ message: 'studentId or studentRfidUid, and bookRfidUid are required' });
  }

  try {
    let student = null;
    if (studentRfidUid) {
      student = await prisma.student.findUnique({ where: { rfidUid: studentRfidUid } });
    } else if (studentId) {
      student = await prisma.student.findUnique({ where: { studentId } });
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const book = await prisma.book.findUnique({ where: { rfidUid: bookRfidUid } });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (!book.available) {
      return res.status(409).json({ message: 'Book is already issued' });
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const trans = await tx.transaction.create({
        data: {
          studentId: student.id,
          bookId: book.id,
          issuedByAdminId: req.admin?.id,
        },
      });

      await tx.book.update({
        where: { id: book.id },
        data: { available: false },
      });

      return trans;
    });

    getIO().emit('bookIssued', {
      message: 'Book issued successfully',
      transaction,
      book,
      student,
    });

    res.status(201).json({ message: 'Book issued successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Failed to issue book', error: error.message });
  }
};

export const returnBook = async (req, res) => {
  const { bookRfidUid } = req.body;

  if (!bookRfidUid) {
    return res.status(400).json({ message: 'bookRfidUid is required' });
  }

  try {
    const book = await prisma.book.findUnique({ where: { rfidUid: bookRfidUid } });
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { bookId: book.id, returnDate: null },
      orderBy: { issueDate: 'desc' },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'No active transaction found for this book' });
    }

    const returnDate = new Date();
    const daysBorrowed = Math.max(1, Math.ceil((returnDate - transaction.issueDate) / (1000 * 60 * 60 * 24)));
    const fine = daysBorrowed > 7 ? (daysBorrowed - 7) * FINE_PER_DAY : 0;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          returnDate,
          fine,
          returnedByAdminId: req.admin?.id,
        },
      });

      await tx.book.update({
        where: { id: book.id },
        data: { available: true },
      });
    });

    getIO().emit('bookReturned', {
      message: 'Book returned successfully',
      fine,
      book,
    });

    res.json({ message: 'Book returned successfully', fine });
  } catch (error) {
    res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
};

export const getDashboard = async (_req, res) => {
  try {
    const [totalBooks, issuedBooks, totalStudents] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { available: false } }),
      prisma.student.count(),
    ]);

    res.json({
      totalBooks,
      issuedBooks,
      availableBooks: totalBooks - issuedBooks,
      totalStudents,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};
