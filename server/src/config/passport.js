// Google OAuth setup 

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const authService = require('../services/authService');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        // 1. Try to find by Google ID
        let user = await authService.getUserByGoogleId(googleId);
        if (user) return done(null, user);

        // 2. Try to find by email (link accounts)
        user = await authService.getUserByEmail(email);
        if (user) {
          await authService.linkGoogleId(user.id, googleId);
          return done(null, user);
        }

        // 3. Create new Google user
        user = await authService.createGoogleUser({ email, googleId, name });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;