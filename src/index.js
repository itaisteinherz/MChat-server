const Server = require("./server.js"),
    Device = require("./objects/device.js"),
    config = require("../config.json"),
    log = require("./log");

const server = new Server(config["server"]);

server.load.then(() => {
    log(`Listening on *:${config["server"]["httpPort"]}, *:${config["server"]["httpsPort"]}`);
});

const DB = require("./db/index.js"),
    database = new DB(config["database"]),
    io = require("socket.io")(server.httpsServer);

var peers = {};

io.on("connection", function(socket) {
    var connectionDevice;

    var rawHeaders = socket.client.request.rawHeaders,
        userAgent = rawHeaders[rawHeaders.indexOf("User-Agent") + 1], // TODO: Check if I should lower case these strings.
        isValidSource = userAgent.indexOf(config.client.appName) == 0 && userAgent.indexOf("Darwin") > -1; // TODO: Make sure that this is a valid check for the user agent. Also, check if I can convert this into a RegExp.

    socket.on("device_connected", function(data) {
        connectionDevice = new Device(data);
        database.loadDevice(connectionDevice)
            .then(() => {
                peers[connectionDevice.UUID] = socket;
                isValidSource = true; // TODO: Check if this is needed or not
            })
            .catch((err) => {
                log(`Error loading device:\n${err}`);
            });
    });

    socket.on("send_message", function(data) {
        const socketDevice = new Device(data);

        database.getConnectedPeers(socketDevice)
            .then((connectedPeers) => {
                var peer;

                for (peer of connectedPeers) {
                    peers[peer].emit("receive_message", {
                        "nickname": socketDevice.nickname,
                        "UUID": socketDevice.UUID,
                        "message": data["message"]
                    });
                }
            })
            .catch((err) => {
                log(`Error sending message:\n${err}`);
            });
    });

    socket.on("get_connected_peers_count", function(data) {
        const socketDevice = new Device("", data["UUID"], data["passphrase"]);

        database.getConnectedPeersCount(socketDevice) // TODO: Fix issue where getting connected peers count fails because registration wasn't finished yet, and so the error is: "TypeError: Cannot read property 'passphrase' of undefined"
            .then((result) => {
                socket.emit("resolved_peers_count", result["connectedPeers"]["low"]);
            })
            .catch((err) => {
                log(`Error getting connected peers:\n${JSON.stringify(err, null, 2)}`);
            });
    });

    socket.on("get_connected_peers_nicknames", function(data) {
        const socketDevice = new Device("", data["UUID"], data["passphrase"]);

        database.getConnectedPeersNicknames(socketDevice)
            .then((connectedPeersNicknames) => {
                socket.emit("resolved_nicknames", connectedPeersNicknames);
            })
            .catch((err) => {
                log(`Error getting nicknames for UUID:\n${err}`);
            });
    });

    socket.on("available_peers_changed", function(data) {
        const socketDevice = new Device("", data["UUID"], data["passphrase"]);

        database.changeAvailablePeers(socketDevice, data["change"], data["isAddition"], data["fullList"], data["updateVersion"])
            .catch((err) => {
                log(`Error changing available peers of device:\n${err}`);
            });
    });

    socket.on("disconnect", function() {
        if (!isValidSource) {
            return;
        }

        database.disconnectDevice(connectionDevice.UUID)
            .then(() => {
                delete peers[connectionDevice.UUID]; // NOTE: "In some JavaScript engines, the delete keyword might hurt performance as it will undo compile / JIT optimization". SOURCE: http://stackoverflow.com/questions/346021/how-do-i-remove-objects-from-a-javascript-associative-array
            })
            .catch((err) => {
                log(`Error disconnecting device:\n${err}`);
            });
    });
});
