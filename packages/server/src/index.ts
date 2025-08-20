import dotenv from 'dotenv';
import { createServer } from 'http';
import { createApp } from './app';
import { setupSocketIO } from './lib/socket';

dotenv.config();

const port = process.env.PORT || 3001;
const app = createApp();
const httpServer = createServer(app);

// Setup Socket.IO
const io = setupSocketIO(httpServer);

httpServer.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📁 Auth routes available at http://localhost:${port}/auth`);
  console.log(`🔌 Socket.IO server ready at http://localhost:${port}/socket.io`);
});

export default app;
export { io };
