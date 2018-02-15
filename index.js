const express = require("express");
const bodyParser = require("body-parser");

const { SERVER_PORT } = require("./config");

const app = express();
const redisClient = require("./db");


app.use(bodyParser.json());

//  ROUTES
require("./routes/counterRoutes")(app, redisClient);


//  ERROR HANDLING
app.use((req, res) => {
    res.status(500)
    res.send({ message: "Something failed!" })
});

//  START APP
app.listen(SERVER_PORT, err => {
    if (err) {
        console.log("Error occured");
    } else {
        console.log("Listening on port " + SERVER_PORT);
    }
})

module.exports = {
    app,
    redisClient
}