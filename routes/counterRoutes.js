
module.exports = (app, redisClient) => {

    app.get("/count", (req, res) => {
        //TODO save JSON body to file (using body-parser)
        //TODO increment value in Redis
        const number = 0;
        res.json({count : number});
    })

    app.post("/track", (req, res) => {
        //TODO read value from Redis
        const error = new Error("Server error");
        res.status(500).json({error});
    })

};