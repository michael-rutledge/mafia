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


sio.sockets.on('connection', (socket) => {
    if (DEBUG) {
        console.log('socket ' + socket.conn.id + ' connected');
    }

    socket.emit('clientConnectMsg', {
        socketId: socket.conn.id
    });

    socket.on('userAttemptEntry', (data) => {
        console.log('User ' + socket.conn.id + ' attempted entry');
        if (data.name.length < 1 || data.room.length < 1) return;
        socket.join(data.room);
        socket.emit('entrySuccess', { room: data.room });
    });

    socket.on('disconnect', () => {
        if (DEBUG)
            console.log('socket ' + socket.conn.id + ' disconnected');
    });
});
