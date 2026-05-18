const pool = require('../config/db');

const getTasksByUserId = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

const getTaskById = async (taskId) => {
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
  return result.rows[0] || null;
};

const createTask = async ({ userId, title, description, priority, due_date }) => {
  const result = await pool.query(
    `INSERT INTO tasks (user_id, title, description, priority, due_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, title, description || null, priority || 'medium', due_date || null]
  );
  return result.rows[0];
};

const updateTask = async (taskId, fields) => {
  // Dynamically build SET clause from provided fields
  const allowed = ['title', 'description', 'completed', 'priority', 'due_date'];
  const updates = [];
  const values = [];
  let i = 1;

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = $${i}`);
      values.push(fields[key]);
      i++;
    }
  }

  if (updates.length === 0) return null;

  values.push(taskId);
  const result = await pool.query(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return result.rows[0];
};

const deleteTask = async (taskId) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
};

module.exports = { getTasksByUserId, getTaskById, createTask, updateTask, deleteTask };