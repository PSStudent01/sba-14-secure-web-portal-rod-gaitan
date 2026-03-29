const mongoose = require('mongoose'); // Imports 'mongoose' for the file to use to create the User schema
const bcrypt = require('bcrypt'); // Imports bcrypt, which is the library that handles password HASHING

const userSchema = new mongoose.Schema({ // creates a new schema/blueprint for the user that defines the shape of each document in MongoDB.
  username: {
    type: String,
    trim: true
    // Not required — GitHub users may not have one
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    // Not required — GitHub users won't have one
  },
  githubId: {
    type: String,
    // Not required — local users won't have one
  }
}, { timestamps: true }); // This 2nd argument closes off the schema definition
                          // - 'timestamps:' when set to true, it tells Mongoose to automatically add 2 fields to every document:
                          // -- 'createdAt'
                          // -- 'updatedAt'

// Pre-save hook to hash password (reused from Lab 14.1)
userSchema.pre('save', async function() { // this registers a pre-save hook, a function that automatically runs before any user document is saved to the database.
                                          // In newer versions of Mongoose, 'next' is not needed — Mongoose handles continuation automatically with async functions.
  if (!this.isModified('password') || !this.password) return; // this checks if the password field was changed. IF it wasn't, THEN it skips the hashing process and moves on.
                                                               // Also checks if password exists at all — GitHub users won't have one, so we skip hashing entirely for them.

  const salt = await bcrypt.genSalt(10); // this generates a salt, which is a random string added to the password before hashing to make it more secure.
                                         // 10 is the number of rounds, which controls how complex the salt is.
                                         // the more rounds, the more secure at the expense of speed
  this.password = await bcrypt.hash(this.password, salt); // this takes the plain text password, combines it with the salt, and hashes it.
                                                          // Then overwrites this.password with the resulting hash so that's what gets saved.
});

// Instance method to check password (reused from Lab 14.1)
userSchema.methods.isCorrectPassword = async function(incomingPassword) { // Adds a custom method to every user document.
  return await bcrypt.compare(incomingPassword, this.password); // When the method is called, it uses 'bcrypt.compare' to check if the plain text 'incomingPassword' matches the stored hash.
                                                                // ...then returns true or false.
};

const User = mongoose.model('User', userSchema); // this creates the actual 'User' model from the schema. This MODEL is what it uses to interact with the 'users' collection in MongoDB.
                                                 // mental note: 'User' schema converts into > 'User' model so that we can use this model to talk to > 'users' collection.

module.exports = User; // it exports the 'User' model so other files like the routes can import and use it.