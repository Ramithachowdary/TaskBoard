// handle request/response for auth

const bcrypt = require('bcrypt');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const authService = require('../services/authService');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

const register = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
  }

  const { email, password, name } = result.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await authService.getUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authService.createEmailUser({ email: normalizedEmail, passwordHash, name });
  const token = signToken({ userId: user.id });

  return res.status(201).json({ token, user });
};

const login = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors[0].message });
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

module.exports = { register, login, logout, me };