process.env.NODE_ENV = "test";

const fs = require("fs");
const async = require("async");

const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, redisClient } = require("../index");
const should = chai.should();

const { COUNT_KEY } = require("../enums/dbKeys");
const { ACTIONS_FILE } = require("../enums/fileNames");

chai.use(chaiHttp);

const postData = {
    count: 10,
    message: "Lorem ipsum ...",
    name: "post data name"
};

function clean(done) {
    async.series(
        {
            delDB: function(callback) {
                redisClient.del(COUNT_KEY, (err, reply) => {
                    if (err)
                        return callback(new Error("DB could not be cleaned"));
                    callback(null, "DB was successfully cleaned");
                });
            },
            delFiles: function(callback) {
                fs.exists(ACTIONS_FILE, exist => {
                    if (!exist) return callback(null, "File does not exist");
                    fs.unlink(ACTIONS_FILE, err => {
                        if (err)
                            return callback(
                                new Error("File could not be deleted"),
                                null
                            );
                        callback(null, "File was successfully deleted");
                    });
                });
            }
        },
        (err, results) => {
            if (err) return err;
            done();
        }
    );
}

describe("Count", () => {
    beforeEach(done => {
        clean(done);
    });

    after(done => {
        clean(done);
    });

    describe("/GET count", () => {
        it("it should GET count 0 (empty redis DB)", done => {
            chai
                .request(app)
                .get("/count")
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.not.have.property("error");
                    res.body.should.have.property("count", 0);
                    done();
                });
        });

        it('it should GET count 5 (before this get redis db contain key "count" of value 5)', done => {
            redisClient.set(COUNT_KEY, 5, (err, reply) => {
                if (err) return done(err);
                chai
                    .request(app)
                    .get("/count")
                    .end((err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a("object");
                        res.body.should.not.have.property("error");
                        res.body.should.have.property("count", 5);
                        done();
                    });
            });
        });
    });

    describe("/POST track", () => {
        it("it should initialize redis key", done => {
            chai
                .request(app)
                .post("/track")
                .send(postData)
                .end((err, res) => {
                    redisClient.get(COUNT_KEY, function(err1, raisedValue) {
                        should.exist(raisedValue);
                        raisedValue.should.be.eql(postData.count.toString());

                        res.should.have.status(200);
                        res.body.should.not.have.property("error");
                        res.body.should.have.property(
                            "countMessage",
                            "Count successfully increased!"
                        );

                        done();
                    });
                });
        });
        it("it should correctly increment redis db key", done => {
            redisClient.set(COUNT_KEY, 500, (err, reply) => {
                chai
                    .request(app)
                    .post("/track")
                    .send(postData)
                    .end((err, res) => {
                        redisClient.get(COUNT_KEY, function(err1, raisedValue) {
                            should.exist(raisedValue);
                            const finalCount = 500 + postData.count;
                            raisedValue.should.be.eql(finalCount.toString());

                            res.should.have.status(200);
                            res.body.should.be.a("object");
                            res.body.should.not.have.property("error");
                            res.body.should.have.property(
                                "countMessage",
                                "Count successfully increased!"
                            );

                            done();
                        });
                    });
            });
        });
        it("it should reject POST that contains negative count", done => {
            const invalidPostData = {
                count: -1,
                message: "Lorem ipsum ...",
                name: "negative count"
            };
            chai
                .request(app)
                .post("/track")
                .send(invalidPostData)
                .end((err, res) => {
                    redisClient.get(COUNT_KEY, function(err, reply) {
                        should.not.exist(reply);

                        res.should.have.status(400);
                        res.body.should.be.a("object");
                        res.body.should.have.property(
                            "errorMessage",
                            "Count can not be negative"
                        );

                        done();
                    });
                });
        });
        it('it should reject POST with no integer "count" value', done => {
            const invalidPostData = {
                count: "count",
                message: "Lorem ipsum ...",
                name: "post data name"
            };
            chai
                .request(app)
                .post("/track")
                .send(invalidPostData)
                .end((err, res) => {
                    redisClient.get(COUNT_KEY, function(err, value) {
                        should.not.exist(value);

                        res.should.have.status(400);
                        res.body.should.have.property(
                            "errorMessage",
                            "Count have to be integer"
                        );

                        done();
                    });
                });
        });
        it("it should save json to file", done => {
            chai
                .request(app)
                .post("/track")
                .send(postData)
                .end((err, res) => {
                    fs.readFile(ACTIONS_FILE, "utf8", function(err, data) {
                        should.exist(data);
                        const json = JSON.parse(data);
                        postData.should.be.eqls(json);

                        res.should.have.status(200);
                        res.body.should.have.property(
                            "fileMessage",
                            "File has been saved"
                        );

                        done();
                    });
                });
        });
        it("it should save json without count", done => {
            const withoutCount = {
                message: "Lorem ipsum ...",
                name: "post data name"
            };
            chai
                .request(app)
                .post("/track")
                .send(withoutCount)
                .end((err, res) => {
                    fs.readFile(ACTIONS_FILE, "utf8", function(err, data) {
                        should.exist(data);
                        const json = JSON.parse(data);
                        withoutCount.should.be.eqls(json);

                        res.should.have.status(200);
                        res.body.should.have.property(
                            "fileMessage",
                            "File has been saved"
                        );

                        done();
                    });
                });
        });
        it("it should not save json with invalid count", done => {
            const invalidPostData = {
                count: -1,
                message: "Lorem ipsum ...",
                name: "negative count"
            };
            chai
                .request(app)
                .post("/track")
                .send(invalidPostData)
                .end((err, res) => {
                    fs.readFile(ACTIONS_FILE, "utf8", function(err, data) {
                        should.not.exist(data);

                        res.should.have.status(400);
                        res.body.should.have.property("errorMessage");

                        done();
                    });
                });
        });
    });
});
