const express = require("express");

const config = require("./config");

const app = express();


//  ROUTES
require("./routes/counterRoutes")(app);


//  ERROR HANDLING
app.use( (req, res) => {
    res.status(500)
    res.send({message: "Something failed!"})
  });

//  START APP
app.listen(config.PORT, err => {
    if (err) {
        console.log("Error occured");
    } else {
        console.log("Listening on port " + config.PORT);
    }
})
