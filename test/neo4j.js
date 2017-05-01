const assert = require("assert");

const databaseConfig = require("../config")["database"];
const Neo4j = require("../src/db/neo4j");

const testName = "Jon Stewart";

let testNeo4j;

describe("Neo4j", function() { // TODO: Add tests for the internal _parseData function
    describe("#constructor(options)", function() {
        it("should return a new neo4j object", function() {
            testNeo4j = new Neo4j(databaseConfig);
            assert.equal(testNeo4j instanceof Neo4j, true);
        });
    });

    describe("#run(statement, params)", function() {
        it("should run the given statement and return a promise", function() {
            const params = {
                name: testName
            };

            return testNeo4j.run("MERGE (p:TestPerson {name: {name}}) RETURN p.name AS name", params)
                .then((result) => assert.equal(result["name"], testName));
        });
    });

    describe("#closeDriver()", function() {
        it("should close the driver and return true if the operation was successful", function() {
            assert.equal(testNeo4j.closeDriver(), true);
        });
    });

    after("clear database", function() { // NOTE: This runs after all tests in this block.
        testNeo4j = new Neo4j(databaseConfig); // NOTE: This is done since in the last test we close the driver, and so we need to re-open it.

        const params = {
            name: testName
        };

        return testNeo4j.run("MATCH (p:TestPerson {name: {name}}) DELETE p", params)
            .then(function() {
                assert.equal(testNeo4j.closeDriver(), true);
            });
    });
});
