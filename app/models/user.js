var nohm = require('nohm').Nohm;
var bcrypt   = require('bcrypt-nodejs');
var redis = require('redis');
var crypto = require('crypto');
var config = require('../config');

var redisClient = redis.createClient(config.redis.port, config.redis.ip, config.redis.options);

var User = null;

redisClient.on("ready", function() {

    console.log("redis ok");

});

nohm.setClient(redisClient);

nohm.model('User', {
    properties: {
        localEmail: {
            type: 'string',
            unique: true,
            validations: [
                ['email']
            ]
        },
        localPassword: {
            defaultValue: '',
            type: function (value) {
                return value;
            }
        },
        facebookId: {
            type: 'string',
            index: true
        },
        facebookToken: {
            type: 'string'
        },
        facebookEmail: {
            type: 'string'
        },
        facebookName: {
            type: 'string'
        },
        twitterId: {
            type: 'string',
            index: true
        },
        twitterToken: {
            type: 'string'
        },
        twitterDisplayName: {
            type: 'string'
        },
        twitterUserName: {
            type: 'string'
        }
    },
    methods: {
        generateHash: function(password) {
            return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
        },
        validPassword: function(password) {
            return bcrypt.compareSync(password, this.p('localPassword'));
        },
        generateID: function() {
            return crypto.randomBytes(20).toString('hex');
        }
    },
    idGenerator: function (cb) {
        cb(this.generateID());
    }
});


// create the model for users and expose it to our app
module.exports = nohm.factory('User');

// try to load a user from the db
module.exports.findUser = function(userId, callback) {

    var foundUser = nohm.factory('User', userId, function (err) {
        if (err === 'not found') {
            console.log('no user with id ' + userId + ' found :-(');
        } else if (err) {
            console.log(err); // database or unknown error
        }
        callback(err, foundUser);
    });

}
