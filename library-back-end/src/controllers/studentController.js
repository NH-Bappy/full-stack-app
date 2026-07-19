import { prisma } from '../config/db.js';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = (url) => {
  if (!url || !url.includes('cloudinary.com')) return;

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return;
    
    const pathParts = parts[1].split('/');
    if (pathParts[0].startsWith('v')) {
      pathParts.shift();
    }
    
    const fullPath = pathParts.join('/');
    const lastDotIndex = fullPath.lastIndexOf('.');
    const publicId = lastDotIndex === -1 ? fullPath : fullPath.substring(0, lastDotIndex);

    cloudinary.uploader.destroy(publicId)
      .then(result => console.log('Cloudinary image deleted:', publicId, result))
      .catch(err => console.error('Failed to delete Cloudinary image:', publicId, err));
  } catch (error) {
    console.error('Error parsing Cloudinary URL for deletion:', error);
  }
};

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

    const profileImagePath = req.file ? req.file.path : '';

    const student = await prisma.student.create({
      data: { name, studentId, email, rfidUid, profileImage: profileImagePath },
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

    // Fetch existing student details to check for old image
    const existingStudent = await prisma.student.findUnique({
      where: { id: Number(id) }
    });

    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (req.file) {
      updatedData.profileImage = req.file.path;
      
      // Delete old profile image from Cloudinary in the background
      if (existingStudent.profileImage) {
        deleteFromCloudinary(existingStudent.profileImage);
      }
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

    // Find student first to retrieve profileImage
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

    // 3. Delete profile image from Cloudinary in the background
    if (student.profileImage) {
      deleteFromCloudinary(student.profileImage);
    }

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
