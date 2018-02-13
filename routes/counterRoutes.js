
module.exports = (app) => {

    app.get("/count", (req, res) => {
        //TODO save JSON body to file (using body-parser)
        //TODO increment value in Redis
        const number = 1;
        res.send({count : number});
    })

    app.post("/track", (req, res) => {
        //TODO read value from Redis
    })

};