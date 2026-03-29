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

    // 1. Returning GitHub user?
    let user = await User.findOne({ githubId: profile.id });
    if (user) return done(null, user);

    // 2. Existing local user with same email? Link accounts
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        user.githubId = profile.id;
        await user.save();
        return done(null, user);
      }
    }

    // 3. Brand new user — create them
    user = await User.create({
      githubId: profile.id,
      email: email || `github_${profile.id}@placeholder.com`
    });

    return done(null, user);

  } catch (err) {
    return done(err, null);
  }
}));

module.exports = passport;