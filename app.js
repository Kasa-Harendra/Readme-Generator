const dotenv = require('dotenv');
dotenv.config(); 

const express = require('express');
const session = require('express-session');
const path = require('path');
const passport = require('passport');

const authRoutes = require('./routes/auth');
const githubRoutes = require('./routes/github');
const aiRoutes = require('./routes/ai');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  if (req.session.access_token) {
    return res.redirect('/home');
  }
  res.render('landing');
});

app.use('/auth', authRoutes);
app.use('/', githubRoutes);
app.use('/ai', aiRoutes);

app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

module.exports = app;
