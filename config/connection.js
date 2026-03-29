const mongoose = require('mongoose'); // Imports 'Mongoose', which is the library that lets app talk to MongoDB.

const connectDB = async () => { // Defines an 'async' function called 'connectDB'
  try { // try to attempt this code, but if something goes technically wrong, jump to 'catch' to throw the proper error and don't crash
    await mongoose.connect(process.env.MONGO_URI); // it awaits while using the MONGO_URI from '.env' to connect to Atlas database.
    console.log('MongoDB connected successfully'); // IF successful connecting, it displays appropriate message
  } catch (error) { // ELSE if connection fails...
    console.error('MongoDB connection failed:', error.message); // ...it displays appropriate message
  }
};

module.exports = connectDB; // this exports the function 'connectDB' so 'server.js' can import and use it.