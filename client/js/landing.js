const socket = io();

// html elements
var divEntry = document.getElementById('divEntry');
var entryForm = document.getElementById('entryForm');
var entryTextName = document.getElementById('entryTextName');
var entryTextRoom = document.getElementById('entryTextRoom');
var entryButtonJoin = document.getElementById('entryButtonJoin');
var divGame = document.getElementById('divGame');
var roomHeader = document.getElementById('roomHeader');

// html element actions
entryForm.onsubmit = (e) => {
    e.preventDefault();
    var name = entryTextName.value;
    var room = entryTextRoom.value;
    socket.emit('userAttemptEntry', { name: name, room: room });
};

// socket events
socket.on('entrySuccess', (data) => {
    roomHeader.innerHTML = "Room: " + data.room;
    divGame.style.display = "inline";
    divEntry.style.display = "none";
    entryTextName.value = '';
    entryTextRoom.value = '';
});

socket.on('clientConnectMsg', (data) => {
    console.log('You are connected with socket: ' + data.socketId);
});
