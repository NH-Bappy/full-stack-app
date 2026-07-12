import { prisma } from '../config/db.js';

export const getBooks = async (_req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
};

export const createBook = async (req, res) => {
  const { title, author, isbn, rfidUid, available } = req.body;

  if (!title || !author || !rfidUid) {
    return res.status(400).json({ message: 'Title, author, and rfidUid are required' });
  }

  try {
    const existingBook = await prisma.book.findUnique({ where: { rfidUid } });
    if (existingBook) {
      return res.status(409).json({ message: 'RFID UID is already assigned to another book' });
    }

    const book = await prisma.book.create({
      data: { title, author, isbn, rfidUid, available: available ?? true },
    });

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
};

export const getBookById = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await prisma.book.findFirst({
      where: { id: Number(id), active: true },
      include: {
        transactions: {
          include: {
            student: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
      },
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
};

export const updateBook = async (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, rfidUid, available } = req.body;

  try {
    const book = await prisma.book.update({
      where: { id: Number(id) },
      data: { title, author, isbn, rfidUid, available },
    });

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.book.update({
      where: { id: Number(id) },
      data: { active: false },
    });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};
