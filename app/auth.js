// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID' 		: 'id', // your App ID
        'clientSecret' 	: 'secret', // your App Secret
        'callbackURL' 	: 'http://localhost:8080/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey' 		: 'key',
        'consumerSecret' 	: 'secret',
        'callbackURL' 		: 'http://localhost:8080/auth/twitter/callback'
    }

};