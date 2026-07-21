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

router.get('/', protect, getStudents);
router.post('/', protect, createStudent);
router.get('/borrowers', protect, getBorrowingStudents);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
