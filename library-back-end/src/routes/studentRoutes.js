import fs from 'fs';
import path from 'path';
import multer from 'multer';
import express from 'express';
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

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
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
