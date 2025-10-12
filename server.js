
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { connectDB } = require("./database/db");

const session = require("express-session");
const MongoStore = require("connect-mongo"); // <-- import MongoStore

connectDB();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware with MongoDB
app.use(session({
  secret: process.env.session_secret_key,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI, // from .env
    collectionName: "sessions",       // collection name in DB
    ttl: 5 * 24 * 60 * 60             // 5 days (in seconds)
  }),
  cookie: {
    secure: false, // set true if using HTTPS
    maxAge: 5 * 24 * 60 * 60 * 1000   // 5 days (in ms)
  }
}));

// Middleware
app.use(cors());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// const refereeRoutes = require('./routes/referee');
// app.use('/referee', refereeRoutes);

const matchesRoutes = require('./routes/matches');
app.use('/api/matches', matchesRoutes);

const teamRoutes = require('./routes/team');
app.use('/api/team', teamRoutes);
app.use('/team', teamRoutes);

app.get('/', (req, res)=>{
  res.render('homepage');
});

app.get('/matches', (req, res)=>{
  res.render('matches');
});

app.get('/match/:matchId', (req, res)=>{
  res.render('match-detail', { matchId: req.params.matchId });
});

// Team page - require authentication
app.get('/team', (req, res) => {
  if (req.session && req.session.user && req.session.user.type === 'player') {
    res.render('team');
  } else {
    res.redirect('/?auth=required');
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});