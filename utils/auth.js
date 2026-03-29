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
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, access denied' });
  }

  // 2. Extract just the token (remove "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verify the token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 4. Attach the decoded user info to the request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = { signToken, authMiddleware };