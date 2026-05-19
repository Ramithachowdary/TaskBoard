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
 *
 * Why SHA-256 and not bcrypt?
 * - OTPs are short-lived (10 min) and single-use
 * - They're already protected by expiry + rate limiting + one-use
 * - bcrypt's slowness provides no meaningful extra security here
 * - SHA-256 + timingSafeEqual is the correct pattern for OTPs
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Timing-safe comparison of raw OTP against stored hash.
 * Prevents timing attacks where an attacker could guess characters
 * by measuring how long the comparison takes.
 */
const compareOtp = (rawOtp, storedHash) => {
  const rawHash = hashOtp(rawOtp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(rawHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
};

module.exports = { generateOtp, hashOtp, compareOtp };