const express = require('express'); // this imports the Express library to be able to create a router
const router = express.Router(); // this creates a 'router object'
                                 // it's much like a mini version of 'app' that handles a specific group of routes.
                                 // this is what it exports and mounts in 'server.js' at /api/users.
const Bookmark = require('../models/Bookmark'); // imports in the Bookmark model so we implement CRUD on 'bookmarks' in MongoDB.
const { authMiddleware } = require('../utils/auth'); // imports ONLY the 'authMiddleware' function from 'auth.js'. 
                                                    // note, you don't need signToken here since we're not issuing tokens in this file.
// Apply 'authMiddleware' to ALL routes in this file
router.use(authMiddleware); // by applying 'authMiddleware' here once at the top, EVERY single route below automatically requires a valid JWT!!!!
                            //  We don't have to add it individually to each route.

// Route 1:  POST /api/bookmarks - to create a new bookmark
router.post('/', async (req, res) => {  //Defines a POST route at /api/bookmarks. This is how a user creates a new bookmark.
  try {  // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    const { title, url, description } = req.body; // it destructures the 3 bookmark fields out of the 'request body' that the user sends in their POST request.

    const bookmark = await Bookmark.create({ // this creates and saves a new bookmark in MongoDB with all 4 fields:
      title,  //  comes from the request body
      url,     // "  "  "   "
      description,      // "  "  "   "
      user: req.user._id  // this automatically assigns the logged-in user's ID as the owner
                          // 'req.user' was attached by 'authMiddleware' when it decoded the 'JWT'
    });

    res.status(201).json(bookmark); //  this returns a '201 Created' status with the newly created bookmark as JSON.
  } catch (error) {  // If anything did go wrong in the try code block.... 
    res.status(500).json({ message: error.message }); //...returns a 500 Server Error with the error message.
  }
});

// Route 2: GET /api/bookmarks — Get ALL bookmarks belonging to the logged-in user
router.get('/', async (req, res) => { // Defines a GET route at '/api/bookmarks'. It returns all bookmarks belonging to the logged-in user.
  try {  // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    const bookmarks = await Bookmark.find({ user: req.user._id }); // this finds ONLY bookmarks where the 'user field' MATCHES the 'logged-in user's ID'. 
                                                                  // This is the key line that prevents users from seeing each other's bookmarks, as it filters by... 
                                                                  // ...owner automatically.
    res.status(200).json(bookmarks); // It returns 200 OK with an array of the user's bookmarks.
  } catch (error) { // If anything did go wrong in the try code block.... 
    res.status(500).json({ message: error.message }); //...returns a 500 Server Error with the error message.
  }
});
