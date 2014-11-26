# Easy Node Authentication (with Redis)

Code was forked from the scotch.io tutorial series "Complete Guide to Node Authentication" from https://github.com/scotch-io/easy-node-authentication

We will be using Passport to authenticate users locally, with Facebook, Twitter, and store our application data in Redis (instead MongoDB as in the original sample code).

All module dependencies have been updated to the most recent versions (as of 2014-11-25).

## Instructions

If you would like to download the code and try it for yourself:

1. Clone the repo: `git clone git@github.com:tobilg/easy-node-authentication-redis.git`
2. Install packages: `npm install`
3. Change out auth keys in app/auth.js
4. Change the Redis connection details in app/config.js
5. Launch: `node server.js`
6. Visit in your browser at: `http://localhost:8080`

