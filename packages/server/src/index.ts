import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config();

const port = process.env.PORT || 3001;
const app = createApp();

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📁 Auth routes available at http://localhost:${port}/auth`);
});

export default app;
