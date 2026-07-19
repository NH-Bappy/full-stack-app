import { prisma } from '../config/db.js';

export const getTopBorrowedBooks = async (_req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: {
        transactions: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch top borrowed books report', error: error.message });
  }
};

export const getActiveFines = async (_req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        fine: {
          gt: 0,
        },
      },
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
    res.status(500).json({ message: 'Failed to fetch active fines report', error: error.message });
  }
};
