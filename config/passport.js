const passport = require('passport');  // imports passport library which is the authentication framework that manages the login process.
const GitHubStrategy = require('passport-github2').Strategy; // this imports in the GitHub 'strategy' from the 'passport-github2' package. 
                                                            // strategy = is a plugin that tells 'passport' how to authenticate with a specific service (itc GitHub)
const User = require('../models/User'); //  this imports the 'User' model so we can find and create users in the database during the GitHub login process.

passport.use(new GitHubStrategy({ // this tells passport to use this strategy (itc GitHubStrategy). It creates a new instance of the GitHubStrategy and registering it with passport.
    // configuration settings for the GitHub strategy:
  clientID: process.env.GITHUB_CLIENT_ID, // clientID = the app's public identifier on GitHub. It comes from your '.env' file
  clientSecret: process.env.GITHUB_CLIENT_SECRET, // clientSecret = the app's private key on GitHub t comes from your '.env' file
  callbackURL: process.env.GITHUB_CALLBACK_URL, // callbackURL = the URL that GitHub will send the user back to after they approve the login
  scope: ['user:email'] // this communicates to GitHub that access is needed to the user's email address. Without this, GitHub will not share it.
},
async (accessToken, refreshToken, profile, done) => {  //  this callback function runs automatically after GitHub confirms the user's identity. 
                                                        // It receives:
                                                        // accessToken = a token GitHub gives us to access their API but I dont think it's really use this here
                                                        // refreshToken = a token to get a new access token but I dont think it's really use this here
                                                        // profile =  this contains all the user's GitHub info (id, email, username, etc.)
                                                        // done = this is a function that called when we're finished looking up or creating the user in database...
                                                        // ...to tell passport what happened
  try {  // try to attempt this code, but if somthing goes technically wrong, jump to 'catch' to throw the proper error and don't crash"
    //  Trying to extract the 'email' from the GitHub profile:
    const email = profile.emails && profile.emails[0]  // first checks that emails EXISTS AND there's at least one
      ? profile.emails[0].value // IF true, then grabs the 1st email address
      : null; //  ELSE, if no email is available, this sets it to null
      /*
      GitHub sometimes doesn't share emails depending on the user's privacy settings, so this possibility needs to be handled.
      */

    // Scenario 1: Returning GitHub user?
    let user = await User.findOne({ githubId: profile.id }); // it finds the database for a user whose 'githubId' matches the 'GitHub profile ID'...
    if (user) return done(null, user); // IF found, it calls 'done(null, user)', with 'user' indicating success that the user was found and stops here
                                        // while the 'null argument means "no error"

    // Scenario 2: Existing local user with same email?
    if (email) {                                // If there is an an email found, it then searches for the 'user' with that 'email' in the database                                      
      user = await User.findOne({ email });  // If a match is found, it means they previously registered with email/password
      if (user) {
        user.githubId = profile.id;  //so it links their GitHub ID to their existing account by saving githubId onto their record
        await user.save();
        return done(null, user); //then it calls 'done(null, user)' to log them in
      }
    }

    // Scenario 3. Brand new user — create them
    user = await User.create({                                  // If no existing user was found at all, a new one is created
    githubId: profile.id,   // githubId = this is the field in the database (defined in User.js) where it stores GitHub's ID
                            // profile.id = this is GitHub's unique ID for this user, taken from the profile object they sent us
    email: email || `github_${profile.id}@placeholder.com`  // this line  uses their real email if it's found in DB, otherwise it generates a placeholder email so the required
                                                            //  field on the 'User' model doesn't complain
    });

    return done(null, user); // Then calls done(null, user) to log them in
                                                               
  } catch (err) { //  If anything went wrong in the try block of technical nature like database error
    return done(err, null); // this calls 'done(err, null)', where 
                            // err = is the error
                            // null =  "no user"
                            // in essence, this tells passport that authentication failed due to an error
  }
}));

module.exports = passport;  // exports the configured passport so that teh entry point 'server.js' file can import it and use it. 
                            // by this point passport already knows about the GitHub strategy, so exporting it carries all that configuration with it.