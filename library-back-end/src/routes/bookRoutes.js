import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  getBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
} from '../controllers/bookController.js';
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
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, PNG, JPG, and JPEG file formats are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.get('/', protect, getBooks);

// coverImage file field is mandatory on create, optional on update
router.post('/', protect, upload.single('coverImage'), createBook);
router.get('/:id', protect, getBookById);
router.put('/:id', protect, upload.single('coverImage'), updateBook);
router.delete('/:id', protect, deleteBook);

export default router;
