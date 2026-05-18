const crypto = require('crypto');

/**
 * Generates a cryptographically random 6-digit OTP.
 * crypto.randomInt is unbiased unlike Math.random.
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Hashes the OTP with SHA-256.
 * We use SHA-256 (not bcrypt) because OTPs are short-lived (10 min),
 * single-use, and protected by expiry + rate limiting.
 * bcrypt's slowness adds no meaningful security here.
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Compares a raw OTP against a stored hash using timing-safe comparison
 * to prevent timing attacks.
 */
const compareOtp = (rawOtp, storedHash) => {
  const rawHash = hashOtp(rawOtp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(rawHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    // buffers of different length = definitely not equal
    return false;
  }
};

module.exports = { generateOtp, hashOtp, compareOtp };