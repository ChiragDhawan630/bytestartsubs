const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');
const env = require('./env');

const createUserIfNotExists = async (profile, done) => {
  try {
    const googleId = profile.id;
    const email = profile.emails[0].value;
    const name = profile.displayName;
    const avatar = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    let user = await db.getAsync('SELECT * FROM users WHERE email = $1', [email]);

    if (user) {
      if (!user.google_id && googleId) {
        await db.runAsync('UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3', [googleId, avatar, user.id]);
      }
      return done(null, user);
    } else {
      const result = await db.runAsync(
        'INSERT INTO users (google_id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [googleId, email, name, avatar]
      );
      const newId = result.lastID;

      // Log activity
      await db.runAsync(
        'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [newId, 'register', 'New user registered via ' + (googleId ? 'Google' : 'Dev')]
      );

      const newUser = await db.getAsync('SELECT * FROM users WHERE id = $1', [newId]);
      return done(null, newUser);
    }
  } catch (err) {
    return done(err);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    },
    function (accessToken, refreshToken, profile, done) {
      createUserIfNotExists(profile, done);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getAsync('SELECT * FROM users WHERE id = $1', [id]);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
