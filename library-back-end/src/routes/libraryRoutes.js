import express from 'express';
import { borrowBook, returnBook, getDashboard, getTransactions, getOverdueTransactions, scanRfid } from '../controllers/libraryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/borrow-book', protect, borrowBook);
router.post('/return-book', protect, returnBook);
router.post('/rfid/scan', scanRfid);
router.get('/dashboard', protect, getDashboard);
router.get('/transactions', protect, getTransactions);
router.get('/transactions/overdue', protect, getOverdueTransactions);

export default router;
