import { prisma } from '../config/db.js';
import { getIO } from '../utils/socket.js';

const FINE_PER_DAY = Number(process.env.FINE_PER_DAY) || 10;
const BORROW_LIMIT_DAYS = Number(process.env.BORROW_LIMIT_DAYS) || 7;

export const borrowBook = async (req, res) => {
  const { studentId, studentRfidUid, bookRfidUid, durationValue, durationUnit, durationDays, durationHours, durationMinutes, dueDate } = req.body;

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
      return res.status(409).json({ message: 'Book is already borrowed' });
    }

    let calculatedDueDate = null;
    if (dueDate) {
      calculatedDueDate = new Date(dueDate);
    } else if (durationValue !== undefined && durationUnit) {
      const val = Math.max(1, parseInt(durationValue, 10) || 6);
      const now = new Date();
      const unit = String(durationUnit).toLowerCase();
      if (unit === 'minutes' || unit === 'minute') {
        calculatedDueDate = new Date(now.getTime() + val * 60 * 1000);
      } else if (unit === 'hours' || unit === 'hour') {
        calculatedDueDate = new Date(now.getTime() + val * 60 * 60 * 1000);
      } else if (unit === 'days' || unit === 'day') {
        calculatedDueDate = new Date(now.getTime() + val * 24 * 60 * 60 * 1000);
      } else if (unit === 'months' || unit === 'month') {
        const d = new Date(now);
        d.setMonth(d.getMonth() + val);
        calculatedDueDate = d;
      }
    } else if (durationDays !== undefined || durationHours !== undefined || durationMinutes !== undefined) {
      const days = Math.max(0, parseInt(durationDays, 10) || 0);
      const hours = Math.max(0, parseInt(durationHours, 10) || 0);
      const minutes = Math.max(0, parseInt(durationMinutes, 10) || 0);
      const totalMs = ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
      if (totalMs > 0) {
        calculatedDueDate = new Date(Date.now() + totalMs);
      }
    }

    if (!calculatedDueDate || isNaN(calculatedDueDate.getTime())) {
      const defaultDueDate = new Date();
      defaultDueDate.setMonth(defaultDueDate.getMonth() + 6);
      calculatedDueDate = defaultDueDate;
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const trans = await tx.transaction.create({
        data: {
          studentId: student.id,
          bookId: book.id,
          dueDate: calculatedDueDate,
          borrowedByAdminId: req.admin?.id,
        },
      });

      await tx.book.update({
        where: { id: book.id },
        data: { available: false },
      });

      return trans;
    });

    try {
      getIO().emit('bookBorrowed', {
        message: 'Book borrowed successfully',
        transaction,
        book,
        student,
      });
    } catch (socketError) {
      console.error('Failed to emit bookBorrowed socket event:', socketError.message);
    }

    res.status(201).json({ message: 'Book borrowed successfully', transaction, student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to borrow book', error: error.message });
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
      orderBy: { borrowDate: 'desc' },
      include: { student: true },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'No active transaction found for this book' });
    }

    const returnDate = new Date();
    const effectiveDueDate = transaction.dueDate
      ? new Date(transaction.dueDate)
      : new Date(new Date(transaction.borrowDate).getTime() + BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);

    const overdueMs = returnDate.getTime() - effectiveDueDate.getTime();
    const daysOverdue = overdueMs > 0 ? Math.ceil(overdueMs / (1000 * 60 * 60 * 24)) : 0;
    const fine = daysOverdue * FINE_PER_DAY;

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
        student: transaction.student,
      });
    } catch (socketError) {
      console.error('Failed to emit bookReturned socket event:', socketError.message);
    }

    res.json({ message: 'Book returned successfully', fine, book, student: transaction.student });
  } catch (error) {
    res.status(500).json({ message: 'Failed to return book', error: error.message });
  }
};

export const getDashboard = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const now = new Date();
    const overdueCutoff = new Date(now.getTime() - BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);

    const adminActiveBorrowFilter = adminId
      ? { borrowedByAdminId: adminId, returnDate: null }
      : { returnDate: null };

    const adminOverdueFilter = adminId
      ? {
          borrowedByAdminId: adminId,
          returnDate: null,
          OR: [
            { dueDate: { lt: now } },
            { dueDate: null, borrowDate: { lt: overdueCutoff } },
          ],
        }
      : {
          returnDate: null,
          OR: [
            { dueDate: { lt: now } },
            { dueDate: null, borrowDate: { lt: overdueCutoff } },
          ],
        };

    const [totalBooks, totalBorrowedBooks, totalStudents, adminBorrowedCount, overdueBooks] = await Promise.all([
      prisma.book.count({ where: { active: true } }),
      prisma.book.count({ where: { active: true, available: false } }),
      prisma.student.count({ where: { active: true, ...(adminId ? { adminId } : {}) } }),
      prisma.transaction.count({ where: adminActiveBorrowFilter }),
      prisma.transaction.count({ where: adminOverdueFilter }),
    ]);

    res.json({
      totalBooks,
      borrowedBooks: adminBorrowedCount,
      availableBooks: totalBooks - adminBorrowedCount,
      totalStudents,
      overdueBooks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const whereClause = adminId
      ? {
          OR: [
            { borrowedByAdminId: adminId },
            { returnedByAdminId: adminId },
          ],
        }
      : {};

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        student: true,
        book: true,
      },
      orderBy: {
        borrowDate: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};

export const getOverdueTransactions = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const now = new Date();
    const overdueCutoff = new Date(now.getTime() - BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);

    const whereClause = {
      returnDate: null,
      ...(adminId ? { borrowedByAdminId: adminId } : {}),
      OR: [
        { dueDate: { lt: now } },
        { dueDate: null, borrowDate: { lt: overdueCutoff } },
      ],
    };

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        student: true,
        book: true,
      },
      orderBy: {
        borrowDate: 'desc',
      },
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch overdue transactions', error: error.message });
  }
};

export const scanRfid = async (req, res) => {
  const { rfidUid } = req.body;

  if (!rfidUid) {
    return res.status(400).json({ message: 'rfidUid is required' });
  }

  try {
    // 1. Try to find the UID in Student
    const student = await prisma.student.findUnique({ where: { rfidUid } });
    if (student) {
      try {
        getIO().emit('rfidScan', {
          rfidUid,
          type: 'student',
          student,
        });
      } catch (socketError) {
        console.error('Failed to emit rfidScan socket event for student:', socketError.message);
      }
      return res.status(200).json({ message: 'Student RFID scanned successfully', rfidUid, type: 'student', student });
    }

    // 2. Try to find the UID in Book
    const book = await prisma.book.findUnique({ where: { rfidUid } });
    if (book) {
      // Auto-return logic: if book is currently borrowed (!book.available), return it automatically on scan
      if (!book.available) {
        const transaction = await prisma.transaction.findFirst({
          where: { bookId: book.id, returnDate: null },
          orderBy: { borrowDate: 'desc' },
          include: { student: true },
        });

        if (transaction) {
          const returnDate = new Date();
          const effectiveDueDate = transaction.dueDate
            ? new Date(transaction.dueDate)
            : new Date(new Date(transaction.borrowDate).getTime() + BORROW_LIMIT_DAYS * 24 * 60 * 60 * 1000);

          const overdueMs = returnDate.getTime() - effectiveDueDate.getTime();
          const daysOverdue = overdueMs > 0 ? Math.ceil(overdueMs / (1000 * 60 * 60 * 24)) : 0;
          const fine = daysOverdue * FINE_PER_DAY;

          await prisma.$transaction(async (tx) => {
            await tx.transaction.update({
              where: { id: transaction.id },
              data: {
                returnDate,
                fine,
                returnedByAdminId: req.admin?.id || null,
              },
            });

            await tx.book.update({
              where: { id: book.id },
              data: { available: true },
            });
          });

          const updatedBook = { ...book, available: true };

          try {
            getIO().emit('bookReturned', {
              message: 'Book returned automatically via RFID scan',
              fine,
              book: updatedBook,
              student: transaction.student,
              autoReturned: true,
            });
          } catch (socketError) {
            console.error('Failed to emit bookReturned socket event:', socketError.message);
          }

          try {
            getIO().emit('rfidScan', {
              rfidUid,
              type: 'book',
              book: updatedBook,
              student: transaction.student,
              autoReturned: true,
              fine,
            });
          } catch (socketError) {
            console.error('Failed to emit rfidScan socket event for book:', socketError.message);
          }

          return res.status(200).json({
            message: 'Book RFID scanned and auto-returned successfully',
            rfidUid,
            type: 'book',
            action: 'returned',
            book: updatedBook,
            autoReturned: true,
            fine,
            student: transaction.student,
          });
        }
      }

      try {
        getIO().emit('rfidScan', {
          rfidUid,
          type: 'book',
          action: 'borrowing',
          book,
        });
      } catch (socketError) {
        console.error('Failed to emit rfidScan socket event for book:', socketError.message);
      }
      return res.status(200).json({ message: 'Book RFID scanned successfully', rfidUid, type: 'book', action: 'borrowing', book });
    }

    // 3. Not found in either
    try {
      getIO().emit('rfidScan', {
        rfidUid,
        type: 'unknown',
      });
    } catch (socketError) {
      console.error('Failed to emit rfidScan socket event for unknown card:', socketError.message);
    }
    return res.status(200).json({ message: 'Unknown RFID scanned', rfidUid, type: 'unknown' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to process RFID scan', error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin?.id;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: Number(id),
        ...(adminId ? {
          OR: [
            { borrowedByAdminId: adminId },
            { returnedByAdminId: adminId },
          ],
        } : {}),
      },
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or unauthorized' });
    }

    // Sync book availability if active transaction is deleted
    if (!transaction.returnDate) {
      await prisma.book.update({
        where: { id: transaction.bookId },
        data: { available: true },
      });
    }

    await prisma.transaction.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
  }
};

