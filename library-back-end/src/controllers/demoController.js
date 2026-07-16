import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

export const seedDemoData = async (_req, res) => {
  try {
    const admin = await prisma.admin.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: await bcrypt.hash('123456', 10),
      },
    });

    const students = [
      { name: 'Ayesha Rahman', studentId: 'STU001', email: 'ayesha@example.com', rfidUid: 'RFID001' },
      { name: 'Rafiq Islam', studentId: 'STU002', email: 'rafiq@example.com', rfidUid: 'RFID002' },
      { name: 'Nadia Hasan', studentId: 'STU003', email: 'nadia@example.com', rfidUid: 'RFID003' },
    ];

    for (const student of students) {
      await prisma.student.upsert({
        where: { studentId: student.studentId },
        update: {},
        create: student,
      });
    }

    const books = [
      { title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', rfidUid: 'BOOK001', available: true },
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224', rfidUid: 'BOOK002', available: true },
      { title: 'Design Patterns', author: 'Gang of Four', isbn: '9780201633610', rfidUid: 'BOOK003', available: false },
    ];

    for (const book of books) {
      await prisma.book.upsert({
        where: { rfidUid: book.rfidUid },
        update: {},
        create: book,
      });
    }

    res.json({
      message: 'Demo data created successfully',
      admin: { username: admin.username },
      students: students.length,
      books: books.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create demo data', error: error.message });
  }
};
