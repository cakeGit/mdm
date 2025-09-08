import express from 'express';
import cors from 'cors';
import path from 'path';
import { initDatabase } from './database';
import authRouter from './routes/auth';
import projectsRouter from './routes/projects';
import stagesRouter from './routes/stages';
import tasksRouter from './routes/tasks';
import sessionsRouter from './routes/sessions';
import statsRouter from './routes/stats';
import taskNotesRouter from './routes/task-notes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/stages', stagesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/task-notes', taskNotesRouter);

// Serve static files in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Serve React app for all other routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });