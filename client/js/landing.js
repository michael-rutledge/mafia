const socket = io();

// html elements
var divEntry = document.getElementById('divEntry');
var entryForm = document.getElementById('entryForm');
var entryTextName = document.getElementById('entryTextName');
var entryButtonJoin = document.getElementById('entryButtonJoin');

// html element actions
entryForm.onsubmit = (e) => {
    e.preventDefault();
    var val = entryTextName.value;
    if (val.length < 1) return;
    socket.emit('userAttemptEntry', { name: val });
    entryTextName.value = '';
};

// socket events
socket.on('clientConnectMsg', (data) => {
    console.log('You are connected with socket: ' + data.socketId);
});
