import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import routesRouter from './routes/routes';
import { loadSession } from './middleware/auth';

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
  app.use('/routes', routesRouter);

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
