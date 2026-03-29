
const mongoose = require('mongoose'); // imports mongoose library to be able to talk to MongoDB/Atlas.

const BookmarkSchema = new mongoose.Schema({ // this creates a new schema to define what a 'Bookmark' document looks like in the database.
  title: { //   defining the 'title' field as...
    type: String,  // values must be of text format 
    required: true, // can not be left empty.  every bookmark MUST have an title
    trim: true  // cannot have any trailspacing. Having trail spaces will cause mongoose to automatically remove them
  },
  url: { //   defining the 'url' field as...
    type: String, // values must be of text format 
    required: true, // can not be left empty.  every bookmark MUST have a url
    trim: true  // cannot have any trailspacing. Having trail spaces will cause mongoose to automatically remove them
  },
  description: { //   defining the 'description' field as...
    type: String, // values must be of text format 
    trim: true  // cannot have any trailspacing. Having trail spaces will cause mongoose to automatically remove them
  },
  user: {  //   defining the 'user' field as...
    type: mongoose.Schema.Types.ObjectId, // this stores a unique ID for every document in MongoDB.
    ref: 'User',  //  tells Mongoose this ID belongs to a document in the User collection. This creates a relationship between the 2 models (Boomark and User)
    required: true // can not be left empty.  every bookmark MUST have a user
  }
}, { timestamps: true }); // - thus tells Mongoose to automatically add 2 fields to every bookmark:
                         // -- createdAt - when the bookmark was created
                        // -- updatedAt - when it was last modified


module.exports = mongoose.model('Bookmark', BookmarkSchema);   // - <mongoose.model('Bookmark', BookmarkSchema)> =  takes the schema and creates an actual Model from it that 
                                                                // ...can interact with the DB to manipulate bookmarks through CRUD   
                                                                // - <module.exports> = makes this model available to other files in the project that are requiring it

/*
VIP note:
- Every bookmark has a title, URL, and optional description. However, the 'user' field is what lets you 
-- only show THIS user's bookmarks 
-- and only let THIS user edit their own bookmarks.
.... Without this field, there'd be no security! 🔐
*/