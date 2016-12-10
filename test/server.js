/* eslint-disable no-undef */

const assert = require("assert"),
    Server = require("../src/server.js"),
    serverConfig = require("../config.json")["server"];

var testServer;

describe("Server", function() { // TODO: Check how to write tests for the other getters - and if it's even needed. If it is, then I need to write the tests.
    describe("#constructor(options)", function() {
        it("should return a new server object", function() {
            testServer = new Server(serverConfig);
            assert.equal(testServer instanceof Server, true);

            return testServer.load;
        });
    });

    describe("#get load()", function() {
        it("should return the promise that resolves when the server was started successfully", function() {
            assert.equal(testServer.load instanceof Promise, true);
        });
    });
});
