const redis = require("redis");
const { DB_PORT, DB_HOST } = require("./config");

const client = redis.createClient(DB_PORT, DB_HOST);

client.on("connect", () => {
    console.log("Redis connected (" + DB_HOST + ":" + DB_PORT + ")");
});

module.exports = client;
