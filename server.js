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
const refereeRoutes = require('./routes/referee');
app.use('/referee', refereeRoutes);

app.get('/', (req, res)=>{
  res.render('index');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});