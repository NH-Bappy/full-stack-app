import express from 'express';
import { getTopBorrowedBooks, getActiveFines } from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/top-borrowed', protect, getTopBorrowedBooks);
router.get('/active-fines', protect, getActiveFines);

export default router;
