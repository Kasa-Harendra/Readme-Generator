// routes/auth.js

const express = require("express");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;

const router = express.Router();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      profile.token = accessToken;
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

router.get("/github", passport.authenticate("github", { scope: ["user", "repo"] }));

router.get("/github/callback",
  passport.authenticate('github', { 
    failureRedirect : "/"
  }),
  (req, res) => {
    req.session.access_token = req.user.accessToken;
    res.redirect("/home");
  }
);

module.exports = router;
