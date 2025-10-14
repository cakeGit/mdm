import request from 'supertest';
import express from 'express';
import { initTestDatabase } from '../src/testDatabase';
import projectsRouter from '../src/routes/projects';
import sharingRouter from '../src/routes/sharing';
import authRouter from '../src/routes/auth';
import stagesRouter from '../src/routes/stages';
import tasksRouter from '../src/routes/tasks';

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

describe('Project Sharing API', () => {
  let user1Token: string;
  let user1Id: number;
  let user2Token: string;
  let user2Id: number;
  let projectId: number;

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
  });

  describe('POST /api/projects/:id/share', () => {
    it('should share project with read permission', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: `user2_${user2Id}`,
          permission: 'read'
        });

      // Should fail because username doesn't exist yet
      // Let's use the actual username from user2
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);
      
      const shareResponse = await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'read'
        })
        .expect(201);

      expect(shareResponse.body).toMatchObject({
        project_id: projectId,
        shared_with_user_id: user2Id,
        permission: 'read'
      });
    });

    it('should share project with readwrite permission', async () => {
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      const response = await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'readwrite'
        })
        .expect(201);

      expect(response.body.permission).toBe('readwrite');
    });

    it('should not allow non-owners to share', async () => {
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'read'
        })
        .expect(404); // Project not found for user2
    });
  });

  describe('GET /api/projects/:id/shares', () => {
    beforeEach(async () => {
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'read'
        });
    });

    it('should list project shares', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/shares`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('shared_with_username');
    });
  });

  describe('Shared project access', () => {
    beforeEach(async () => {
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'read'
        });
    });

    it('should allow read access to shared project', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
    });

    it('should include shared projects in project list', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const sharedProject = response.body.find((p: any) => p.id === projectId);
      expect(sharedProject).toBeDefined();
      expect(sharedProject.permission).toBe('read');
      expect(sharedProject.is_shared).toBe(1);
    });

    it('should deny write access with read permission', async () => {
      await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Updated Name' })
        .expect(403);
    });
  });

  describe('Readwrite permission', () => {
    beforeEach(async () => {
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

    it('should allow write access with readwrite permission', async () => {
      await request(app)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'Updated Name' })
        .expect(200);
    });

    it('should allow creating stages with readwrite permission', async () => {
      const response = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          project_id: projectId,
          name: 'New Stage',
          description: 'Test stage'
        })
        .expect(201);

      expect(response.body.name).toBe('New Stage');
    });

    it('should allow creating tasks with readwrite permission', async () => {
      // First create a stage
      const stageResponse = await request(app)
        .post('/api/stages')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          project_id: projectId,
          name: 'Test Stage'
        });

      const stageId = stageResponse.body.id;

      // Then create a task
      const taskResponse = await request(app)
        .post(`/api/stages/${stageId}/tasks`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Test Task',
          priority: 2
        })
        .expect(201);

      expect(taskResponse.body.title).toBe('Test Task');
    });
  });

  describe('Anonymous share tokens', () => {
    let shareToken: string;

    it('should generate anonymous share token', async () => {
      const response = await request(app)
        .post(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.project_id).toBe(projectId);
      shareToken = response.body.token;
    });

    it('should access project via anonymous token without auth', async () => {
      // First generate token
      const tokenResponse = await request(app)
        .post(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`);

      shareToken = tokenResponse.body.token;

      // Access project without authentication
      const response = await request(app)
        .get(`/api/shared/${shareToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.permission).toBe('read');
      expect(response.body.shared).toBe(true);
    });

    it('should return same token on subsequent requests', async () => {
      const response1 = await request(app)
        .post(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`);

      const response2 = await request(app)
        .post(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response1.body.token).toBe(response2.body.token);
    });

    it('should revoke anonymous share token', async () => {
      // Generate token
      const tokenResponse = await request(app)
        .post(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`);

      shareToken = tokenResponse.body.token;

      // Revoke token
      await request(app)
        .delete(`/api/projects/${projectId}/share-token`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Try to access with revoked token
      await request(app)
        .get(`/api/shared/${shareToken}`)
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id/shares/:shareId', () => {
    let shareId: number;

    beforeEach(async () => {
      const user2Data = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`);

      const shareResponse = await request(app)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          username: user2Data.body.username,
          permission: 'read'
        });

      shareId = shareResponse.body.id;
    });

    it('should remove project share', async () => {
      await request(app)
        .delete(`/api/projects/${projectId}/shares/${shareId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      // Verify user2 no longer has access
      await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);
    });
  });
});
