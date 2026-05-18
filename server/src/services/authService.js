// auth business logic

const pool = require('../config/db');

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
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
  const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  return result.rows[0] || null;
};

const createEmailUser = async ({ email, passwordHash, name }) => {
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, passwordHash, name]
  );
  return result.rows[0];
};

const createGoogleUser = async ({ email, googleId, name }) => {
  const result = await pool.query(
    'INSERT INTO users (email, google_id, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
    [email, googleId, name]
  );
  return result.rows[0];
};

const linkGoogleId = async (userId, googleId) => {
  await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, userId]);
};

module.exports = {
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  createEmailUser,
  createGoogleUser,
  linkGoogleId,
};