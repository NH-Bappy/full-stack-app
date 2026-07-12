import express from 'express';
import {
  getStudents,
  createStudent,
  getStudentById,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getStudents);
router.post('/', protect, createStudent);
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

export default router;
