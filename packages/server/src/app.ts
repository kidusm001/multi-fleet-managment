import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use('/auth', authRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'multi-fleet-management-server'
    });
  });

  return app;
}

const app = createApp();
export default app;
