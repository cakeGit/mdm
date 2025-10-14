import request from 'supertest';
import express from 'express';
import { initTestDatabase } from '../src/testDatabase';
import projectsRouter from '../src/routes/projects';
import sharingRouter from '../src/routes/sharing';
import authRouter from '../src/routes/auth';
import stagesRouter from '../src/routes/stages';
import tasksRouter from '../src/routes/tasks';
import statsRouter from '../src/routes/stats';

// Mock the database module to use test database
jest.mock('../src/database', () => ({
  getDatabase: () => require('../src/testDatabase').getTestDatabase(),
  initDatabase: () => require('../src/testDatabase').initTestDatabase()
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects', sharingRouter);
app.use('/api', sharingRouter);
app.use('/api/stages', stagesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/stats', statsRouter);

describe('Task Completion Tracking', () => {
  let user1Token: string;
  let user1Id: number;
  let user2Token: string;
  let user2Id: number;
  let projectId: number;
  let stageId: number;
  let task1Id: number;
  let task2Id: number;

  beforeAll(async () => {
    await initTestDatabase();
  });

  beforeEach(async () => {
    // Create two test users
    const user1Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: `user1_${Date.now()}`,
        email: `user1_${Date.now()}@example.com`,
        password: 'password123'
      });
    
    user1Token = user1Response.body.token;
    user1Id = user1Response.body.user.id;

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: `user2_${Date.now()}`,
        email: `user2_${Date.now()}@example.com`,
        password: 'password123'
      });
    
    user2Token = user2Response.body.token;
    user2Id = user2Response.body.user.id;

    // Create a project for user1
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Test Project',
        description: 'A test project',
        color: '#6366f1'
      });
    
    projectId = projectResponse.body.id;

    // Create a stage
    const stageResponse = await request(app)
      .post('/api/stages')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        project_id: projectId,
        name: 'Test Stage'
      });

    stageId = stageResponse.body.id;

    // Create two tasks
    const task1Response = await request(app)
      .post(`/api/stages/${stageId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Task 1',
        priority: 1
      });
    task1Id = task1Response.body.id;

    const task2Response = await request(app)
      .post(`/api/stages/${stageId}/tasks`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Task 2',
        priority: 1
      });
    task2Id = task2Response.body.id;

    // Share project with user2 (readwrite)
    const user2Data = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${user2Token}`);

    await request(app)
      .post(`/api/projects/${projectId}/share`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        username: user2Data.body.username,
        permission: 'readwrite'
      });
  });

  describe('Task completion tracking', () => {
    it('should track who completed a task', async () => {
      // User1 completes task1
      await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // User2 completes task2
      await request(app)
        .patch(`/api/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // Get project details
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Find the tasks
      const tasks = response.body.stages[0].tasks;
      const completedTask1 = tasks.find((t: any) => t.id === task1Id);
      const completedTask2 = tasks.find((t: any) => t.id === task2Id);

      // Check that completed_by_username is set correctly
      expect(completedTask1.completed_by_username).toBeDefined();
      expect(completedTask2.completed_by_username).toBeDefined();
      expect(completedTask1.completed_by_username).not.toBe(completedTask2.completed_by_username);
    });

    it('should show per-user completion stats for shared projects', async () => {
      // User1 completes task1
      await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // User2 completes task2
      await request(app)
        .patch(`/api/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // Get project details
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Check that userCompletionStats is present
      expect(response.body.userCompletionStats).toBeDefined();
      expect(Array.isArray(response.body.userCompletionStats)).toBe(true);
      expect(response.body.userCompletionStats.length).toBe(2);

      // Each user should have 1 completed task
      const stats = response.body.userCompletionStats;
      expect(stats.every((s: any) => s.completed_count === 1)).toBe(true);
      expect(stats.every((s: any) => s.username)).toBe(true);
    });

    it('should not show per-user stats when only owner works on project', async () => {
      // Create a project that's not shared
      const soloProjectResponse = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Solo Project',
          description: 'Not shared',
          color: '#10b981'
        });
      
      const soloProjectId = soloProjectResponse.body.id;

      // Create stage and task
      const soloStageResponse = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          project_id: soloProjectId,
          name: 'Solo Stage'
        });

      const soloTaskResponse = await request(app)
        .post(`/api/stages/${soloStageResponse.body.id}/tasks`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Solo Task',
          priority: 1
        });

      // Complete the task
      await request(app)
        .patch(`/api/tasks/${soloTaskResponse.body.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' });

      // Get project details
      const response = await request(app)
        .get(`/api/projects/${soloProjectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // userCompletionStats should be undefined when only 1 user
      expect(response.body.userCompletionStats).toBeUndefined();
    });

    it('should track personal stats for shared project completions', async () => {
      // User1 completes task1
      await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // User2 completes task2
      await request(app)
        .patch(`/api/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // Get user1's stats
      const user1Stats = await request(app)
        .get('/api/stats/progress')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Get user2's stats
      const user2Stats = await request(app)
        .get('/api/stats/progress')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Each user should see only their own completions
      // User1 has completed 1 task in the shared project
      expect(user1Stats.body.completedTasks).toBe(1);
      
      // User2 has completed 1 task in the shared project
      expect(user2Stats.body.completedTasks).toBe(1);
    });

    it('should clear completed_by when task is unmarked as complete', async () => {
      // User1 completes task1
      await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'completed' })
        .expect(200);

      // Unmark as complete
      await request(app)
        .patch(`/api/tasks/${task1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'todo' })
        .expect(200);

      // Get project details
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const task = response.body.stages[0].tasks.find((t: any) => t.id === task1Id);
      expect(task.completed_by_username).toBeNull();
    });
  });
});
