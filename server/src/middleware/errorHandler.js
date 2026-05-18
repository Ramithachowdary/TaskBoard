const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Email already registered' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;