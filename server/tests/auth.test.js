const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');
const { hashOtp } = require('../src/utils/otp');

jest.mock('../src/services/authService');
jest.mock('../src/services/emailService', () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

const authService = require('../src/services/authService');
const { sendOtpEmail } = require('../src/services/emailService');

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    it('returns 201 with message and email on successful registration', async () => {
      authService.getUserByEmail.mockResolvedValue(null);
      authService.createEmailUser.mockResolvedValue({
        id: 'user-123',
        email: 'new@test.com',
        name: 'Test User',
      });
      authService.createOtp.mockResolvedValue({
        id: 'otp-123',
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'new@test.com', password: 'password123', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/registration successful/i);
      expect(res.body.email).toBe('new@test.com');
      expect(sendOtpEmail).toHaveBeenCalledTimes(1);
      expect(authService.createOtp).toHaveBeenCalledTimes(1);
    });

    it('returns 503 and rolls back user if email sending fails', async () => {
      authService.getUserByEmail.mockResolvedValue(null);
      authService.createEmailUser.mockResolvedValue({
        id: 'user-123',
        email: 'fail@test.com',
        name: 'Fail User',
      });
      authService.createOtp.mockResolvedValue({ id: 'otp-123' });
      authService.deleteUserById.mockResolvedValue(undefined);
      sendOtpEmail.mockRejectedValueOnce(new Error('SMTP failed'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'fail@test.com', password: 'password123', name: 'Fail User' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Could not send verification email. Please try again.');
      expect(authService.deleteUserById).toHaveBeenCalledWith('user-123');
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

    it('returns 401 if password is wrong', async () => {
      const passwordHash = await bcrypt.hash('correctpassword', 4);

      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        password_hash: passwordHash,
        is_verified: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 403 if email is not verified', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);

      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        password_hash: passwordHash,
        is_verified: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Please verify your email before logging in.');
      expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(res.body.email).toBe('user@test.com');
    });

    it('returns 200 with token for verified user', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);

      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        password_hash: passwordHash,
        is_verified: true,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
      });
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    it('returns 400 if OTP format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '12ab' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/code/i);
    });

    it('returns 404 if user does not exist', async () => {
      authService.getUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'missing@test.com', otp: '123456' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('returns 400 if email is already verified', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        is_verified: true,
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email is already verified. Please log in.');
    });

    it('returns 400 with OTP_EXPIRED if no valid OTP exists', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        is_verified: false,
      });
      authService.getLatestValidOtp.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/expired|not found/i);
      expect(res.body.code).toBe('OTP_EXPIRED');
    });

    it('returns 400 if OTP is invalid', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        is_verified: false,
      });
      authService.getLatestValidOtp.mockResolvedValue({
        id: 'otp-123',
        code_hash: hashOtp('654321'),
      });

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid verification code. Please try again.');
    });

    it('returns 200 with token when OTP is valid', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
        is_verified: false,
      });
      authService.getLatestValidOtp.mockResolvedValue({
        id: 'otp-123',
        code_hash: hashOtp('123456'),
      });
      authService.markOtpUsed.mockResolvedValue(undefined);
      authService.markUserVerified.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'user@test.com', otp: '123456' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toEqual({
        id: 'user-123',
        email: 'user@test.com',
        name: 'Test User',
      });
      expect(authService.markOtpUsed).toHaveBeenCalledWith('otp-123');
      expect(authService.markUserVerified).toHaveBeenCalledWith('user-123');
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    it('returns 200 generic message for unknown email', async () => {
      authService.getUserByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'unknown@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('If that email is registered, a new code has been sent.');
    });

    it('returns 400 if email is already verified', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        is_verified: true,
      });

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email is already verified. Please log in.');
    });

    it('returns 429 if resend is requested too soon', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        is_verified: false,
      });
      authService.getRecentOtp.mockResolvedValue({
        id: 'recent-otp',
      });

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe('Please wait 60 seconds before requesting a new code.');
      expect(res.body.code).toBe('RESEND_TOO_SOON');
    });

    it('returns 200 when resend succeeds', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        is_verified: false,
      });
      authService.getRecentOtp.mockResolvedValue(null);
      authService.createOtp.mockResolvedValue({
        id: 'otp-123',
      });

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('A new verification code has been sent to your email.');
      expect(authService.createOtp).toHaveBeenCalledTimes(1);
      expect(sendOtpEmail).toHaveBeenCalledTimes(1);
    });

    it('returns 503 if resend email sending fails', async () => {
      authService.getUserByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'user@test.com',
        is_verified: false,
      });
      authService.getRecentOtp.mockResolvedValue(null);
      authService.createOtp.mockResolvedValue({
        id: 'otp-123',
      });
      sendOtpEmail.mockRejectedValueOnce(new Error('SMTP failed'));

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'user@test.com' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Could not send verification email. Please try again.');
    });
  });
});