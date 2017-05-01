const Server = require("./server");
const DB = require("./db/index");
const Device = require(".device");
const log = require("./log");

const config = require("../config");

const server = new Server(config["server"]);
const io = require("socket.io")(server.httpsServer);
const database = new DB(config["database"]);

let peers = new Map();

server.load
    .then(() => {
        log(`Listening on *:${config["server"]["httpPort"]}, *:${config["server"]["httpsPort"]}`);
    })
    .catch((err) => {
        log(`Error loading the server:\n${err}`);
    });

io.on("connection", (socket) => {
    let connectionDevice, isValidSource;

    const userAgent = socket.request.headers["user-agent"]; // TODO: Check if I should lower case these strings. Also, move to using a RegExp.
    isValidSource = userAgent.indexOf(config.client.appName) === 0 && userAgent.indexOf("Darwin") > -1; // TODO: Make sure that this is a valid check for the user agent. Also, check if I can convert this into a RegExp.

    socket.on("device_connected", (data) => {
        connectionDevice = new Device(data);

        database.loadDevice(connectionDevice)
            .then(() => {
                peers.set(connectionDevice.UUID, socket);
                isValidSource = true; // TODO: Check if this is needed or not

                socket.emit("connect_status", {success: true});
            })
            .catch((err) => {
                socket.emit("connect_status", {success: false});

                log(`Error loading device:\n${err}`);
            });
    });

    socket.on("change_nickname", (data) => {
        const socketDevice = new Device(data);

        database.changeNickname(socketDevice, data["newNickname"])
            .catch((err) => {
                log(`Error updating nickname of device:\n${err}`);
            });
    });

    socket.on("send_message", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeers(socketDevice)
            .then((connectedPeers) => {
                for (const peer of connectedPeers) {
                    peers.get(peer).emit("receive_message", {
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

    socket.on("get_nicknames_of_peers", (data) => {
        const socketDevice = new Device(data);

        database.getNicknamesOfPeers(socketDevice, data["peers"])
            .then((nicknames) => {
                socket.emit("resolved_nicknames_of_peers", nicknames);
            })
            .catch((err) => {
                log(`Error getting nicknames of peers:\n${err}`);
            });
    });

    socket.on("get_connected_peers_count", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeersCount(socketDevice) // TODO: Fix issue where getting connected peers count fails because registration wasn't finished yet, and so the error is: "TypeError: Cannot read property 'passphrase' of undefined"
            .then((result) => {
                socket.emit("resolved_peers_count", result["connectedPeers"]["low"]);
            })
            .catch((err) => {
                log(`Error getting connected peers:\n${err}`);
            });
    });

    socket.on("get_connected_peers_nicknames", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeersNicknames(socketDevice)
            .then((connectedPeersNicknames) => {
                socket.emit("resolved_nicknames", connectedPeersNicknames);
            })
            .catch((err) => {
                log(`Error getting nicknames for UUID:\n${err}`);
            });
    });

    socket.on("available_peers_changed", (data) => {
        const socketDevice = new Device(data);

        database.changeAvailablePeers(socketDevice, data["change"], data["isAddition"], data["fullList"], data["updateVersion"])
            .catch((err) => {
                log(`Error changing available peers of device:\n${err}`);
            });
    });

    socket.on("disconnect", () => {
        if (!isValidSource || !connectionDevice) { // TODO: Check if there's a better solution for ignoring a socket's disconnect if it didn't connect properly.
            return;
        }

        database.disconnectDevice(connectionDevice.UUID)
            .then(() => {
                peers.delete(connectionDevice.UUID);
            })
            .catch((err) => {
                log(`Error disconnecting device:\n${err}`);
            });
    });
});
