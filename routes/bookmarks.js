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


// Route 3: GET /api/bookmarks/:id - Get 1 single bookmark by ID
router.get('/:id', async (req, res) => { // Defines a GET route at '/api/bookmarks/:id'. 
                                         // The ':id' is a URL parameter so fpr example a request to '/api/bookmarks/abc123' would set 'req.params.id' to 'abc123'.
  try { // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    const bookmark = await Bookmark.findById(req.params.id);  // this searches MongoDB for a 'bookmark' with that 'specific ID' from the 'URL'.

    if (!bookmark) {  // IF no bookmark was found with that ID....
      return res.status(404).json({ message: 'Bookmark not found' }); // THEN it returns a 404 Not Found error and stops from executing.
    }

    // Ownership/Authorization check — does this bookmark belong to the logged-in user?
    if (bookmark.user.toString() !== req.user._id.toString()) {  // IF this 'bookmark'  DOES NOT belong to the 'logged-in user, IOWS if there is no match'...
                                                                // bookmark.user = the ID of whoever owns this bookmark (stored in MongoDB)
                                                                // 'req.user._id' = the ID of whoever is making this request (decoded from their JWT)
                                                                // BOTH '.toString()' = convert MongoDB 'ObjectIDs' to plain strings so they can be compared
      return res.status(403).json({ message: 'Access denied — this bookmark belongs to another user' });  // ...THEN it returns 403 Forbidden — meaning "you're logged in but this isn't yours"
    }

    res.status(200).json(bookmark); // ELSE, if it make sit to this point, it indicates that it PASSED BOTH checks, therreby returning the bookmark with 200 OK.
  } catch (error) {  // If anything did go wrong in the try code block.... 
    res.status(500).json({ message: error.message });  //...returns a 500 Server Error with the error message.
  }
});

// Route 4: PUT /api/bookmarks/:id -  Update a bookmark by ID
router.put('/:id', async (req, res) => { // Defines a PUT route at '/api/bookmarks/:id' for updating a specific bookmark.
  try { // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    const bookmark = await Bookmark.findById(req.params.id); // this searches MongoDB for a 'bookmark' with that 'specific ID' from the 'URL'.

    if (!bookmark) {   // IF no bookmark was found with that ID....
      return res.status(404).json({ message: 'Bookmark not found' }); // THEN it returns a 404 Not Found error and stops from executing.
    }

    // Authorization check — does this bookmark belong to the logged-in user?
    if (bookmark.user.toString() !== req.user._id.toString()) { // IF this 'bookmark'  DOES NOT belong to the 'logged-in user, IOWS if there is no match'...
                                                                // bookmark.user = the ID of whoever owns this bookmark (stored in MongoDB)
                                                                // 'req.user._id' = the ID of whoever is making this request (decoded from their JWT)
                                                                // BOTH '.toString()' = convert MongoDB 'ObjectIDs' to plain strings so they can be compared
      return res.status(403).json({ message: 'Access denied — this bookmark belongs to another user' });  // ...THEN it returns 403 Forbidden — meaning "you're logged in but this isn't yours"
    }

    const updatedBookmark = await Bookmark.findByIdAndUpdate(  // Once the ownership has been confirmed, then it updates the bookmark following these parameters:
      req.params.id, // = which bookmark to update
      req.body, // =  the new data to update it with
      { new: true } // tells Mongoose to return the UPDATED document instead of the old one
    );

    res.status(200).json(updatedBookmark);  // ELSE, if it makes it to this point, it indicates that it PASSED BOTH checks, thereby returning the bookmark with 200 OK.
  } catch (error) { // If anything did go wrong in the try code block.... 
    res.status(500).json({ message: error.message });  //...returns a 500 Server Error with the error message.
  }
});

// Rouet 5: DELETE /api/bookmarks/:id - Delete a bookmark by ID
router.delete('/:id', async (req, res) => { // Defines a DELETE route at /api/bookmarks/:id for deleting a specific bookmark.
  try { // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    const bookmark = await Bookmark.findById(req.params.id); // this searches MongoDB for a 'bookmark' with that 'specific ID' from the 'URL'.

    if (!bookmark) { // IF no bookmark was found with that ID....
      return res.status(404).json({ message: 'Bookmark not found' }); // THEN it returns a 404 Not Found error and stops from executing.
    }

    // Authorization check — does this bookmark belong to the logged-in user?
    if (bookmark.user.toString() !== req.user._id.toString()) { // IF this 'bookmark'  DOES NOT belong to the 'logged-in user, IOWS if there is no match'...
                                                                // bookmark.user = the ID of whoever owns this bookmark (stored in MongoDB)
                                                                // 'req.user._id' = the ID of whoever is making this request (decoded from their JWT)
                                                                // BOTH '.toString()' = convert MongoDB 'ObjectIDs' to plain strings so they can be compared
      return res.status(403).json({ message: 'Access denied — this bookmark belongs to another user' });  // ...THEN it returns 403 Forbidden — meaning "you're logged in but this isn't yours"
    }

    await Bookmark.findByIdAndDelete(req.params.id); // Once the ownership has been confirmed, then it deletes the bookmark and...
    res.status(200).json({ message: 'Bookmark deleted successfully' }); // returns a 200 OK confirmation message, indicating that it was successfullly deleted
  } catch (error) { // If anything did go wrong in the try code block.... 
    res.status(500).json({ message: error.message }); //...returns a 500 Server Error with the error message.
  }
});

module.exports = router;  // this exports the 'router' (ex, '/', '/:id', etc ) so 'server.js' can import and mount it at '/api/bookmarks'.