const { COUNT_KEY } = require("../enums/dbKeys");
const { ACTIONS_FILE } = require("../enums/fileNames");
const async = require("async");
const fs = require("fs");

module.exports = (app, redisClient) => {
    app.get("/count", (req, res) => {
        //TODO read value from Redis
        redisClient.get(COUNT_KEY, (err, value) => {
            let count;
            if (value) {
                count = parseInt(value);
            } else {
                count = 0;
            }
            res.status(200).json({ count });
        });
    });

    app.post("/track", (req, res) => {
        if (req.get("Content-Type") !== "application/json") {
            return res.status(400).json({
                errorMessage: "Invalid content type"
            });
        }

        async.series(
            {
                increaseCount: function(callback) {
                    if (req.body.count) {
                        const parsedCount = parseInt(req.body.count);

                        if (!parsedCount)
                            return callback(
                                new TypeError("Count have to be integer"),
                                null
                            );
                        if (parsedCount < 0)
                            return callback(
                                new RangeError("Count can not be negative"),
                                null
                            );

                        redisClient.incrby(
                            COUNT_KEY,
                            parsedCount,
                            (err, increasedValue) => {
                                return callback(
                                    null,
                                    "Count successfully increased!"
                                );
                            }
                        );
                    } else {
                        callback(null, "Nothing increased");
                    }
                },
                fileAppend: function(callback) {
                    const data = JSON.stringify(req.body);

                    fs.appendFile(ACTIONS_FILE, data, err => {
                        if (err)
                            return callback(
                                new Error("File can not be saved"),
                                null
                            );

                        callback(null, "File has been saved");
                    });
                }
            },
            (err, results) => {
                console.log(JSON.stringify(results));

                if (err)
                    return res.status(400).json({
                        errorMessage: err.message
                    });

                res.status(200).json({
                    countMessage: results.increaseCount,
                    fileMessage: results.fileAppend
                });
            }
        );
    });
};
