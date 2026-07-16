import express from 'express';
import { seedDemoData } from '../controllers/demoController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/seed-demo', protect, seedDemoData);

export default router;
