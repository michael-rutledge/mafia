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
        // TODO: handle failure case
        attemptJoin(socket, data);
    });

    socket.on('userAttemptRejoin', (data) => {
        if (data) {
            data.name = getSanitizedString(data.name);
            data.room = getSanitizedString(data.room);
            // force refresh of state in same room
            MafiaManager.touchRoomState(data.room);
            attemptJoin(socket, data);
        }
    });

    socket.on('userAttemptCreate', (data) => {
        data.name = getSanitizedString(data.name);
        // TODO: clean up the input check logic
        if (!data || data.name.length < 1) return;
        data.room = MafiaManager.reserveNewRoom();
        attemptJoin(socket, data);
    });

    socket.on('hostOptionChange', (data) => {
        var room = getRoomOfSocket(socket);
        if (MafiaManager.changeRoomOption(data.id, data.value, room)) {
            pushStateToClient(room);
        }
    });

    socket.on('startGame', () => {
        var room = getRoomOfSocket(socket);
        if (MafiaManager.startGame(socket, room)) {
            pushStateToClient(room);
        }
    });

    socket.on('playerVote', (data) => {
        var room = getRoomOfSocket(socket);
        if (MafiaManager.playerVote(socket, data.playerName, room)) {
            pushStateToClient(room);
        }
    });

    socket.on('userAttemptLeave', () => {
        debugLog('User ' + socket.id + ' attempted leave');
        leaveRoom(socket);
        socket.emit('leaveSuccess');
    });

    socket.on('disconnecting', () => {
        debugLog(socket.id + ' disconnecting...');
        leaveRoom(socket);
    });

    socket.on('disconnect', () => {
        debugLog('socket ' + socket.id + ' disconnected');
    });
});


// room functions
function leaveRoom(socket) {
    var room = getRoomOfSocket(socket);
    if (room) {
        socket.leave(room, (/*callback*/) => {
            MafiaManager.removeUserFromRoom(socket, room);
            pushStateToClient(room);
        });
    }
}

function pushStateToClient(room) {
    // if room exists, push the update
    if (sio.sockets.adapter.rooms[room]) {
        sio.to(room).emit('pushStateToClient', {
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

function attemptJoin(socket, data) {
    if (!MafiaManager.addUserToRoom(socket, data.name, data.room)) {
        debugLog('JOIN FAILURE');
        return false;
    }
    socket.join(data.room, (/*callback*/) => {
        socket.name = data.name;
        socket.emit('joinSuccess', data);
        pushStateToClient(data.room);
        debugLog('Room map for ' + socket.id);
        debugLog(socket.rooms);
    });
    return true;
}


// utilities
function getRoomOfSocket(socket) {
    return socket.rooms[Object.keys(socket.rooms)[1]];
}

function getSanitizedString(dirty) {
    return sanitizeHtml(dirty, {
        allowedTags: [],
    });
}

function debugLog(msg) {
    if (DEBUG) console.log(msg);
}
