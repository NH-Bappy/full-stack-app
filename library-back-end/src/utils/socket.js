import { Server } from 'socket.io';

let ioInstance = null;

export const initSocket = (server) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }

  return ioInstance;
};
