import express from 'express';
import { issueBook, returnBook, getDashboard, getTransactions, getOverdueTransactions, scanRfid } from '../controllers/libraryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/issue-book', protect, issueBook);
router.post('/return-book', protect, returnBook);
router.post('/rfid/scan', scanRfid);
router.get('/dashboard', protect, getDashboard);
router.get('/transactions', protect, getTransactions);
router.get('/transactions/overdue', protect, getOverdueTransactions);

export default router;
