const express = require('express');
const passport = require('passport');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const {
  register,
  login,
  logout,
  me,
  verifyOtp,    
  resendOtp,    
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, me);

router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: false,
  }),
  (req, res) => {
    const { signToken } = require('../utils/jwt');
    const token = signToken({ userId: req.user.id });
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

module.exports = router;