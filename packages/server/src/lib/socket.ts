import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

export function setupSocketIO(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        const allowed = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
        if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
        return cb(new Error('CORS not allowed'), false);
      },
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Handle role subscription for notifications
    socket.on('notification:subscribe-role', (role: string) => {
      console.log(`[Socket] Client ${socket.id} subscribing to role: ${role}`);
      socket.join(`role:${role}`);
    });

    socket.on('notification:unsubscribe-role', (role: string) => {
      console.log(`[Socket] Client ${socket.id} unsubscribing from role: ${role}`);
      socket.leave(`role:${role}`);
    });

    // Handle notification marking
    socket.on('notification:mark-seen', (notificationId: string) => {
      console.log(`[Socket] Marking notification ${notificationId} as seen`);
      // Broadcast to other clients that this notification was seen
      socket.broadcast.emit('notification:seen', {
        notificationId,
        userId: 'current-user', // TODO: Get from session
        userName: 'Current User' // TODO: Get from session
      });
    });

    socket.on('notification:mark-read', (notificationId: string) => {
      console.log(`[Socket] Marking notification ${notificationId} as read`);
      // Handle marking as read
    });

    socket.on('notification:mark-all-read', () => {
      console.log(`[Socket] Marking all notifications as read for client ${socket.id}`);
      // Handle marking all as read
    });

    // Handle client ready signal
    socket.on('client:ready', () => {
      console.log(`[Socket] Client ${socket.id} is ready for notifications`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
}

export default setupSocketIO;