module.exports = {
    redis: {
        ip: "127.0.0.1",
        port: 6379,
        options: {
            //auth_pass: "MyPa55w0rD"
        }
    },
    application: {
        port: 80,
        sessionSecret: "test123"
    }
};
