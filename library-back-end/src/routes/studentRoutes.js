import path from 'path';
import multer from 'multer';
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
  getBorrowingStudents,
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ggai_library_profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      return `profile-${uniqueSuffix}`;
    },
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PNG, JPG, and JPEG file formats are allowed for profile images'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/', protect, getStudents);
router.post('/', protect, upload.single('profileImage'), createStudent);
router.get('/borrowers', protect, getBorrowingStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, upload.single('profileImage'), updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
