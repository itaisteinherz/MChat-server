const Neo4j = require("./neo4j.js");

// DB class

module.exports = class DB {
    constructor(options) {
        this.neo4j = new Neo4j(options);
    }

    loadDevice(device) { // TODO: Make the promise structure valid.
        return _mergeDeviceIntoDatabase(this.neo4j, device).then((result) => {
            if (result["passphrase"] == device.passphrase) {
                if (result["nickname"] != device.nickname) {
                    return _changeNicknameForUUID(this.neo4j, device, device.nickname);
                }

                // Code to run for valid device...
                return Promise.resolve();
            } else {
                return Promise.reject("Error: Invalid device passphrase entered.");
            }
        });
    }

    changeNickname(device, newNickname) { // TODO: Check if I should accept the new nickname as another parameter, instead of accepting the updated device object.
        return _runIfValidDevice(this.neo4j, device)
            .then(() => _changeNicknameForUUID(this.neo4j, device, newNickname));
    }

    // eslint-disable-next-line no-unused-vars
    changeAvailablePeers(device, change, isAddition, fullList, updateVersion) { // TODO: Add support for versioning. Also, fix bug where if someone who isn't using MChat is a MC advertiser and users of MChat discover him, the `MATCH` statements in the cypher queries would fail.
        return _runIfValidDevice(this.neo4j, device)
            .then(() => {
                if (isAddition) {
                    return _addDeviceSeeingDevice(this.neo4j, device, change);
                } else if (change === "" && fullList.length === 0) {
                    return _removeAllDevicecSeenByDevice(this.neo4j, device);
                } else {
                    return _removeDeviceSeeingDevice(this.neo4j, device, change);
                }
            });
    }

    getConnectedPeers(device) {
        return _runIfValidDevice(this.neo4j, device)
            .then(() => {
                const peersStatement = `MATCH (device:Device {uuid: {uuid}})-[:SEES*]-(devices)
                                        WHERE NOT devices.uuid = {uuid}
                                        WITH DISTINCT devices AS peers
                                        RETURN peers.uuid AS connectedPeers`;
                const peersParams = {
                    uuid: device.UUID
                };

                return this.neo4j.run(peersStatement, peersParams);
            }).then((data) => Promise.resolve(_turnIntoArray(data, "connectedPeers")));
    }

    getConnectedPeersNicknames(device) {
        return _runIfValidDevice(this.neo4j, device)
            .then(() => {
                const peersStatement = `MATCH (device:Device {uuid: {uuid}})
                                        OPTIONAL MATCH (device)-[:SEES*]-(devices) 
                                        WHERE NOT devices.uuid = {uuid}
                                        WITH DISTINCT devices AS peers
                                        RETURN peers.nickname AS connectedPeersNicknames`; // TODO: Check if the OPTIONAL keyword is needed.
                const peersParams = {
                    uuid: device.UUID
                };

                return this.neo4j.run(peersStatement, peersParams);
            })
            .then((data) => _turnIntoArray(data, "connectedPeersNicknames")); // TODO: Check if this is a good solution for returning the processed array.
    }

    getConnectedPeersCount(device) { // TODO: Convert this function to propper promise structure.
        return _runIfValidDevice(this.neo4j, device)
            .then(() => {
                const peersStatement = `MATCH (device:Device {uuid: {uuid}})-[:SEES*]-(devices:Device)
                                        WHERE NOT devices.uuid = {uuid}
                                        RETURN count(DISTINCT devices) AS connectedPeers`;
                const peersParams = {
                    uuid: device.UUID
                };

                return this.neo4j.run(peersStatement, peersParams);
            });
    }

    disconnectDevice(uuid) { // TODO: Find a better solution than the WITH dummy statement.
        const deviceStatement = `MATCH (device:Device {uuid: {uuid}})
                                 SET device.updateVersion = 1 WITH device.updateVersion as updateVersion
                                 MATCH (device)-[rel:SEES]->(:Device)
                                 WHERE NOT rel IS NULL
                                 DELETE rel`;
        const deviceParams = {
            uuid: uuid
        };

        return this.neo4j.run(deviceStatement, deviceParams);
    }

    closeDriver() { // TODO: Make this function better, and check if it is even needed. If it is, make tests for it.
        return this.neo4j.closeDriver();
    }

};

// Internal functions

function _mergeDeviceIntoDatabase(driver, device) {
    const deviceStatement = `MERGE (device:Device {uuid: {uuid}})
                             ON CREATE SET device.nickname = {nickname}, device.passphrase = {passphrase}
                             RETURN device.nickname AS nickname, device.passphrase AS passphrase`; // TODO: Check if I can do all of the authorization and nickname checks in the query
    const deviceParams = {
        nickname: device.nickname,
        uuid: device.UUID,
        passphrase: device.passphrase
    };

    return driver.run(deviceStatement, deviceParams);
}

function _changeNicknameForUUID(driver, device, newNickname) {
    const nicknameStatement = `MATCH (device:Device {uuid: {uuid}})
                               SET device.nickname = {newNickname}`;
    const nicknameParams = {
        uuid: device.UUID,
        newNickname
    };

    return driver.run(nicknameStatement, nicknameParams);
}

function _addDeviceSeeingDevice(driver, device, otherDeviceUUID) {
    const deviceStatement = `MATCH (device:Device {uuid: {uuid}}), (otherDevice:Device {uuid: {otherDeviceUUID}})
                             MERGE (device)-[:SEES]->(otherDevice)`; // TODO: Check if this can be merged into one MERGE statement or not.
    const deviceParams = {
        uuid: device.UUID,
        otherDeviceUUID: otherDeviceUUID
    };

    return driver.run(deviceStatement, deviceParams);
}

function _removeDeviceSeeingDevice(driver, device, otherDeviceUUID) {
    const deviceStatement = `MATCH (:Device {uuid: {uuid}})-[rel:SEES]->(:Device {uuid: {otherDeviceUUID}})
                             DELETE rel`;
    const deviceParams = {
        uuid: device.UUID,
        otherDeviceUUID: otherDeviceUUID
    };

    return driver.run(deviceStatement, deviceParams);
}

function _removeAllDevicecSeenByDevice(driver, device) {
    const deviceStatement = `MATCH (device:Device {uuid: {uuid}})-[rel:SEES]->(:Device)
                             WHERE NOT rel IS NULL
                             DELETE rel`;
    const deviceParams = {
        uuid: device.UUID
    };

    return driver.run(deviceStatement, deviceParams);
}

function _runIfValidDevice(driver, device) { // TODO: Merge all of the function's calls into the querys this is being called from, and delete the function
    const deviceStatement = `MATCH (device:Device {uuid: {uuid}})
                             RETURN device.passphrase AS passphrase`;
    const deviceParams = {
        uuid: device.UUID
    };

    return driver.run(deviceStatement, deviceParams)
        .then((result) => {
            if (result["passphrase"] == device.passphrase || (Object.keys(result).length === 0 && result.constructor === Object)) { // TODO: Check if this is a good solution. Also, find better solution for running if asked to run statement if device is valid before device finishes registration. Also, fix issue where would ask for connected peers count before registration is finished.
                return Promise.resolve();
            } else {
                return Promise.reject("Error: Invalid device passphrase entered.");
            }
        });
}

function _turnIntoArray(data, subscript) {
    if (!data || !data[subscript]) {
        return [];
    } else if (data[subscript] instanceof Array) { // TODO: Check wether I should use "instanceof Array" or "Array.isArray"
        return data[subscript];
    } else {
        return [data[subscript]];
    }
}
