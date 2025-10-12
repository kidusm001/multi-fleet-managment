import dotenv from 'dotenv';
import { createServer } from 'http';
import { createApp } from './app';
import { setupSocketIO } from './lib/socket';
import { initializeNotificationBroadcaster } from './lib/notificationBroadcaster';
import { scheduleMonthlyPayroll } from './jobs/index.js';

dotenv.config();

const port = process.env.PORT || 3001;
const app = createApp();
const httpServer = createServer(app);

const io = setupSocketIO(httpServer);
initializeNotificationBroadcaster(io);

async function startServer() {
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📁 Auth routes available at http://localhost:${port}/auth`);
    console.log(`🔌 Socket.IO server ready at http://localhost:${port}/socket.io`);
  });

  const bullmqEnabled = process.env.BULLMQ_ENABLED === 'true';
  if (bullmqEnabled) {
    try {
      await scheduleMonthlyPayroll();
      console.log('✅ BullMQ payroll scheduler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize BullMQ:', error);
      console.log('⚠️  Server will continue without BullMQ job scheduling');
    }
  } else {
    console.log('ℹ️  BullMQ is disabled. Set BULLMQ_ENABLED=true to enable job scheduling');
  }
}

startServer();

export default app;
export { io };
