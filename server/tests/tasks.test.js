const request = require('supertest');
const app = require('../app');
const { signToken } = require('../src/utils/jwt');

jest.mock('../src/services/taskService');
const taskService = require('../src/services/taskService');

const testUserId = 'test-user-id-123';
const validToken = signToken({ userId: testUserId });

describe('Task routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
      expect(res.body.error).toBe('Invalid or expired token');
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
    it("returns 403 when deleting another user's task", async () => {
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

    it('returns 404 when task does not exist', async () => {
      taskService.getTaskById.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/tasks/task-404')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Task not found');
    });
  });
});