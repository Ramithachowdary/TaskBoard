const bcrypt = require('bcrypt');
const authService = require('../services/authService');
const { sendOtpEmail } = require('../services/emailService');
const { signToken } = require('../utils/jwt');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} = require('../validators/authValidator');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// ─── Register ─────────────────────────────────────────────────────────────
/**
 * CHANGED from original:
 * - No longer returns a JWT on success
 * - Creates user as unverified
 * - Generates + sends OTP
 * - If email sending fails, deletes the user (rollback/cleanup)
 * - Returns 201 with message + email only
 */
const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email, password, name } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing account
  const existing = await authService.getUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user as unverified — they will be verified after OTP
  const user = await authService.createEmailUser({
    email: normalizedEmail,
    passwordHash,
    name,
  });

  // Generate OTP
  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP in DB
  await authService.createOtp(user.id, codeHash, expiresAt);

  // Attempt to send email — if it fails, clean up the user to avoid orphaned records
  try {
    await sendOtpEmail(normalizedEmail, otp);
  } catch (emailError) {
    // Rollback: delete the user so they can try registering again
    // This prevents a state where the user exists but can never receive their OTP
    await authService.deleteUserById(user.id);
    console.error('Registration rollback triggered due to email failure:', emailError.message);
    return res.status(503).json({
      error: 'Could not send verification email. Please try again.',
    });
  }

  // Return 201 with NO token — token is issued only after OTP verification
  return res.status(201).json({
    message: 'Registration successful. Check your email for a 6-digit verification code.',
    email: normalizedEmail,
  });
};

// ─── Login ────────────────────────────────────────────────────────────────
/**
 * CHANGED from original:
 * - Blocks login if user's email is not verified
 * - Returns 403 with machine-readable code: EMAIL_NOT_VERIFIED
 * - Frontend uses this code to redirect to /verify-otp
 */
const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email, password } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);
  if (!user) {
    // Same message for "user not found" and "wrong password"
    // Prevents user enumeration attacks
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Block login for unverified users with a specific machine-readable code
  if (!user.is_verified) {
    return res.status(403).json({
      error: 'Please verify your email before logging in.',
      code: 'EMAIL_NOT_VERIFIED',
      email: normalizedEmail, // returned so frontend can pre-fill the verify page
    });
  }

  const token = signToken({ userId: user.id });
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

// ─── Logout ───────────────────────────────────────────────────────────────
// UNCHANGED — stateless JWT, client removes token
const logout = async (req, res) => {
  return res.status(200).json({ message: 'Logged out successfully' });
};

// ─── Me ───────────────────────────────────────────────────────────────────
// UNCHANGED
const me = async (req, res) => {
  const user = await authService.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.status(200).json(user);
};

// ─── Verify OTP ───────────────────────────────────────────────────────────
/**
 * NEW endpoint.
 * Validates submitted OTP against stored hash.
 * On success: marks OTP as used, marks user as verified, returns JWT.
 */
const verifyOtp = async (req, res) => {
  const result = verifyOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email, otp } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // If already verified, no need to go through OTP flow
  if (user.is_verified) {
    return res.status(400).json({
      error: 'Email is already verified. Please log in.',
    });
  }

  // Get the most recent valid (unused + non-expired) OTP for this user
  const otpRecord = await authService.getLatestValidOtp(user.id);
  if (!otpRecord) {
    return res.status(400).json({
      error: 'Verification code has expired or was not found. Please request a new one.',
      code: 'OTP_EXPIRED',
    });
  }

  // Timing-safe comparison of submitted OTP against stored hash
  const isValid = compareOtp(otp, otpRecord.code_hash);
  if (!isValid) {
    return res.status(400).json({
      error: 'Invalid verification code. Please try again.',
    });
  }

  // Mark OTP as used — prevents replay attacks
  await authService.markOtpUsed(otpRecord.id);

  // Mark user as verified
  await authService.markUserVerified(user.id);

  // Issue JWT — same as a successful login
  const token = signToken({ userId: user.id });
  return res.status(200).json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
};

// ─── Resend OTP ───────────────────────────────────────────────────────────
/**
 * NEW endpoint.
 * Generates and sends a fresh OTP.
 * Rate-limited: one resend per 60 seconds per user.
 * Returns generic message for unknown emails (prevents email enumeration).
 */
const resendOtp = async (req, res) => {
  const result = resendOtpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await authService.getUserByEmail(normalizedEmail);

  // Return 200 for unknown emails — don't reveal whether email is registered
  if (!user) {
    return res.status(200).json({
      message: 'If that email is registered, a new code has been sent.',
    });
  }

  if (user.is_verified) {
    return res.status(400).json({
      error: 'Email is already verified. Please log in.',
    });
  }

  // Rate limit: block resend if an OTP was created within the last 60 seconds
  const recent = await authService.getRecentOtp(user.id, OTP_RESEND_COOLDOWN_SECONDS);
  if (recent) {
    return res.status(429).json({
      error: 'Please wait 60 seconds before requesting a new code.',
      code: 'RESEND_TOO_SOON',
    });
  }

  // Generate and store new OTP (old ones are invalidated inside createOtp)
  const otp = generateOtp();
  const codeHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await authService.createOtp(user.id, codeHash, expiresAt);

  try {
    await sendOtpEmail(normalizedEmail, otp);
  } catch (emailError) {
    console.error('Resend email failed:', emailError.message);
    return res.status(503).json({
      error: 'Could not send verification email. Please try again.',
    });
  }

  return res.status(200).json({
    message: 'A new verification code has been sent to your email.',
  });
};

module.exports = { register, login, logout, me, verifyOtp, resendOtp };