// node requires
const express = require('express');
const app = express();
const serv = require('http').Server(app);
const sio = require('socket.io')(serv, {});

// internal requires
const Hasher = require('./server/hasher');

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

    socket.on('userAttemptEntry', (data) => {
        debugLog('User ' + socket.id + ' attempted entry');
        if (data.name.length < 1 || data.room.length < 1) return;
        entrySuccess(socket, data);
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
    sio.to(room).emit('playersUpdate', {
        // TODO: use room socket list to generate user data
        players: sio.sockets.adapter.rooms[room]//.sockets
    });
    if (sio.sockets.adapter.rooms[room]) {
        console.log(sio.sockets.adapter.rooms[room]);
        debugLog('Players left in ' + room + ': ' + sio.sockets.adapter.rooms[room].length);
    }
}

function entrySuccess(socket, data) {
    socket.join(data.room, (/*callback*/) => {
        socket.name = data.name;
        socket.emit('entrySuccess', data);
        playersUpdate(data.room);
        debugLog('Room map for ' + socket.id);
        debugLog(socket.rooms);
    });
}


// utilities
function debugLog(msg) {
    if (DEBUG) console.log(msg);
}
