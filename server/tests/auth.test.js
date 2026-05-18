const request = require('supertest');
const app = require('../app');

// Mock the services so we don't need a real DB in tests
jest.mock('../src/services/authService');
const authService = require('../src/services/authService');

describe('POST /api/auth/register', () => {
  it('returns 400 if email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('returns 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('returns 409 if email already exists', async () => {
    authService.getUserByEmail.mockResolvedValue({ id: 'existing-user' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'existing@test.com', password: 'password123', name: 'Test' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });
});

describe('POST /api/auth/login', () => {
  it('returns 401 if user does not exist', async () => {
    authService.getUserByEmail.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });
});