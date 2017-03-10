const Server = require("./server.js");
const DB = require("./db/index.js");
const Device = require("./objects/device.js");
const config = require("../config");
const log = require("./log.js");

const server = new Server(config["server"]);
const io = require("socket.io")(server.httpsServer);
const database = new DB(config["database"]);

let peers = new Map();

server.load.then(() => log(`Listening on *:${config["server"]["httpPort"]}, *:${config["server"]["httpsPort"]}`));

io.on("connection", (socket) => {
    let connectionDevice, isValidSource;

    const rawHeaders = socket.client.request.rawHeaders;
    const userAgent = rawHeaders[rawHeaders.indexOf("User-Agent") + 1]; // TODO: Check if I should lower case these strings. Also, move to using a RegExp.
    isValidSource = userAgent.indexOf(config.client.appName) == 0 && userAgent.indexOf("Darwin") > -1; // TODO: Make sure that this is a valid check for the user agent. Also, check if I can convert this into a RegExp.

    socket.on("device_connected", (data) => {
        connectionDevice = new Device(data);

        database.loadDevice(connectionDevice)
            .then(() => {
                peers.set(connectionDevice.UUID, socket);
                isValidSource = true; // TODO: Check if this is needed or not
            })
            .catch((err) => log(`Error loading device:\n${err}`));
    });

    socket.on("change_nickname", (data) => {
        const socketDevice = new Device(data);

        database.changeNickname(socketDevice, data["newNickname"])
            .catch((err) => log(`Error updating nickname of device:\n${err}`));
    });

    socket.on("send_message", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeers(socketDevice)
            .then((connectedPeers) =>
                connectedPeers.forEach((peer) => peers.get(peer).emit("receive_message", {
                    "nickname": socketDevice.nickname,
                    "UUID": socketDevice.UUID,
                    "message": data["message"]
                }))
            )
            .catch((err) => log(`Error sending message:\n${err}`));
    });

    socket.on("get_connected_peers_count", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeersCount(socketDevice) // TODO: Fix issue where getting connected peers count fails because registration wasn't finished yet, and so the error is: "TypeError: Cannot read property 'passphrase' of undefined"
            .then((result) => socket.emit("resolved_peers_count", result["connectedPeers"]["low"]))
            .catch((err) => {
                log(`Error getting connected peers:\n${JSON.stringify(err, null, 2)}`);
            });
    });

    socket.on("get_connected_peers_nicknames", (data) => {
        const socketDevice = new Device(data);

        database.getConnectedPeersNicknames(socketDevice)
            .then((connectedPeersNicknames) => socket.emit("resolved_nicknames", connectedPeersNicknames))
            .catch((err) => {
                log(`Error getting nicknames for UUID:\n${err}`);
            });
    });

    socket.on("available_peers_changed", (data) => {
        const socketDevice = new Device(data);

        database.changeAvailablePeers(socketDevice, data["change"], data["isAddition"], data["fullList"], data["updateVersion"])
            .catch((err) => log(`Error changing available peers of device:\n${err}`));
    });

    socket.on("disconnect", () => {
        if (!isValidSource) {
            return;
        }

        database.disconnectDevice(connectionDevice.UUID)
            .then(() => peers.delete(connectionDevice.UUID))
            .catch((err) => log(`Error disconnecting device:\n${err}`));
    });
});
