const mongoose = require('mongoose'); // imports mongoose library to be able to talk to MongoDB/Atlas.

const UserSchema = new mongoose.Schema({ // this creates a new schema to define what a 'User' document looks like in the database.
  email: { //   defining the 'email' field as...
    type: String,  // values must be of text format 
    required: true, // can not be left empty.  every user MUST have an email
    unique: true, // no 2 documents can have the same email. no two users can share the same email
    lowercase: true, // values cannot be anything other than lowercase, anything else will be automatically lowercased
    trim: true // cannot have any trailspacing. Having trail spaces will cause mongoose to automatically remove them
  },
  password: {  //   defining the 'password' field as...
    type: String,  // values must be of text format 
                    // Notice it's NOT required, that's bc GitHub users won't have a pwd to begin with, and therefore we can't enforce it
  },
  githubId: {  //   defining the 'githubId' field as...
    type: String,  // values must be of text format 
                    // This field stores the unique ID that GitHub assigns to every user. Notice it's NOT required, that's bc local users (which login in with email/password)...
                    // ... won't have a githubId to begin with, and therefore we can't enforce it
  }
}, { timestamps: true }); // - thus tells Mongoose to automatically add 2 fields to every user:
                         // -- createdAt - when the account was created
                        // -- updatedAt - when it was last modified

module.exports = mongoose.model('User', UserSchema); 