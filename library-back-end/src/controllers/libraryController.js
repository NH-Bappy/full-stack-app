import { prisma } from '../config/db.js';
import { getIO } from '../utils/socket.js';

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 10;
const BORROW_LIMIT_DAYS = Number(process.env.BORROW_LIMIT_DAYS) || 7;

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

    try {
      getIO().emit('bookIssued', {
        message: 'Book issued successfully',
        transaction,
        book,
        student,
      });
    } catch (socketError) {
      console.error('Failed to emit bookIssued socket event:', socketError.message);
    }

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
    const fine = daysBorrowed > BORROW_LIMIT_DAYS ? (daysBorrowed - BORROW_LIMIT_DAYS) * FINE_PER_DAY : 0;

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

    try {
      getIO().emit('bookReturned', {
        message: 'Book returned successfully',
        fine,
        book,
      });
    } catch (socketError) {
      console.error('Failed to emit bookReturned socket event:', socketError.message);
    }

    res.json({ message: 'Book returned successfully', fine });
  } catch (error) {
    res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
};

export const getDashboard = async (_req, res) => {
  try {
    const overdueCutoff = new Date(Date.now() - BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);
    const [totalBooks, issuedBooks, totalStudents, overdueBooks] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { available: false } }),
      prisma.student.count(),
      prisma.transaction.count({
        where: {
          returnDate: null,
          issueDate: { lt: overdueCutoff },
        },
      }),
    ]);

    res.json({
      totalBooks,
      issuedBooks,
      availableBooks: totalBooks - issuedBooks,
      totalStudents,
      overdueBooks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

export const getTransactions = async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        student: true,
        book: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

export const getOverdueTransactions = async (_req, res) => {
  try {
    const overdueCutoff = new Date(Date.now() - BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
      where: {
        returnDate: null,
        issueDate: { lt: overdueCutoff },
      },
      include: {
        student: true,
        book: true,
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch overdue transactions', error: error.message });
  }
};
