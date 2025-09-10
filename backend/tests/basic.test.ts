import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Simple health check endpoint for testing
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

describe('Basic API Test', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });
});