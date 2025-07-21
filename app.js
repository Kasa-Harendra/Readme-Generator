// app.js

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

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'supersecretkey',
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Landing Page
app.get('/', (req, res) => {
  if (req.session.access_token) {
    return res.redirect('/home');
  }
  res.render('landing');
});

// Routes
app.use('/auth', authRoutes);
app.use('/', githubRoutes);
app.use('/ai', aiRoutes);

// Fallback Route
app.use((req, res) => {
  res.status(404).send('404: Page Not Found');
});

// Server start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
