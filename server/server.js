import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import tokenRoutes from './routes/tokens.js';
import userRoutes from './routes/users.js';
import responseRoutes from './routes/responses.js';
import reportRoutes from './routes/reports.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase JSON payload size limit to 10mb to handle large PDF uploads
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/tokens', tokenRoutes);
app.use('/api/users', userRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
