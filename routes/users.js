const express = require('express'); // this imports the Express library to be able to create a router
const router = express.Router(); // this creates a 'router object'
                                 // it's much like a mini version of 'app' that handles a specific group of routes.
                                 // this is what it exports and mounts in 'server.js' at /api/users.
const User = require('../models/User'); // this imports the 'User' model so you can query and create users in the database.
const { signToken } = require('../utils/auth'); // imports the signToken utility so it can issue JWTs on successful login

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



module.exports = router; // exports the router so server.js can import and mount it