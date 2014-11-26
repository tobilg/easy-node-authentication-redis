// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;

// load up the user model
var User       = require('./models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log("serialize: " + JSON.stringify(user.id));
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {

        console.log("deserialize: " + id);

        User.findUser(id, function(err, user){
            //console.log("deserialize: after search: " + JSON.stringify(user.allProperties()));
            done(err, user.allProperties());
        });

    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {

            //User.find() just finds IDs! The actual User object must be retrieved manually!
            User.find({ 'localEmail' :  email }, function(err, userIds) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                //Get User object based on found ID
                User.findUser(userIds[0], function(err, user){

                    console.log("find login: " + JSON.stringify(user.allProperties()));

                    // if no user is found, return the message
                    if (!user)
                        return done(null, false, req.flash('loginMessage', 'No user found.'));

                    if (!user.validPassword(password))
                        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                    // all is well, return user
                    else
                        return done(null, user.allProperties());

                });

            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
                //Search for email address
                User.find({ 'localEmail' :  email }, function(err, userIds) {
                    // if there are any errors, return the error
                    if (err)
                        return done(err);

                    var userId = userIds[0];

                    console.log("signup found existing email address! For ID: "+ JSON.stringify(userId));

                    // check to see if theres already a user with that email
                    if (userId) {
                        return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                    } else {

                        var newUser = User;

                        newUser.p({
                            localEmail: email,
                            localPassword: newUser.generateHash(password)
                        });

                        newUser.save(function (err) {
                            if (err) {
                                return done(err);
                            } else {
                                return done(null, newUser);
                            }
                        });

                    }

                });
            // if the user is logged in but has no local account...
            } else if ( !req.user.localEmail ) {
                // ...presumably they're trying to connect a local account
                // BUT let's check if the email used to connect a local account is being used by another user
                User.find({ 'localEmail' :  email }, function(err, userIds) {
                    if (err)
                        return done(err);

                    var userId = userIds[0];

                    if (userId) {
                        return done(null, false, req.flash('loginMessage', 'That email is already taken.'));
                        // Using 'loginMessage instead of signupMessage because it's used by /connect/local'
                    } else {

                        //Get new User model instance
                        var user = User;

                        //Assign new properties to existing properties from session object
                        var tempUser = req.user;
                        tempUser.localEmail = email;
                        tempUser.localPassword = user.generateHash(password);

                        //Add properties to User model
                        user.p(tempUser);

                        user.save(function (err) {
                            if (err) {
                                return done(err);
                            } else {
                                return done(null, user.allProperties());
                            }
                        });
                    }
                });
            } else {
                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                console.log("Not logged in: " + JSON.stringify(profile));

                User.find({ 'facebookId' : profile.id }, function(err, userIds) {

                    var userId = userIds[0];

                    console.log("Not logged in: userids: " + (typeof userIds === "undefined" ? "undef" : userIds));

                    if (err)
                        return done(err);

                    if (userId) {

                        console.log("Not logged in: userid found");

                        //Get User object based on found ID
                        User.findUser(userId, function(err, user){

                            if (err)
                                return done(err);

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.facebookToken) {

                                user.p('facebookId', profile.id);
                                user.p('facebookToken', token);
                                user.p('facebookName', profile.name.givenName + ' ' + profile.name.familyName);
                                user.p('facebookEmail', (profile.emails[0].value || '').toLowerCase());

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user.allProperties());
                                });

                            }

                        });

                    } else {

                        console.log("Not logged in: userid not found");

                        // if there is no user, create them
                        var newUser            = User;

                        newUser.p('facebookId', profile.id);
                        newUser.p('facebookToken', token);
                        newUser.p('facebookName', profile.name.givenName + ' ' + profile.name.familyName);
                        newUser.p('facebookEmail', (profile.emails[0].value || '').toLowerCase());
                        newUser.p('localEmail', (profile.emails[0].value || '').toLowerCase());

                        console.log(JSON.stringify(newUser.allProperties()));

                        newUser.save(function(err) {
                            console.log("save err: "+err);
                            if (err)
                                return done(err);
                                
                            return done(null, newUser.allProperties());
                        });
                    }
                });

            } else {

                //Get User object based on found ID
                User.findUser(req.user.id, function(err, user){

                    user.p('facebookId', profile.id);
                    user.p('facebookToken', token);
                    user.p('facebookName', profile.name.givenName + ' ' + profile.name.familyName);
                    user.p('facebookEmail', (profile.emails[0].value || '').toLowerCase());

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user.allProperties());
                    });

                });

            }
        });

    }));

    // =========================================================================
    // TWITTER =================================================================
    // =========================================================================
    passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, tokenSecret, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.find({ 'twitterId' : profile.id }, function(err, userIds) {
                    if (err)
                        return done(err);

                    var userId = userIds[0];

                    if (userId) {
                        // if there is a user id already but no token (user was linked at one point and then removed)

                        console.log("Not logged in: userid found");

                        //Get User object based on found ID
                        User.findUser(userId, function(err, user){

                            if (err)
                                return done(err);

                            // if there is a user id already but no token (user was linked at one point and then removed)
                            if (!user.twitterToken) {

                                user.p('twitterId', profile.id);
                                user.p('twitterToken', token);
                                user.p('twitterUserName', profile.username);
                                user.p('twitterDisplayName', profile.displayName);

                                user.save(function(err) {
                                    if (err)
                                        return done(err);

                                    return done(null, user.allProperties());
                                });

                            }

                        });

                    } else {
                        // if there is no user, create them

                        console.log("Not logged in: userid not found");

                        // if there is no user, create them
                        var newUser            = User;

                        newUser.p('twitterId', profile.id);
                        newUser.p('twitterToken', token);
                        newUser.p('twitterUserName', profile.username);
                        newUser.p('twitterDisplayName', profile.displayName);
                        newUser.p('localEmail', (profile.id + '@twitter-login.test').toLowerCase());

                        console.log(JSON.stringify(newUser.allProperties()));

                        newUser.save(function(err) {
                            console.log("save err: "+err);
                            if (err)
                                return done(err);

                            return done(null, newUser.allProperties());
                        });

                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts

                //Get User object based on found ID
                User.findUser(req.user.id, function(err, user){

                    user.p('twitterId', profile.id);
                    user.p('twitterToken', token);
                    user.p('twitterUserName', profile.username);
                    user.p('twitterDisplayName', profile.displayName);

                    user.save(function(err) {
                        if (err)
                            return done(err);

                        return done(null, user.allProperties());
                    });

                });

            }

        });

    }));

};
