const express = require('express'); // this imports the Express library to be able to create a router
const router = express.Router(); // this creates a 'router object'
                                 // it's much like a mini version of 'app' that handles a specific group of routes.
                                 // this is what it exports and mounts in 'server.js' at /api/users.
const User = require('../models/User'); // this imports the 'User' model so you can query and create users in the database.
const { signToken } = require('../utils/auth'); // imports the signToken utility so it can issue JWTs on successful login
const passport = require('../config/passport'); // imports the configured passport instance for GitHub OAuth routes

// Registration Route - POST /api/users/register
router.post('/register', async (req, res) => { // Defines a POST route at /register.
                                                // Since this router is mounted at '/api/users' in 'server.js', the full path becomes /api/users/register.
  try { // try to attempt this code, but if something goes technically wrong, jump to 'catch' to throw the proper error and don't crash
    const { username, email, password } = req.body; // this destructures the 3 fields needed out of the request body that the user sends in their POST request.

    // Check if user already exists
    const existingUser = await User.findOne({ email }); // this searches the database for a user with the email in question.
                                                        // THEN it returns the user document if found, OR null if not.
    if (existingUser) { // IF a user was found, it stops here and...
      return res.status(400).json({ message: 'User with that email already exists' }); // ...returns a 400 (bad request) error. The return stops executing the rest of the function.
    }

    // Create new user (pre-save hook in User.js will hash the password automatically)
    const newUser = await User.create({ username, email, password }); // this creates and saves a new user document in the database.
                                                                       // it triggers the 'pre-save' hook in the model which automatically hashes the password before saving.
    const userToReturn = newUser.toObject(); // this converts the Mongoose document into a plain JavaScript object so it can be manipulated it.
    delete userToReturn.password; // this removes the password from the object before sending it back.
                                  /*you'd never want to return a password, even a hashed one, in a response.*/

    res.status(201).json(userToReturn); // returns a 201 (created) status with the new user's data as JSON.
  } catch (error) { // IF anything throws an error in the 'try' block, it gets caught here and...
    res.status(500).json({ message: error.message }); // ...returns a 500 (server error) with the error message.
  }
});

// Login Route - POST /api/users/login
router.post('/login', async (req, res) => { // this defines a POST route at /login, making the full path /api/users/login.
  try { // try to attempt this code, but if something goes technically wrong, jump to 'catch' to throw the proper error and don't crash
    const { email, password } = req.body; // this extracts the 'email' and 'password' ONLY out of the request body.
                                          // 'username' is not needed here since we're looking up the user by 'email'.

    // Find user by email
    const user = await User.findOne({ email }); // this searches the database for a user with that email.
    if (!user) { // IF no user was found...
      return res.status(400).json({ message: 'Incorrect email or password' }); // ...return a 400 error. We use the same message for both cases to avoid revealing which field was wrong.
    }

    // Use isCorrectPassword instance method from the User model
    const isMatch = await user.isCorrectPassword(password); // calls the custom method defined in User.js to compare the incoming password with the stored hash
    if (!isMatch) { // IF passwords don't match...
      return res.status(400).json({ message: 'Incorrect email or password' }); // ...return the same 400 error message
    }

    // Sign and return JWT
    const token = signToken(user); // uses the signToken utility to create a JWT for this user
    res.json({ token, user: { _id: user._id, email: user.email } }); // returns the token and basic user info (no password!)
  } catch (error) { // IF anything throws an error in the 'try' block, it gets caught here and...
    res.status(500).json({ message: error.message }); // ...returns a 500 (server error) with the error message.
  }
});

/****************************** For Lssn 4 ********************************************/
// I) First route - Start the OAuth flow - GET /api/users/auth/github
// When a user visits this URL, they will be redirected to GitHub to log in.
router.get(     // Defines a GET route at '/auth/github'. 
  '/auth/github', // Since the router is mounted at /api/users in 'server.js', the full path then becomes '/api/users/auth/github'. 
                 // Ultimatlely, this is the URL a user clicks when they want to "Login with GitHub."
  passport.authenticate('github', { scope: ['user:email'] }) // this line does 2 things simultaneously:
                                                            // 1) "passport.authenticate('github')"" = tells passport to start the 'GitHub OAuth flow'...
                                                            // It automatically redirects the user to 'GitHub's login page'. You don't have to build that redirect yourself 
                                                            // since passport does it automatically for you.
                                                            // 2) "scope: ['user:email']" = tells GitHub what permissions we need. In this case we're requesting access to the
                                                            // user's email address. Without this, GitHub will not share it with user.
);

// II) Second route - Handle GitHub's callback
// The callback route that GitHub redirects to after the user approves - GET /api/users/auth/github/callback
router.get(    // Defines a GET route at '/auth/github/callback'.  It must match exactly what you put in your GitHub OAuth App settings and your .env file.              
  '/auth/github/callback', // Since the router is mounted at /api/users in 'server.js', the full path then becomes '/api/users/auth/github/callback'
                           // This is the URL we specified GitHub to send the user back to AFTER they approve or deny the login. 
  passport.authenticate('github', {  // this runs passport's GitHub authentication again on the way back. 
                                    // But this time passport takes the temporary code 'GitHub sent back' and CHNAGES it for the user's 'actual profile data'.
    failureRedirect: '/login', // IF the user denied access on GitHub or something went wrong, this redirects user to /login to try again.
    session: false //  this tells passport not to use sessions. 
                  // Normally passport stores the 'logged in user' in a 'session (like a cookie)', but since we're using JWTs instead, we don't need sessions at all! 
                  // While this is optional it keeps things cleaner.
  }),
  (req, res) => { // middleware function that only runs if 'passport' authentication succeeded. 
                // At this point passport has already found or created the user in MongoDB database via the 'verify callback in passport.js' and attached it to 'req.user'.

    const token = signToken(req.user);  // this where a new JWT is issued to the user. it sses our 'signToken' utility from 'utils/auth.js' to create a 'JWT' for this user. 
                                        // 'req.user' contains the 'user' object that passport attached, the same one that was returned by done(null, user) in passport.js.
    // Redirect the user to the frontend with the token as a query parameter
    res.redirect(`http://localhost:3000?token=${token}`); // this redirects the user to the frontend with their JWT token attached as a query parameter in the URL. 
                                                          // So ITC, the URL syntax maybe somrhing like http://localhost:3000?token=eyJhbGci...
                                                          // The frontend app (running on port 3000 NOT 5000) can then grab that token from the URL and store it. 
                                                          // ***Since there is no real frontend here, this just simulates what would happen in a real app.***
  }
);

module.exports = router; // exports the router so server.js can import and mount it