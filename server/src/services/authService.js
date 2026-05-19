const pool = require('../config/db');

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
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, created_at`,
    [email, passwordHash, name]
  );
  return result.rows[0];
};

const createGoogleUser = async ({ email, googleId, name }) => {
  const result = await pool.query(
    `INSERT INTO users (email, google_id, name, is_verified)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, email, name, created_at`,
    [email, googleId, name]
  );
  return result.rows[0];
};

const linkGoogleId = async (userId, googleId) => {
  await pool.query(
    'UPDATE users SET google_id = $1, is_verified = TRUE WHERE id = $2',
    [googleId, userId]
  );
};

const deleteUserById = async (userId) => {
  await pool.query('DELETE FROM users WHERE id = $1', [userId]);
};

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

const markOtpUsed = async (otpId) => {
  await pool.query(
    'UPDATE otp_codes SET used = TRUE WHERE id = $1',
    [otpId]
  );
};

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