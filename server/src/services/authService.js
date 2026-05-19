const pool = require('../config/db');

// ─── User queries (existing — unchanged) ──────────────────────────────────

const getUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

const getUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const getUserByGoogleId = async (googleId) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE google_id = $1',
    [googleId]
  );
  return result.rows[0] || null;
};

const createEmailUser = async ({ email, passwordHash, name }) => {
  // Creates user with is_verified = FALSE (default)
  // Verification happens after OTP confirmation
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email, passwordHash, name]
  );
  return result.rows[0];
};

// MODIFIED: Google users are auto-verified — they own their email
const createGoogleUser = async ({ email, googleId, name }) => {
  const result = await pool.query(
    `INSERT INTO users (email, google_id, name, is_verified)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, email, name, created_at`,
    [email, googleId, name]
  );
  return result.rows[0];
};

// MODIFIED: also sets is_verified = TRUE when linking Google to existing email account
const linkGoogleId = async (userId, googleId) => {
  await pool.query(
    'UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2',
    [googleId, userId]
  );
};

// ADDED: used as rollback if email sending fails during registration
const deleteUserById = async (userId) => {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};

// ─── OTP queries (new) ────────────────────────────────────────────────────

/**
 * Invalidates all existing unused OTPs for a user, then creates a new one.
 * Ensures only one active OTP exists per user at any time.
 */
const createOtp = async (userId, codeHash, expiresAt) => {
  await pool.query(
    'UPDATE otp_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE',
    [userId]
  );
  const result = await pool.query(
    `INSERT INTO otp_codes (user_id, code_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, codeHash, expiresAt]
  );
  return result.rows[0];
};

/**
 * Gets the most recent unused, non-expired OTP for a user.
 */
const getLatestValidOtp = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM otp_codes
     WHERE user_id = $1
       AND used = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Checks if any OTP was created within the last N seconds.
 * Used for resend rate limiting.
 *
 * Uses parameterized interval to avoid SQL injection.
 */
const getRecentOtp = async (userId, withinSeconds) => {
  const result = await pool.query(
    `SELECT * FROM otp_codes
     WHERE user_id = $1
       AND created_at > NOW() - ($2 || ' seconds')::INTERVAL
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, withinSeconds]
  );
  return result.rows[0] || null;
};

/**
 * Marks an OTP as used after successful verification.
 * Prevents reuse of the same code.
 */
const markOtpUsed = async (otpId) => {
  await pool.query(
    'UPDATE otp_codes SET used = TRUE WHERE id = $1',
    [otpId]
  );
};

/**
 * Marks the user's email as verified.
 * Called immediately after successful OTP verification.
 */
const markUserVerified = async (userId) => {
  await pool.query(
    'UPDATE users SET is_verified = TRUE WHERE id = $1',
    [userId]
  );
};

module.exports = {
  // User functions
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  createEmailUser,
  createGoogleUser,
  linkGoogleId,
  deleteUserById,
  // OTP functions
  createOtp,
  getLatestValidOtp,
  getRecentOtp,
  markOtpUsed,
  markUserVerified,
};