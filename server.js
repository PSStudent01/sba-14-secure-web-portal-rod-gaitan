require('dotenv').config(); // loads all variables from '.env' into process.env so the app can use them
const express = require('express'); // Imports Express to create the web server
const connectDB = require('./config/connection'); // imports our connectDB function (reused from Lab 14.1)
const passport = require('./config/passport'); // imports our configured passport instance
const userRoutes = require('./routes/users'); // imports our user routes (register + login)
const bookmarkRoutes = require('./routes/bookmarks'); //imports the newly created 'bookmarks.js' router file into 'server.js'. 
                                                    // note, without this line, the server wouldn't know the 'bookmark' routes file even exists.
const app = express(); // creates the Express application instance

// Middleware to parse JSON
app.use(express.json()); // tells Express to automatically parse incoming JSON request bodies
                         // without this, req.body would be undefined

// Initialize Passport
app.use(passport.initialize()); // sets up passport so it's ready to handle authentication strategies

// Routes
app.use('/api/users', userRoutes); // mounts the 'user' routes — so for ex, /register becomes /api/users/register, etc.
                                   // VIP Note:
                                   // '/api/users' = the router mount point (defined in server.js)
                                   // '/register' = the endpoint/route (defined inside the router file)
                                   // '/api/users/register' = the full path (what the client actually hits)
app.use('/api/bookmarks', bookmarkRoutes); // mounts the 'bookmark' router onto the 'Express' app at the path '/api/bookmarks.'

// Connect to MongoDB then start server
connectDB().then(() => { // first connects to MongoDB using our reused connectDB function...
  app.listen(process.env.PORT, () => { // ...THEN starts the server only after the DB connection is established
    console.log(`Server running on port ${process.env.PORT} `);
  });
});


/*
VIP Addt'l Note regarding:
app.use('/api/bookmarks', bookmarkRoutes);
- Mounts the bookmark router onto the Express app at the path /api/bookmarks. This means:
POST /api/bookmarks -> hits the create route
GET /api/bookmarks -> hits the get all route
GET /api/bookmarks/:id -> hits the get one route
PUT /api/bookmarks/:id -> hits the update route
DELETE /api/bookmarks/:id -> hits the delete route
- Important to note that WITHOUT this line, those routes in the 'bookmark.js' file would exist in the file but would never actually be reachable
*/