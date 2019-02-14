const socket = io();

// html elements
var divEntry = document.getElementById('divEntry');
var entryForm = document.getElementById('entryForm');
var entryTextName = document.getElementById('entryTextName');
var entryTextRoom = document.getElementById('entryTextRoom');
var entryButtonJoin = document.getElementById('entryButtonJoin');
var divGame = document.getElementById('divGame');
var roomHeader = document.getElementById('roomHeader');
var playerList = document.getElementById('playerList');

// html element actions
entryForm.onsubmit = (e) => {
    e.preventDefault();
    var name = entryTextName.value;
    var room = entryTextRoom.value;
    socket.emit('userAttemptEntry', { name: name, room: room });
};

// utility functions
var getElem = (id) => {
    return document.getElementById(id);
};

var clearEntry = () => {
    entryTextName.value = '';
    entryTextRoom.value = '';
};

// socket events
socket.on('entrySuccess', (data) => {
    roomHeader.innerHTML = "Room: " + data.room;
    divGame.style.display = "inline";
    divEntry.style.display = "none";
    clearEntry();
});

socket.on('playersUpdate', (data) => {
    console.log('playersUpdate');
    playerList.innerHTML = '<ul>';
    for (var player in data.players) {
        playerList.innerHTML += '<li>' + player.id + '</li>';
    }
    playerList.innerHTML += '</ul>';
});

socket.on('clientConnected', (data) => {
    clearEntry();
    console.log('You are connected with socket: ' + data.socketId);
});
