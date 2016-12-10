/* eslint-disable no-undef */

const assert = require("assert"),
    Device = require("../src/objects/device.js");

var testDevice;

describe("Device", function() {
    describe("#constructor(nickname, UUID, passphrase)", function() {
        it("should return a new device object", function() {
            testDevice = new Device("nickname", "UUID", "passphrase");
            assert.equal(testDevice instanceof Device, true);
        });
    });

    describe("#serialize()", function() {
        it("should return a JSON object containing all of the device's properties", function() {
            const serializedJSON = testDevice.serialize();

            assert.equal(serializedJSON["nickname"], "nickname");
            assert.equal(serializedJSON["UUID"], "UUID");
            assert.equal(serializedJSON["passphrase"], "passphrase");
        });
    });

    describe("#get nickname()", function() {
        it("should return the nickname of the device", function() {
            assert.equal(testDevice.nickname, "nickname");
        });
    });

    describe("#get UUID()", function() {
        it("should return the UUID of the device", function() {
            assert.equal(testDevice.UUID, "UUID");
        });
    });

    describe("#get passphrase()", function() {
        it("should return the passphrase of the device", function() {
            assert.equal(testDevice.passphrase, "passphrase");
        });
    });

    describe("#set nickname()", function() {
        it("should set the nickname of the device", function() {
            testDevice.nickname = "newNickname";
            assert.equal(testDevice.nickname, "newNickname");
        });
    });

    describe("#set UUID()", function() {
        it("should set the UUID of the device", function() {
            testDevice.UUID = "newUUID";
            assert.equal(testDevice.UUID, "newUUID");
        });
    });

    describe("#set passphrase()", function() {
        it("should set the passphrase of the device", function() {
            testDevice.passphrase = "newPassphrase";
            assert.equal(testDevice.passphrase, "newPassphrase");
        });
    });
});
