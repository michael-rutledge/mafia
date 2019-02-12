const socket = io();

// html elements


// socket events
socket.on('clientConnectMsg', (data) => {
    console.log('You are connected with socket: ' + data.socketId);
});
