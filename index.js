const db = require('db')("neo4j", "admin");
const express = require('express');

var app = express(),
    server = app.listen(3000, "0.0.0.0", function() {
        console.log('Listening on *:3000');
    }),
    io = require('socket.io')(server);

app.use(express.static('public'));

io.on('connection', function(socket) {
    var user;

    console.log('A user connected with id ' + socket.id);

    socket.on('device_connected', function(data) { // Data will always be in a form of [nickname, uuid, passphrase], e.g: ["Itai", "iPhone Simulator-D1587115-E519-4E75-9354-0A88F8B536BD", "34CE1D88-A4E0-4C5A-8930-ECA5A2D85A57"];
        console.log("Loading device...");
        user = data;
        db.loadDevice(user[0], user[1], user[2], function() {
            console.log("Loaded device successfully");
        }, function(err) {
            console.log(`Error loading device:\n${err}`);
        });
    });

    socket.on('get_nickname_for_uuid', function(uuid) {
        console.log("Getting nickname...");
        db.getNicknameForUUID(uuid, function(result) {
                console.log(`Got nickname ${result} for uuid ${uuid}`);
                socket.emit('resolved_nickname', [uuid, result['device.nickname']]);
            },
            function(err) {
                console.log(`Error getting nickname for UUID:\n${err}`);
            });
    });

    socket.on('available_peers_changed', function(data) { // Data will always be in a form of [uuid, passphrase, change, isAddition, fullList, updateVersion]
        console.log("Changing available peers of device...");
        db.changeAvailablePeers(data[0], data[1], data[2], data[3], data[4], data[5], function() {
            console.log("Changed available peers of device successfully");
        }, function(err) {
            console.log(`Error changing available peers of device:\n${err}`);
        });
    });

    socket.on('disconnect', function() {
        db.disconnectDevice(user[1], function() {
            console.log("Disconnected device successfully");
        }, function(err) {
            console.log(`Error disconnecting device:\n${err}`);
        });
        console.log('A user disconnected');
    });
});