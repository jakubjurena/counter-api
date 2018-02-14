process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const {app, redisClient} = require("../index");
const should = chai.should();

const {COUNT_KEY} = require("../enums/dbKeys");


chai.use(chaiHttp);



const postData = {
    count: 10,
    message: "test data",
    session: "aaa111"
}

describe("Count", () => {

    beforeEach( (done) => {
        redisClient.del(COUNT_KEY, (err, reply) => {
            console.log(reply);
            done();
        })
    });

    describe("/GET count", () =>{

        it("it should GET count 0 (\"initialisation run\" - redis count key is not set)", (done) => {
            chai.request(app)
                .get("/count")
                .end( (err, res) => {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.not.have.property("error");
                    res.body.should.have.property("count", 0);
                    done();
                })
        });

        it("it should GET count 5 (before this get redis db contain key \"count\" of value 5)", (done) => {
            redisClient.set(COUNT_KEY, 5, (err, reply) => {
                if (err) return done(err);
                chai.request(app)
                    .get("/count")
                    .end( (err, res) => {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a("object");
                        res.body.should.not.have.property("message");
                        res.body.should.have.property("count", 5);
                        done();
                    })
            })
        })
    })

    describe("/POST track", () => {

        it("it should initialize redis key", (done) => {
            chai.request(app)
                .post("/track")
                .send(postData)
                .end( (err, res) => {
                    redisClient.get(COUNT_KEY, (err, reply) => {

                        should.exist(reply);
                        reply.should.be.eql(postData.count);

                        res.should.have.status(200);
                        res.body.should.be.json;
                        res.body.should.not.have.property("error");
                        res.body.should.have.property("message", "Data successfully saved!");

                        done();
                    });
                })
        });
        it("it should correctly increment redis db key", (done) => {
            redisClient.set(COUNT_KEY, 500, (err, reply) => {
                chai.request(app)
                    .post("/track")
                    .send(postData)
                    .end( (err, res) => {
                        redisClient.get(COUNT_KEY, (err, reply) => {

                            should.exist(reply);
                            const finalCount = 500 + postData.count;
                            reply.should.be.eql(finalCount.toString());

                            res.should.have.status(200);
                            res.body.should.be.json;
                            res.body.should.not.have.property("error");
                            res.body.should.have.property("message", "Data successfully saved!");

                            done();
                        })
                    })
            });
        });
        it("it should reject POST that contains negative count", (done) => {
            const invalidPostData = {
                count: -1,
                message: "invalid count"
            }
            chai.request(app)
                .post("/track")
                .send(invalidPostData)
                .end( (err, res) => {
                    redisClient.get(COUNT_KEY, (err, reply) => {

                        should.not.exist(reply);

                        res.should.have.status(400);
                        res.body.should.be.json;
                        res.body.should.have.property("error");
                        
                        done();
                    })
                })
        });
        it("it should save json to file", (done) => {});
        it("it should not save json with invalid count", (done) => {});
    })


})