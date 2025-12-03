import request from 'supertest';
import express from 'express';
import { initTestDatabase } from '../src/testDatabase';
import authRouter from '../src/routes/auth';
import personalNotesRouter from '../src/routes/personal-notes';

// Mock the database module to use test database
jest.mock('../src/database', () => ({
  getDatabase: () => require('../src/testDatabase').getTestDatabase(),
  initDatabase: () => require('../src/testDatabase').initTestDatabase()
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/personal-note', personalNotesRouter);

describe('Personal Notes API', () => {
  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    await initTestDatabase();
    
    // Register a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });



  describe('GET /api/personal-note', () => {
    it('should return empty content when no note exists', async () => {
      const res = await request(app)
        .get('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('');
      expect(res.body.updated_at).toBeNull();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/personal-note');
      
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/personal-note', () => {
    it('should create a new personal note', async () => {
      const content = 'My first thought';
      const res = await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content });
      
      expect(res.status).toBe(200);
      expect(res.body.content).toBe(content);
      expect(res.body.updated_at).toBeDefined();
    });

    it('should update an existing personal note', async () => {
      const updatedContent = 'Updated thought';
      const res = await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: updatedContent });
      
      expect(res.status).toBe(200);
      expect(res.body.content).toBe(updatedContent);
    });

    it('should retrieve the saved note', async () => {
      const res = await request(app)
        .get('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated thought');
      expect(res.body.updated_at).toBeDefined();
    });

    it('should require content to be a string', async () => {
      const res = await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 123 });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be a string');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put('/api/personal-note')
        .send({ content: 'test' });
      
      expect(res.status).toBe(401);
    });

    it('should handle empty content', async () => {
      const res = await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });
      
      expect(res.status).toBe(200);
      expect(res.body.content).toBe('');
    });
  });

  describe('User isolation', () => {
    let user2Token: string;

    beforeAll(async () => {
      // Register a second user
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'password123'
        });
      
      user2Token = registerRes.body.token;
    });

    it('should keep notes separate for different users', async () => {
      // Set note for user 1
      await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'User 1 note' });

      // Set note for user 2
      await request(app)
        .put('/api/personal-note')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'User 2 note' });

      // Check user 1's note
      const res1 = await request(app)
        .get('/api/personal-note')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res1.body.content).toBe('User 1 note');

      // Check user 2's note
      const res2 = await request(app)
        .get('/api/personal-note')
        .set('Authorization', `Bearer ${user2Token}`);
      
      expect(res2.body.content).toBe('User 2 note');
    });
  });
});
