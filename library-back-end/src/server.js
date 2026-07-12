import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './utils/socket.js';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import demoRoutes from './routes/demoRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

config();

const app = express();
const server = createServer(app);
initSocket(server);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api', libraryRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/reports', reportsRoutes);

export { initSocket };

const PORT = 3000;

const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });
};

startServer();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection', error);
  process.exit(1);
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception', error);
  await disconnectDB();
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});
