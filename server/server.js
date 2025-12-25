import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import chatbotRouter from './routes/chatbot.js';
import eventsRouter from './routes/events.js';
import krnlRouter from './routes/krnl.js';
import contractsRouter from './routes/contracts.js';
import { initDatabase } from './utils/database.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for image data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
try {
  initDatabase();
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}

// Routes
app.use('/api/chatbot', chatbotRouter);
app.use('/api/events', eventsRouter);
app.use('/api/krnl', krnlRouter);
app.use('/api/contracts', contractsRouter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EventVax API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chatbot API: http://localhost:${PORT}/api/chatbot`);
  console.log(`🎫 Events API: http://localhost:${PORT}/api/events`);
});
