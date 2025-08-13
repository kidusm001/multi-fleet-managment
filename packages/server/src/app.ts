import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { loadSession } from './middleware/auth';
import apiRouter from './routes';

dotenv.config();

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Session loader
  app.use(loadSession);

  // Routes
  app.use('/auth', authRoutes);
  // ...existing code...
  app.use('/api', apiRouter);

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
