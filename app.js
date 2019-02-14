// node requires
const express = require('express');
const app = express();
const serv = require('http').Server(app);
const sio = require('socket.io')(serv, {});

// internal requires
const MafiaManager = require('./server/mafiaManager');

// constants and vars
const DEBUG = true

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/client/index.html");
});
app.use('/client', express.static(__dirname + '/client'));
serv.listen(3000);
console.log('Server started.');


// properties for all sockets
sio.sockets.on('connection', (socket) => {
    debugLog('socket ' + socket.id + ' connected');

    socket.emit('clientConnected', {
        socketId: socket.id
    });

    socket.on('userAttemptJoin', (data) => {
        debugLog('User ' + socket.id + ' attempted join');
        // TODO: sanitize input and check if room was created first
        if (!data || data.name.length < 1 || data.room.length < 1) return;
        if (MafiaManager.roomExists(data.room)) {
            joinSuccess(socket, data);
        }
        else {
            // TODO: have failure case
        }
    });

    socket.on('userAttemptRejoin', (data) => {
        // TODO: santize saved data
        if (data) {
            // force refresh of state in same room
            MafiaManager.getRoomState(data.room);
            joinSuccess(socket, data);
            // TODO: handle that refresh
        }
        else {
            // TODO: have failure case
        }
    });

    socket.on('userAttemptCreate', (data) => {
        // TODO: sanitize input
        data.room = MafiaManager.reserveNewRoom();
        joinSuccess(socket, data);
    });

    socket.on('userAttemptLeave', (data) => {
        debugLog('User ' + socket.id + ' attempted leave');
        leaveRoom(socket, data.room);
        socket.emit('leaveSuccess');
    });

    socket.on('disconnecting', () => {
        debugLog(socket.id + ' disconnecting...');
        for (var room in socket.rooms) {
            debugLog('    from room: ' + room);
            leaveRoom(socket, room);
        }
    });

    socket.on('disconnect', () => {
        debugLog('socket ' + socket.id + ' disconnected');
    });
});


// room functions
function leaveRoom(socket, room) {
    socket.leave(room, (/*callback*/) => {
        playersUpdate(room);
    });
}

function playersUpdate(room) {
    // if room exists, push the update
    if (sio.sockets.adapter.rooms[room]) {
        sio.to(room).emit('playersUpdate', {
            // TODO: use room socket list to generate user data
            players: sio.sockets.adapter.rooms[room].sockets
        });
        console.log(sio.sockets.adapter.rooms[room]);
        debugLog('Players left in ' + room + ': ' + sio.sockets.adapter.rooms[room].length);
    }
    else {
        debugLog('All players gone from room ' + room);
        MafiaManager.removeRoom(room);
    }
}

function joinSuccess(socket, data) {
    socket.join(data.room, (/*callback*/) => {
        socket.name = data.name;
        socket.emit('joinSuccess', data);
        playersUpdate(data.room);
        debugLog('Room map for ' + socket.id);
        debugLog(socket.rooms);
    });
}


// utilities
function debugLog(msg) {
    if (DEBUG) console.log(msg);
}
