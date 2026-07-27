import { prisma } from '../config/db.js';

export const getTopBorrowedBooks = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const transactionsFilter = adminId
      ? {
          where: {
            OR: [
              { borrowedByAdminId: adminId },
              { returnedByAdminId: adminId },
            ],
          },
        }
      : true;

    const books = await prisma.book.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { transactions: transactionsFilter },
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

export const getActiveFines = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const whereClause = {
      fine: {
        gt: 0,
      },
      ...(adminId
        ? {
            OR: [
              { borrowedByAdminId: adminId },
              { returnedByAdminId: adminId },
            ],
          }
        : {}),
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
    res.status(500).json({ message: 'Failed to fetch active fines report', error: error.message });
  }
};
