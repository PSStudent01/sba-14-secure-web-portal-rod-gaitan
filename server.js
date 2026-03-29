require('dotenv').config(); // loads all variables from '.env' into process.env so the app can use them
const express = require('express'); // Imports Express to create the web server
const connectDB = require('./config/connection'); // imports our connectDB function (reused from Lab 14.1)
const passport = require('./config/passport'); // imports our configured passport instance
const userRoutes = require('./routes/users'); // imports our user routes (register + login)

const app = express(); // creates the Express application instance

// Middleware to parse JSON
app.use(express.json()); // tells Express to automatically parse incoming JSON request bodies
                         // without this, req.body would be undefined

// Initialize Passport
app.use(passport.initialize()); // sets up passport so it's ready to handle authentication strategies

// Routes
app.use('/api/users', userRoutes); // mounts our user routes — so /register becomes /api/users/register, etc.

// Connect to MongoDB then start server
connectDB().then(() => { // first connects to MongoDB using our reused connectDB function...
  app.listen(process.env.PORT, () => { // ...THEN starts the server only after the DB connection is established
    console.log(`Server running on port ${process.env.PORT} `);
  });
});