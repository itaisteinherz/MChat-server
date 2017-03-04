const { v4: uuid } = require("uuid");

const assert = require("assert");

const DB = require("../src/db/index.js");
const Neo4j = require("../src/db/neo4j.js");
const Device = require("../src/objects/device.js");
const databaseConfig = require("../config.json")["database"];

let testNeo4j, testDatabase, testDevice, otherTestDevice;

describe("DB", function() {
    before("initialize and clear database", function() { // NOTE: This runs before all tests in this block.
        testDevice = new Device("John Doe", `${uuid()}-TEST`, uuid());
        otherTestDevice = new Device("Jony Ive", `${uuid()}-TEST`, uuid());
        testNeo4j = new Neo4j(databaseConfig);

        return testNeo4j.run("MATCH (device:Device {uuid: {uuid}}), (otherDevice:Device {uuid: {otherUUID}}) DETACH DELETE device", {
            uuid: testDevice.UUID,
            otherUUID: otherTestDevice.UUID
        });
    });

    describe("#constructor(options)", function() {
        it("should return a new db object", function() {
            testDatabase = new DB(databaseConfig);
            assert.equal(testDatabase instanceof DB, true);
        });
    });

    describe("#loadDevice(device)", function() { // TODO: Make this test better.
        it("should load the given device", function() {
            return testDatabase.loadDevice(testDevice);
        });
    });

    describe("#changeNickname(device, newNickname)", function() {
        it("should change the given device's nickname", function() {
            testDevice.nickname = "John Appleseed"; // NOTE: This is only for the assertion later on.

            return testDatabase.changeNickname(testDevice, testDevice.nickname)
                .then(function() {
                    return testNeo4j.run("MATCH (d:Device {uuid: {uuid}}) RETURN d.nickname AS newNickname", { // TODO: Check if the OPTIONAL keyword is needed.
                        uuid: testDevice.UUID
                    });
                })
                .then(function(result) {
                    assert.equal(result["newNickname"], testDevice.nickname);
                });
        });
    });

    describe("#changeAvailablePeers(device, change, isAddition, fullList, updateVersion)", function() { // TODO: Make this test nicer. Also, add a test for when only one device is removed, and not all. Make the test messages more accurate.
        it("should remove the given device's connected peers", function() {
            const statement = `MATCH (device:Device {uuid: {uuid}})
                               CREATE (otherDevice:Device {uuid: {otherUUID}, nickname: {otherNickname}, passphrase: {otherPassphrase}})
                               MERGE (device)-[:SEES]->(otherDevice)`;

            const params = {
                uuid: testDevice.UUID,
                otherUUID: otherTestDevice.UUID,
                otherNickname: otherTestDevice.nickname,
                otherPassphrase: otherTestDevice.passphrase
            };

            return testNeo4j.run(statement, params)
                .then(function() {
                    return testDatabase.changeAvailablePeers(testDevice, "", false, [], 1);
                })
                .then(function() {
                    return testNeo4j.run("MATCH (d:Device {uuid: {uuid}})-[r:SEES]->(:Device) RETURN count(r) AS rels", { // TODO: Check if wether I need to split the match statement into to or not.
                        uuid: testDevice.UUID
                    });
                })
                .then(function(result) {
                    assert.equal(result["rels"], 0);
                });
        });

        it("should change the given device's connected peers", function() { // TODO: Add assertion for the other device's UUID
            return testDatabase.changeAvailablePeers(testDevice, otherTestDevice.UUID, true, [otherTestDevice.UUID], 1)
                .then(function() {
                    return testNeo4j.run("MATCH (d:Device {uuid: {uuid}})-[r:SEES]->(:Device) RETURN count(r) AS rels", {
                        uuid: testDevice.UUID
                    });
                })
                .then(function(result) {
                    assert.equal(result["rels"], 1);
                });
        });
    });

    describe("#getConnectedPeers(device)", function() {
        it("should return the given device's connected peers", function() {
            return testDatabase.getConnectedPeers(testDevice)
                .then(function(result) {
                    assert.equal(result instanceof Array, true); // TODO: Check wether I should use instanceof Array or Array.isArray
                    assert.equal(result[0], otherTestDevice.UUID);
                    assert.equal(result.length, 1);
                });
        });
    });

    describe("#getConnectedPeersNicknames(device)", function() {
        it("should return the connected peers' nicknames", function() {
            return testDatabase.getConnectedPeersNicknames(testDevice)
                .then(function(result) {
                    assert.equal(result instanceof Array, true); // TODO: Check wether I should use instanceof Array or Array.isArray
                    assert.equal(result[0], otherTestDevice.nickname);
                    assert.equal(result.length, 1);
                });
        });
    });

    describe("#getConnectedPeersCount(device)", function() {
        it("should return the amount of peers connected to the given device", function() {
            return testDatabase.getConnectedPeersCount(testDevice)
                .then(function(result) {
                    assert.equal(result["connectedPeers"], 1);
                });
        });
    });

    describe("#disconnectDevice(uuid)", function() { // TODO: Make this test better.
        it("should remove all relationships made by the device and set the update version to 1", function() {
            return testDatabase.disconnectDevice(testDevice.UUID)
                .then(function() {
                    return testNeo4j.run("MATCH (d:Device {uuid: {uuid}}) OPTIONAL MATCH (d)-[r:SEES]->(:Device) RETURN count(r) AS rels, d.updateVersion AS updateVersion", { // TODO: Check if the OPTIONAL keyword is needed.
                        uuid: testDevice.UUID
                    });
                })
                .then(function(result) {
                    assert.equal(result["rels"], 0);
                    assert.equal(result["updateVersion"], 1);
                });
        });
    });

    after("clear database", function() { // NOTE: This runs after all tests in this block.
        return testNeo4j.run("MATCH (device:Device {uuid: {uuid}}), (otherDevice:Device {uuid: {otherUUID}}) DETACH DELETE device, otherDevice", { // TODO: Check if the DETACH is needed.
            uuid: testDevice.UUID,
            otherUUID: otherTestDevice.UUID
        }).then(function() {
            assert.equal(testNeo4j.closeDriver(), true);
            assert.equal(testDatabase.closeDriver(), true);
        });
    });
});
