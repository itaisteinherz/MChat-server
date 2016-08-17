const config = require('./config');
const db = require('db')(config);
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

    socket.on('device_connected', function(data) {
        console.log("Loading device...");
        user = data;
        db.loadDevice(user.nickname, user.UUID, user.passphrase, function() {
            console.log("Loaded device successfully");
        }, function(err) {
            console.log(`Error loading device:\n${err}`);
        });
    });

    socket.on('get_connected_peers', function(data) {
        console.log("Getting connected peers...");
        db.getConnectedPeers(data['UUID'], data['passphrase'], function(result) {
            console.log(`Got ${result['connectedPeers']} connected peers`);
            socket.emit('resolved_peers', result['connectedPeers']['low']);
        }, function(err) {
            console.log(`Error getting connected peers:\n${err}`);
        });
    });

    socket.on('get_nickname_for_uuid', function(uuid) {
        console.log("Getting nickname...");
        db.getNicknameForUUID(uuid, function(result) {
                console.log(`Got nickname ${result} for uuid ${uuid}`);
                socket.emit('resolved_nickname', {
                    "UUID": uuid,
                    "nickname": result['device.nickname']
                });
            },
            function(err) {
                console.log(`Error getting nickname for UUID:\n${err}`);
            });
    });

    socket.on('available_peers_changed', function(data) {
        console.log("Changing available peers of device...");
        db.changeAvailablePeers(data.UUID, data.passphrase, data.change, data.isAddition, data.fullList, data.updateVersion, function() {
            console.log("Changed available peers of device successfully");
        }, function(err) {
            console.log(`Error changing available peers of device:\n${err}`);
        });
    });

    socket.on('disconnect', function() {
        console.log('A user disconnected');
        db.disconnectDevice(user.UUID, function() {
            console.log("Disconnected device successfully");
        }, function(err) {
            console.log(`Error disconnecting device:\n${err}`);
        });
    });
});