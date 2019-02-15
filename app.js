// server requires
const express = require('express');
const app = express();
const serv = require('http').Server(app);
const sio = require('socket.io')(serv, {});

// node requires
const sanitizeHtml = require('sanitize-html');

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
        // TODO: handle people fucking with maxlength in input
        data.name = getSanitizedString(data.name);
        data.room = getSanitizedString(data.room);
        if (!data || data.name.length < 1 || data.room.length < 1) return;
        if (MafiaManager.roomExists(data.room)) {
            joinSuccess(socket, data);
        }
        else {
            // TODO: have failure case
        }
    });

    socket.on('userAttemptRejoin', (data) => {
        if (data) {
            data.name = getSanitizedString(data.name);
            data.room = getSanitizedString(data.room);
            // force refresh of state in same room
            MafiaManager.touchRoomState(data.room);
            joinSuccess(socket, data);
            // TODO: handle that refresh
        }
        else {
            // TODO: have failure case
        }
    });

    socket.on('userAttemptCreate', (data) => {
        data.name = getSanitizedString(data.name);
        // TODO: clean up the input check logic
        if (!data || data.name.length < 1) return;
        data.room = MafiaManager.reserveNewRoom();
        joinSuccess(socket, data);
    });

    socket.on('userAttemptLeave', (data) => {
        data.name = getSanitizedString(data.name);
        data.room = getSanitizedString(data.room);
        debugLog('User ' + socket.id + ' attempted leave');
        leaveRoom(socket, data);
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
function leaveRoom(socket, data) {
    socket.leave(data.room, (/*callback*/) => {
        MafiaManager.removeUserFromRoom(data.name, data.room);
        playersUpdate(data.room);
    });
}

function playersUpdate(room) {
    // if room exists, push the update
    if (sio.sockets.adapter.rooms[room]) {
        sio.to(room).emit('playersUpdate', {
            // TODO: use room socket list to generate user data
            state: MafiaManager.getRoomState(room)
        });
        console.log(sio.sockets.adapter.rooms[room]);
        debugLog('Players left in ' + room + ': ' + sio.sockets.adapter.rooms[room].length);
    }
    else {
        debugLog('No players here; removing room ' + room);
        MafiaManager.removeRoom(room);
    }
}

function joinSuccess(socket, data) {
    if (!MafiaManager.addUserToRoom(socket, data.name, data.room)) {
        debugLog('JOIN FAILURE: name already exists in room');
        return;
    }
    socket.join(data.room, (/*callback*/) => {
        socket.name = data.name;
        socket.emit('joinSuccess', data);
        playersUpdate(data.room);
        debugLog('Room map for ' + socket.id);
        debugLog(socket.rooms);
    });
}


// utilities
function getSanitizedString(dirty) {
    return sanitizeHtml(dirty, {
        allowedTags: ['b', 'i'],
    });
}

function debugLog(msg) {
    if (DEBUG) console.log(msg);
}
