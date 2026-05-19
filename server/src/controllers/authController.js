// handle request/response for auth

const bcrypt = require('bcrypt');
const { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema } = require('../validators/authValidator');
const authService = require('../services/authService');
const { sendOtpEmail } = require('../services/emailService');
const { signToken } = require('../utils/jwt');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { email, password, name } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await authService.getUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authService.createEmailUser({ email: normalizedEmail, passwordHash, name });

  // Generate OTP, hash it, store it, send it
  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await authService.createOtp(user.id, codeHash, expiresAt);
  await sendOtpEmail(normalizedEmail, otp);

  // Return 201 with email but NO token — token comes after OTP verification
  return res.status(201).json({
    message: 'Registration successful. Check your email for a 6-digit verification code.',
    email: normalizedEmail,
  });
};

const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

 
  if (!user.is_verified) {
    return res.status(403).json({
      error: 'Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: normalizedEmail,
    });
  }

  const token = signToken({ userId: user.id });
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
};


const logout = async (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};


const me = async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
};


const verifyOtp = async (req, res) => {
  const result = verifyOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { email, otp } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.is_verified) {
    return res.status(400).json({ error: 'Email is already verified. Please log in.' });
  }

  const otpRecord = await authService.getLatestValidOtp(user.id);
  if (!otpRecord) {
    return res.status(400).json({
      error: 'Verification code has expired or was not found. Please request a new one.',
      code: 'OTP_EXPIRED',
    });
  }

  const isValid = compareOtp(otp, otpRecord.code_hash);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
  }

  await authService.markOtpUsed(otpRecord.id);
  await authService.markUserVerified(user.id);

  const token = signToken({ userId: user.id });
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

const resendOtp = async (req, res) => {
  const result = resendOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues[0].message });
  }

  const { email } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);
  if (!user) {
    // Return 200 intentionally: don't reveal whether this email is registered
    return res.status(200).json({ message: 'If that email is registered, a new code has been sent.' });
  }

  if (user.is_verified) {
    return res.status(400).json({ error: 'Email is already verified. Please log in.' });
  }

  // Rate limit: block resend if an OTP was created within the last 60 seconds
  const recent = await authService.getRecentOtp(user.id, OTP_RESEND_COOLDOWN_SECONDS);
  if (recent) {
    return res.status(429).json({
      error: 'Please wait 60 seconds before requesting a new code.',
      code: 'RESEND_TOO_SOON',
    });
  }

  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await authService.createOtp(user.id, codeHash, expiresAt);
  await sendOtpEmail(normalizedEmail, otp);

  return res.status(200).json({ message: 'A new verification code has been sent to your email.' });
};

module.exports = { register, login, logout, me, verifyOtp, resendOtp };