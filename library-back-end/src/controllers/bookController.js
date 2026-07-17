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

  // Cover image file is mandatory
  if (!req.file) {
    return res.status(400).json({ message: 'Book cover image is required (.png, .jpg, .jpeg, or .pdf)' });
  }

  try {
    const existingBook = await prisma.book.findUnique({ where: { rfidUid } });
    if (existingBook) {
      return res.status(409).json({ message: 'RFID UID is already assigned to another book' });
    }

    const coverImagePath = '/uploads/' + req.file.filename;
    
    // Parse boolean from multipart text input
    const isAvailable = available === 'true' || available === true || available === undefined;

    const book = await prisma.book.create({
      data: { 
        title, 
        author, 
        isbn, 
        rfidUid, 
        available: isAvailable,
        coverImage: coverImagePath
      },
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
  const { title, author, isbn, available } = req.body;

  try {
    const updatedData = {
      title,
      author,
      isbn,
    };

    if (available !== undefined) {
      updatedData.available = available === 'true' || available === true;
    }

    if (req.file) {
      updatedData.coverImage = '/uploads/' + req.file.filename;
    }

    const book = await prisma.book.update({
      where: { id: Number(id) },
      data: updatedData,
    });

    res.json(book);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
};

export const deleteBook = async (req, res) => {
  const { id } = req.params;

  try {
    const bookIdNum = Number(id);

    // 1. Delete associated transactions first to prevent foreign key errors
    await prisma.transaction.deleteMany({
      where: { bookId: bookIdNum },
    });

    // 2. Hard delete the book
    await prisma.book.delete({
      where: { id: bookIdNum },
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
};
