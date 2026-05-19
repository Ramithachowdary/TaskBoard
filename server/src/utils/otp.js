const crypto = require('crypto');

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const compareOtp = (rawOtp, storedHash) => {
  const rawHash = hashOtp(rawOtp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(rawHash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
};

module.exports = { generateOtp, hashOtp, compareOtp };