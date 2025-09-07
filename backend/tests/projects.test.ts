import request from 'supertest';
import express from 'express';
import { initTestDatabase } from '../src/testDatabase';
import projectsRouter from '../src/routes/projects';
import authRouter from '../src/routes/auth';

// Mock the database module to use test database
jest.mock('../src/database', () => ({
  getDatabase: () => require('../src/testDatabase').getTestDatabase(),
  initDatabase: () => require('../src/testDatabase').initTestDatabase()
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

describe('Projects API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    // Initialize test database
    await initTestDatabase();
  });

  beforeEach(async () => {
    // Create a test user and get auth token
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: `testuser${Date.now()}`, // Make username unique
        email: `test${Date.now()}@example.com`, // Make email unique
        password: 'password123'
      });

    console.log('Registration response:', response.status, response.body);
    
    if (response.body.token && response.body.user) {
      authToken = response.body.token;
      userId = response.body.user.id;
    } else {
      throw new Error('Failed to create test user');
    }
  });

  describe('POST /api/projects', () => {
    it('should create a new project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project for unit testing',
        color: '#6366f1'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: projectData.name,
        description: projectData.description,
        color: projectData.color,
        status: 'planning'
      });
    });

    it('should require authentication', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project',
        color: '#6366f1'
      };

      await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);
    });

    it('should require project name', async () => {
      const projectData = {
        description: 'A test project without name',
        color: '#6366f1'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400);

      expect(response.body.error).toBe('Project name is required');
    });

    it('should use default color if not provided', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project without color'
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.color).toBe('#6366f1');
    });
  });

  describe('GET /api/projects', () => {
    it('should fetch user projects', async () => {
      // Create a test project first
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test description',
          color: '#10b981'
        });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        name: 'Test Project',
        description: 'Test description',
        color: '#10b981',
        total_tasks: expect.any(Number),
        completed_tasks: expect.any(Number),
        progress: expect.any(Number)
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    let projectId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test description',
          color: '#6366f1'
        });
      projectId = response.body.id;
    });

    it('should update project successfully', async () => {
      const updateData = {
        name: 'Updated Project',
        color: '#f59e0b',
        status: 'active'
      };

      await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
    });

    it('should not update non-existent project', async () => {
      const updateData = {
        name: 'Updated Project'
      };

      await request(app)
        .patch('/api/projects/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404);
    });
  });
});