const jwt = require('jsonwebtoken'); // imports the 'jsonwebtoken' library so we can create and verify JWTs. Like digital ID card that proves who you are.

// Signs a JWT for a user (adapted from Lab 14.1 login route)
const signToken = (user) => {  // this defines a function called 'signToken' that takes a user object as input that will be called whenever someone successfully logs in 
                              // to give them their token.
  return jwt.sign(  // this calls 'jwt.sign()' which creates and returns a new JWT. Notice it takes 3 arguments — the payload, the secret, and the options.
    { _id: user._id, email: user.email }, // this is the 'payload', the data that is embed inside the token. it gets decoded later when we need to know WHO is making a request
                                          // _id = the user's unique MongoDB ID
                                          // email = the user's email address
    process.env.JWT_SECRET, // this is the secret key used to digitally sign the token. It's stored safely in our .env file. 
                            // without this exact secret, nobody can fake or tamper with the token.
    { expiresIn: '1h' } // this tells the token to automatically expire after 1 hour. After that, the user would need to log in again to get a fresh token. 
                        // it's a security measure — if someone steals your token, it won't work forever.
  );
};

// Middleware that protects routes
const authMiddleware = (req, res, next) => {  // this defines the authMiddleware function. This is what we'll plug into any route we want to protect. what's passed to it:
                                              // req = the incoming request
                                              // res = the response we can send back
                                              // next = a callback that tells Express to move on to the actual route handler

  // 1. Grab the token from the request header
  const authHeader = req.headers.authorization; // this grabs the authorization header from the incoming request.
                                                // When a logged-in user makes a request, they're supposed to send their token in this header in the following format:
                                                // 'Authorization: Bearer...........'

  if (!authHeader || !authHeader.startsWith('Bearer ')) {// checking for 2 conditions:
                                                        // !authHeader = IF there's NO authorization header at all OR
                                                        //!authHeader.startsWith('Bearer ') = if the header doesn't start with "Bearer"
    return res.status(401).json({ message: 'No token provided, access denied' }); // THEN it immediately returns a 401 (Unauthorized) error and stops, while preventing the rest of the function from running.
  }

  // 2. Extract just the token (remove "Bearer ")
  const token = authHeader.split(' ')[1];  // this pulls just the token from the header. 
                                            // [1] grabs just the token part at index 1.
  try { // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"

    // 3. Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // this verifies the token using the secret key. This does 2 things at once:
                                                                // 1) checks that the token was signed with the secret 
                                                                // 2) checks that the token hasn't expired yet
                                                                // If it passes validation, it returns the decoded payload (the '_id' and 'emai'l stored when signing). 
                                                                // If invalid or expired, it throws an error that gets caught below.

    // 4. Attach the decoded user info to the request
    req.user = decoded;  // this attaches the decoded user info to the request object. 
                        //  VIP: by storing it on req.user, any route handler that comes after this middleware can access it. 
                        // For example, the bookmark routes will eventually use req.user._id to know whose bookmarks to look up.
    next();   // if it gets to this point, the Token has passed all checks!
             //  This allows Express to move on to the actual route handler. 
             // Without calling 'next()', the request would just hang forever.
  } catch (error) {   // If 'jwt.verify()' throws an error like bad token, expired token, tampered token, it gets caught here...
    return res.status(401).json({ message: 'Invalid or expired token' }); //...and returns a 401 (Unauthorized) response and the user gets blocked from the route.
  }
};

module.exports = { signToken, authMiddleware }; // this exports both functions as an object so other files can import just what they need. For example:
                                                // routes/users.js imports just 'signToken'
                                                // Any future bookmark routes will import just 'authMiddleware'
                                                // signToken = hands a user their ID card (JWT) when they log in
                                                // authMiddleware = checks that ID card every time someone tries to access a protected router