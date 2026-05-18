const request = require('supertest');
const app = require('../app');
const { signToken } = require('../src/utils/jwt');

jest.mock('../src/services/taskService');
const taskService = require('../src/services/taskService');

const testUserId = 'test-user-id-123';
const validToken = signToken({ userId: testUserId });

describe('GET /api/tasks', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No token provided');
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('returns 200 with valid token', async () => {
    taskService.getTasksByUserId.mockResolvedValue([]);
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('returns 403 when deleting another users task', async () => {
    taskService.getTaskById.mockResolvedValue({
      id: 'task-123',
      user_id: 'different-user-id',
    });
    const res = await request(app)
      .delete('/api/tasks/task-123')
      .set('Authorization', `Bearer ${validToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });
});