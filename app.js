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
        // TODO: actually keep track of users that connect per room
        console.log('User ' + socket.conn.id + ' attempted entry');
    });

    socket.on('disconnect', () => {
        if (DEBUG)
            console.log('socket ' + socket.conn.id + ' disconnected');
    });
});
