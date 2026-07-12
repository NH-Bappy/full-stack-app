import express from 'express';
import { issueBook, returnBook, getDashboard, getTransactions, getOverdueTransactions } from '../controllers/libraryController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/issue-book', protect, issueBook);
router.post('/return-book', protect, returnBook);
router.get('/dashboard', protect, getDashboard);
router.get('/transactions', protect, getTransactions);
router.get('/transactions/overdue', protect, getOverdueTransactions);

export default router;
